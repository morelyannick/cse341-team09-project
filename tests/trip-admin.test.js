import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { getDb } from '../src/db/connect.js';

const PASSWORD = 'password123';
let userCount = 0;

// Registers a user and returns a supertest agent that keeps the session cookie.
// For an admin, the role is changed in the database and the user signs in again.
async function signIn(role) {
  userCount += 1;
  const email = `${role}${userCount}@example.com`;
  const agent = request.agent(app);
  await agent.post('/register').send({ name: `Test ${role}`, username: `${role}${userCount}`, email, password: PASSWORD });

  if (role === 'admin') {
    const db = getDb();
    const adminRole = await db.collection('roles').findOne({ name: 'admin' });
    await db.collection('users').updateOne({ email }, { $set: { role: adminRole._id } });
    await agent.get('/logout');
    await agent.post('/login').send({ email, password: PASSWORD });
  }
  return agent;
}

const validUpdate = (overrides = {}) => ({
  name: 'Alpine Panorama Deluxe',
  description: 'Updated description.',
  region: 'central',
  startStation: 'nagoya',
  endStation: 'toyama',
  duration: '5 hours',
  distance: 185,
  bestSeason: 'Autumn',
  highlights: ['Mount Tateyama views', 'Hida River gorge'],
  operatingMonths: [10, 4, 5, 5],
  ...overrides
});

describe('Trip admin page access', () => {
  test('redirects a signed-out visitor to /login', async () => {
    const response = await request(app).get('/admin/trips');
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/login');
  });

  test('shows a 403 page to a signed-in customer', async () => {
    const customer = await signIn('customer');
    const response = await customer.get('/admin/trips');
    expect(response.status).toBe(403);
    expect(response.text).toContain('Access Forbidden');
  });

  test('renders the page for an admin, with the client script', async () => {
    const admin = await signIn('admin');
    const response = await admin.get('/admin/trips');
    expect(response.status).toBe(200);
    expect(response.text).toContain('id="trip-admin-list"');
    expect(response.text).toContain('/js/trip-admin.js');
  });

  test('admin dashboard links to the trip admin page', async () => {
    const admin = await signIn('admin');
    const response = await admin.get('/admin/dashboard');
    expect(response.text).toContain('href="/admin/trips"');
  });
});

describe('PUT /api/trips/:id', () => {
  test('returns 401 JSON when signed out and 403 for a customer', async () => {
    const signedOut = await request(app).put('/api/trips/alpine-panorama').send(validUpdate());
    expect(signedOut.status).toBe(401);
    expect(signedOut.body.message).toBe('Authentication required');

    const customer = await signIn('customer');
    const forbidden = await customer.put('/api/trips/alpine-panorama').send(validUpdate());
    expect(forbidden.status).toBe(403);
  });

  test('updates the trip for an admin and keeps the original id', async () => {
    const admin = await signIn('admin');
    const response = await admin.put('/api/trips/alpine-panorama').send(validUpdate({ id: 'hacked' }));

    expect(response.status).toBe(200);
    expect(response.body.id).toBe('alpine-panorama');
    expect(response.body.name).toBe('Alpine Panorama Deluxe');
    expect(response.body.bestSeason).toBe('autumn');
    expect(response.body.operatingMonths).toEqual([4, 5, 10]);

    const saved = await getDb().collection('trips').findOne({ id: 'alpine-panorama' });
    expect(saved.distance).toBe(185);
    expect(await getDb().collection('trips').findOne({ id: 'hacked' })).toBeNull();
  });

  test('rejects invalid data with 400 and a list of errors', async () => {
    const admin = await signIn('admin');
    const response = await admin.put('/api/trips/alpine-panorama').send({
      ...validUpdate({ name: ' ', bestSeason: 'monsoon', distance: -5 }),
      endStation: 'nagoya'
    });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual(expect.arrayContaining([
      'name is required and must be a non-empty string',
      'distance is required and must be a number of 0 or more',
      'bestSeason must be one of: spring, summer, autumn, winter',
      'startStation and endStation must be different stations'
    ]));
  });

  test('rejects an unknown station or schedule with 400', async () => {
    const admin = await signIn('admin');
    const station = await admin.put('/api/trips/alpine-panorama').send(validUpdate({ startStation: 'atlantis' }));
    const schedule = await admin.put('/api/trips/alpine-panorama').send(validUpdate({ scheduleIds: [999] }));

    expect(station.status).toBe(400);
    expect(station.body.errors[0]).toMatch(/atlantis/);
    expect(schedule.status).toBe(400);
    expect(schedule.body.errors[0]).toMatch(/999/);
  });

  test('returns 404 for a trip that does not exist', async () => {
    const admin = await signIn('admin');
    const response = await admin.put('/api/trips/no-such-trip').send(validUpdate());
    expect(response.status).toBe(404);
  });

  test('moves existing schedules onto the trip', async () => {
    const admin = await signIn('admin');
    const response = await admin.put('/api/trips/coastal-breeze').send(validUpdate({
      name: 'Coastal Breeze Line', startStation: 'aomori', endStation: 'akita', scheduleIds: [10]
    }));

    expect(response.status).toBe(200);
    const schedule = await getDb().collection('schedules').findOne({ id: 10 });
    expect(schedule.tripId).toBe('coastal-breeze');
  });
});

