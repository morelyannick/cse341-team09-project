import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { getDb } from '../src/db/connect.js';

const registerAccount = (agent, displayName, email) => agent
  .post('/register')
  .type('form')
  .send({ displayName, email, password: 'valid-password-123' });

describe('account navigation and dashboards', () => {
  test('registration form includes an accessible password visibility toggle', async () => {
    const response = await request(app).get('/register');

    expect(response.status).toBe(200);
    expect(response.text).toContain('id="displayName" name="displayName"');
    expect(response.text).toContain('type="button" class="password-toggle" aria-controls="password"');
    expect(response.text).toContain('>Show password</button>');
  });

  test('shows guest navigation and protects dashboard endpoints', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.text).toContain('href="/register">Register');
    expect(response.text).toContain('href="/login">Login');
    expect(response.text).not.toContain('>Logout</button>');
    expect(response.text).not.toContain('>Dashboard</a>');

    const dashboardResponse = await request(app).get('/dashboard');
    expect(dashboardResponse.status).toBe(302);
    expect(dashboardResponse.headers.location).toBe('/login');

    const bookingsResponse = await request(app).get('/api/bookings/me');
    expect(bookingsResponse.status).toBe(302);
    expect(bookingsResponse.headers.location).toBe('/login');
  });

  test('registers a user and returns only matching passenger bookings', async () => {
    const agent = request.agent(app);
    const registration = await registerAccount(agent, 'Aiko Tanaka', 'aiko@example.com');

    expect(registration.status).toBe(302);
    expect(registration.headers.location).toBe('/dashboard');

    await getDb().collection('confirmations').insertMany([
      {
        id: 'MATCH-1',
        selectedDay: '2026-12-10',
        ticketClass: 'First Class',
        passengers: [{ email: 'AIKO@example.com', firstName: 'Aiko' }]
      },
      {
        id: 'NO-MATCH',
        passengers: [{ email: 'other@example.com' }]
      }
    ]);

    const dashboardResponse = await agent.get('/dashboard');
    expect(dashboardResponse.status).toBe(200);
    expect(dashboardResponse.text).toContain('Welcome, Aiko Tanaka!');
    expect(dashboardResponse.text).toContain('href="/admin/bookings">Booking Admin');
    expect(dashboardResponse.text).toContain('href="/admin/users">User Admin');
    expect(dashboardResponse.text).toContain('>Logout</button>');
    expect(dashboardResponse.text).not.toContain('href="/register">Register');
    expect(dashboardResponse.text).not.toContain('href="/login">Login');

    const bookingsResponse = await agent.get('/api/bookings/me');
    expect(bookingsResponse.status).toBe(200);
    expect(bookingsResponse.body.bookings.map((booking) => booking.id)).toEqual(['MATCH-1']);
  });

  test('routes administrators to the admin dashboard and denies admin pages to users', async () => {
    const agent = request.agent(app);
    await registerAccount(agent, 'Morgan Admin', 'morgan@example.com');
    await getDb().collection('users').updateOne(
      { email: 'morgan@example.com' },
      { $set: { role: 'admin' } }
    );

    await agent.post('/logout');
    const login = await agent.post('/login')
      .type('form')
      .send({ email: 'morgan@example.com', password: 'valid-password-123' });

    expect(login.status).toBe(302);
    expect(login.headers.location).toBe('/admin/dashboard');

    const adminDashboard = await agent.get('/admin/dashboard');
    expect(adminDashboard.status).toBe(200);
    expect(adminDashboard.text).toContain('href="/admin/dashboard">Dashboard');
    expect(adminDashboard.text).toContain('href="/admin/bookings">Booking Admin');
    expect(adminDashboard.text).toContain('href="/admin/users">User Admin');

    const standardAgent = request.agent(app);
    await registerAccount(standardAgent, 'Standard User', 'standard@example.com');
    await standardAgent.post('/logout');
    const standardLogin = await standardAgent.post('/login')
      .type('form')
      .send({ email: 'standard@example.com', password: 'valid-password-123' });
    expect(standardLogin.status).toBe(302);
    expect(standardLogin.headers.location).toBe('/dashboard');

    const standardDashboard = await standardAgent.get('/dashboard');
    expect(standardDashboard.status).toBe(200);
    expect(standardDashboard.text).toContain('href="/dashboard">Dashboard');

    const forbidden = await standardAgent.get('/admin/dashboard');
    expect(forbidden.status).toBe(403);
  });
});
