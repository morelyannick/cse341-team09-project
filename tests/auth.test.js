import { describe, expect, test, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { getDb } from '../src/db/connect.js';
import { requireApiLogin, requireApiRole } from '../src/middleware/auth.js';
import express from 'express';
import session from 'express-session';
import { loadSessionUser } from '../src/middleware/auth.js';

describe('Authentication & Authorization Suite', () => {
    beforeEach(async () => {
        // Ensure roles collection has default roles
        const db = getDb();
        await db.collection('roles').deleteMany({});
        await db.collection('roles').insertMany([
            { name: 'customer' },
            { name: 'admin' }
        ]);
        await db.collection('users').deleteMany({});
    });

    test('GET /register returns 200 with registration form', async () => {
        const response = await request(app).get('/register');
        expect(response.status).toBe(200);
        expect(response.text).toContain('Create an Account');
    });

    test('POST /register creates a new customer user and starts a session', async () => {
        const response = await request(app)
            .post('/register')
            .send({
                name: 'Test Customer',
                username: 'testcust',
                email: 'customer@example.com',
                password: 'password123'
            });

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe('/');

        const db = getDb();
        const user = await db.collection('users').findOne({ email: 'customer@example.com' });
        expect(user).not.toBeNull();
        expect(user.passwordHash).not.toBe('password123'); // Password must be hashed
        expect(user.username).toBe('testcust');
    });

    test('POST /register rejects duplicate email with 400', async () => {
        await request(app)
            .post('/register')
            .send({
                name: 'Test Customer 1',
                username: 'user1',
                email: 'dup@example.com',
                password: 'password123'
            });

        const duplicateResponse = await request(app)
            .post('/register')
            .send({
                name: 'Test Customer 2',
                username: 'user2',
                email: 'dup@example.com',
                password: 'password456'
            });

        expect(duplicateResponse.status).toBe(400);
        expect(duplicateResponse.text).toContain('already exists');
    });

    test('GET /login returns 200 with login form', async () => {
        const response = await request(app).get('/login');
        expect(response.status).toBe(200);
        expect(response.text).toContain('Sign In');
    });

    test('POST /login logs in customer and sets cookie', async () => {
        // Register user
        await request(app)
            .post('/register')
            .send({
                name: 'Login User',
                username: 'loginuser',
                email: 'login@example.com',
                password: 'password123'
            });

        const loginResponse = await request(app)
            .post('/login')
            .send({
                email: 'login@example.com',
                password: 'password123'
            });

        expect(loginResponse.status).toBe(302);
        expect(loginResponse.headers.location).toBe('/');
        expect(loginResponse.headers['set-cookie']).toBeDefined();
    });

    test('POST /login rejects invalid credentials with 401', async () => {
        const loginResponse = await request(app)
            .post('/login')
            .send({
                email: 'wrong@example.com',
                password: 'badpassword'
            });

        expect(loginResponse.status).toBe(401);
        expect(loginResponse.text).toContain('Invalid email or password');
    });

    test('GET /admin/dashboard redirects unauthenticated users to /login', async () => {
        const response = await request(app).get('/admin/dashboard');
        expect(response.status).toBe(302);
        expect(response.headers.location).toBe('/login');
    });

    test('GET /admin/dashboard returns 403 Forbidden for customer users', async () => {
        const agent = request.agent(app);

        // Register as customer
        await agent
            .post('/register')
            .send({
                name: 'Regular Customer',
                username: 'regcust',
                email: 'reg@example.com',
                password: 'password123'
            });

        // Try to access admin dashboard
        const response = await agent.get('/admin/dashboard');
        expect(response.status).toBe(403);
        expect(response.text).toContain('Access Forbidden');
    });

    test('GET /admin/dashboard grants access to admin users', async () => {
        const db = getDb();
        const adminRole = await db.collection('roles').findOne({ name: 'admin' });
        const bcrypt = (await import('bcrypt')).default;
        const passwordHash = await bcrypt.hash('adminpass', 12);

        await db.collection('users').insertOne({
            name: 'Admin User',
            username: 'adminuser',
            email: 'admin@example.com',
            passwordHash,
            role: adminRole._id
        });

        const agent = request.agent(app);
        const loginResponse = await agent
            .post('/login')
            .send({
                email: 'admin@example.com',
                password: 'adminpass'
            });

        expect(loginResponse.status).toBe(302);
        expect(loginResponse.headers.location).toBe('/admin/dashboard');

        const dashboardResponse = await agent.get('/admin/dashboard');
        expect(dashboardResponse.status).toBe(200);
        expect(dashboardResponse.text).toContain('Welcome to the Admin Dashboard');
    });

    test('API middleware: requireApiLogin returns 401 for unauthenticated requests', async () => {
        const testApp = express();
        testApp.use(session({ secret: 'test-secret', resave: false, saveUninitialized: false }));
        testApp.use(loadSessionUser);
        testApp.get('/test-api-protected', requireApiLogin, (req, res) => res.json({ ok: true }));

        const response = await request(testApp).get('/test-api-protected');
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message', 'Authentication required');
    });

    test('API middleware: requireApiRole returns 403 for unauthorized roles', async () => {
        const testApp = express();
        testApp.use(session({ secret: 'test-secret', resave: false, saveUninitialized: false }));
        testApp.use((req, res, next) => {
            req.session.user = { id: '123', role: 'customer' };
            next();
        });
        testApp.use(loadSessionUser);
        testApp.get('/test-admin-api', requireApiRole('admin'), (req, res) => res.json({ ok: true }));

        const response = await request(testApp).get('/test-admin-api');
        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty('message', 'Forbidden');
    });

    test('GET /logout destroys session and redirects to /', async () => {
        const agent = request.agent(app);

        await agent
            .post('/register')
            .send({
                name: 'Logout User',
                username: 'logoutuser',
                email: 'logout@example.com',
                password: 'password123'
            });

        const logoutResponse = await agent.get('/logout');
        expect(logoutResponse.status).toBe(302);
        expect(logoutResponse.headers.location).toBe('/');
    });
});
