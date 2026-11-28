
import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { createUser } from '../src/models/users.js';

describe('User Administration API', () => {
    const createCustomer = async (suffix = 'customer') => {
        return createUser({
            name: 'Test Customer',
            username: `${suffix}user`,
            email: `${suffix}@example.com`,
            password: 'password123',
            roleName: 'customer'
        });
    };

    const createAdmin = async () => {
        return createUser({
            name: 'Admin User',
            username: 'adminuser',
            email: 'admin@example.com',
            password: 'adminpass123',
            roleName: 'admin'
        });
    };

    const login = async (agent, email, password = 'password123') => {
        return agent.post('/login').send({ email, password });
    };

    test('GET /api/users returns 401 when signed out', async () => {
        const response = await request(app).get('/api/users');

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Authentication required');
    });

    test('GET /admin/users redirects signed-out users to login', async () => {
        const response = await request(app).get('/admin/users');

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe('/login');
    });

    test('customer can view only their own account', async () => {
        await createCustomer('first');
        await createCustomer('second');

        const agent = request.agent(app);

        await login(agent, 'first@example.com');

        const response = await agent.get('/api/users');

        expect(response.status).toBe(200);
        expect(response.body.users).toHaveLength(1);
        expect(response.body.users[0].email).toBe('first@example.com');
        expect(response.body.users[0]).not.toHaveProperty('passwordHash');
    });

    test('customer can update their own account', async () => {
        const customer = await createCustomer('update');
        const agent = request.agent(app);

        await login(agent, 'update@example.com');

        const response = await agent
            .patch(`/api/users/${customer._id}`)
            .send({
                name: 'Updated Customer',
                username: 'updatedcustomer',
                email: 'updated@example.com'
            });

        expect(response.status).toBe(200);
        expect(response.body.user.name).toBe('Updated Customer');
        expect(response.body.user.username).toBe('updatedcustomer');
        expect(response.body.user.email).toBe('updated@example.com');
        expect(response.body.user).not.toHaveProperty('passwordHash');

        const listResponse = await agent.get('/api/users');

        expect(listResponse.status).toBe(200);
        expect(listResponse.body.users[0].email).toBe('updated@example.com');
    });

    test('customer cannot update another user', async () => {
        const otherCustomer = await createCustomer('other');
        await createCustomer('owner');

        const agent = request.agent(app);
        await login(agent, 'owner@example.com');

        const response = await agent
            .patch(`/api/users/${otherCustomer._id}`)
            .send({ name: 'Unauthorized Change' });

        expect(response.status).toBe(403);
    });

    test('customer cannot delete another user', async () => {
        const otherCustomer = await createCustomer('other');
        await createCustomer('owner');

        const agent = request.agent(app);
        await login(agent, 'owner@example.com');

        const response = await agent.delete(`/api/users/${otherCustomer._id}`);

        expect(response.status).toBe(403);
    });

    test('customer cannot change their own role', async () => {
        const customer = await createCustomer('role');
        const agent = request.agent(app);

        await login(agent, 'role@example.com');

        const response = await agent
            .patch(`/api/users/${customer._id}`)
            .send({ role: 'admin' });

        expect(response.status).toBe(400);
    });

    test('admin can view all users', async () => {
        await createCustomer('first');
        await createCustomer('second');
        await createAdmin();

        const agent = request.agent(app);
        await login(agent, 'admin@example.com', 'adminpass123');

        const response = await agent.get('/api/users');

        expect(response.status).toBe(200);
        expect(response.body.users).toHaveLength(3);
        expect(response.body.users.every(
            (user) => !Object.hasOwn(user, 'passwordHash')
        )).toBe(true);
    });

    test('admin can update another user', async () => {
        const customer = await createCustomer('target');
        await createAdmin();

        const agent = request.agent(app);
        await login(agent, 'admin@example.com', 'adminpass123');

        const response = await agent
            .patch(`/api/users/${customer._id}`)
            .send({ name: 'Admin Updated Name' });

        expect(response.status).toBe(200);
        expect(response.body.user.name).toBe('Admin Updated Name');
    });

    test('admin can delete another user', async () => {
        const customer = await createCustomer('target');
        await createAdmin();

        const agent = request.agent(app);
        await login(agent, 'admin@example.com', 'adminpass123');

        const response = await agent.delete(`/api/users/${customer._id}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('User deleted successfully');

        const listResponse = await agent.get('/api/users');

        expect(listResponse.body.users).toHaveLength(1);
    });

    test('customer can delete their own account and their session ends', async () => {
        const customer = await createCustomer('selfdelete');
        const agent = request.agent(app);

        await login(agent, 'selfdelete@example.com');

        const response = await agent.delete(`/api/users/${customer._id}`);

        expect(response.status).toBe(200);
        expect(response.body.loggedOut).toBe(true);

        const followUpResponse = await agent.get('/api/users');

        expect(followUpResponse.status).toBe(401);
    });

    test('customer can access the user administration page', async () => {
        await createCustomer('pagecustomer');

        const agent = request.agent(app);
        await login(agent, 'pagecustomer@example.com');

        const response = await agent.get('/admin/users');

        expect(response.status).toBe(200);
        expect(response.text).toContain('User Administration');
    });

    test('admin can access the user administration page', async () => {
        await createAdmin();

        const agent = request.agent(app);
        await login(agent, 'admin@example.com', 'adminpass123');

        const response = await agent.get('/admin/users');

        expect(response.status).toBe(200);
        expect(response.text).toContain('User Administration');
    });
    test('unauthenticated users cannot update accounts', async () => {
        const customer = await createCustomer('unauthupdate');

        const response = await request(app)
            .patch(`/api/users/${customer._id}`)
            .send({ name: 'Unauthorized Update' });

        expect(response.status).toBe(401);
    });

    test('unauthenticated users cannot delete accounts', async () => {
        const customer = await createCustomer('unauthdelete');

        const response = await request(app)
            .delete(`/api/users/${customer._id}`);

        expect(response.status).toBe(401);
    });

    test('invalid user IDs are rejected', async () => {
        const agent = request.agent(app);
        await createCustomer('invalidid');
        await login(agent, 'invalidid@example.com');

        const updateResponse = await agent
            .patch('/api/users/not-an-id')
            .send({ name: 'Invalid ID' });

        const deleteResponse = await agent
            .delete('/api/users/not-an-id');

        expect(updateResponse.status).toBe(400);
        expect(deleteResponse.status).toBe(400);
    });

    test('duplicate email addresses are rejected', async () => {
        const first = await createCustomer('emailfirst');
        await createCustomer('emailsecond');

        const agent = request.agent(app);
        await login(agent, 'emailfirst@example.com');

        const response = await agent
            .patch(`/api/users/${first._id}`)
            .send({ email: 'emailsecond@example.com' });

        expect(response.status).toBe(409);
    });

    test('duplicate usernames are rejected', async () => {
        const first = await createCustomer('usernamefirst');
        await createCustomer('usernamesecond');

        const agent = request.agent(app);
        await login(agent, 'usernamefirst@example.com');

        const response = await agent
            .patch(`/api/users/${first._id}`)
            .send({ username: 'usernameseconduser' });

        expect(response.status).toBe(409);
    });

    test('empty profile fields are rejected', async () => {
        const customer = await createCustomer('emptyfield');

        const agent = request.agent(app);
        await login(agent, 'emptyfield@example.com');

        const response = await agent
            .patch(`/api/users/${customer._id}`)
            .send({ name: '   ' });

        expect(response.status).toBe(400);
    });
});