describe('DELETE /api/trips/:id', () => {
  test('returns 401 when signed out and 403 for a customer', async () => {
    expect((await request(app).delete('/api/trips/winter-wetlands')).status).toBe(401);
    const customer = await signIn('customer');
    expect((await customer.delete('/api/trips/winter-wetlands')).status).toBe(403);
  });

  test('refuses with 409 while the trip still has schedules', async () => {
    const admin = await signIn('admin');
    const response = await admin.delete('/api/trips/winter-wetlands');

    expect(response.status).toBe(409);
    expect(response.body.error).toMatch(/schedule/);
    expect(await getDb().collection('trips').findOne({ id: 'winter-wetlands' })).not.toBeNull();
  });

  test('deletes the trip once its schedules are moved, and the API then returns 404', async () => {
    const admin = await signIn('admin');
    await admin.put('/api/trips/coastal-breeze').send(validUpdate({
      name: 'Coastal Breeze Line', startStation: 'aomori', endStation: 'akita', scheduleIds: [10]
    }));

    const response = await admin.delete('/api/trips/winter-wetlands');
    expect(response.status).toBe(204);
    expect((await request(app).get('/api/trips/winter-wetlands')).status).toBe(404);
  });

  test('refuses with 409 when the trip has bookings', async () => {
    const db = getDb();
    await db.collection('schedules').updateMany({ tripId: 'winter-wetlands' }, { $set: { tripId: 'coastal-breeze' } });
    await db.collection('bookings').insertOne({ id: 'BOOK1', tripId: 'winter-wetlands', scheduleId: 10 });

    const admin = await signIn('admin');
    const response = await admin.delete('/api/trips/winter-wetlands');
    expect(response.status).toBe(409);
    expect(response.body.error).toMatch(/booking/);
  });

  test('returns 404 for a trip that does not exist', async () => {
    const admin = await signIn('admin');
    expect((await admin.delete('/api/trips/no-such-trip')).status).toBe(404);
  });
});

describe('GET /api/admin/trip-options', () => {
  test('returns stations and schedules for an admin only', async () => {
    expect((await request(app).get('/api/admin/trip-options')).status).toBe(401);

    const admin = await signIn('admin');
    const response = await admin.get('/api/admin/trip-options');
    expect(response.status).toBe(200);
    expect(response.body.stations).toHaveLength(12);
    expect(response.body.stations[0]).not.toHaveProperty('_id');
    expect(response.body.schedules).toHaveLength(14);
  });

  test('documents the admin routes in Swagger', async () => {
    const spec = (await request(app).get('/api/openapi.json')).body;
    expect(spec.paths['/api/trips/{id}']).toHaveProperty('get');
    expect(spec.paths['/api/trips/{id}']).toHaveProperty('put');
    expect(spec.paths['/api/trips/{id}']).toHaveProperty('delete');
    expect(spec.paths).toHaveProperty('/api/admin/trip-options');
  });
});
