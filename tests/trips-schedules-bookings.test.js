import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('Trips API', () => {
  test('returns all trips for client-side hydration', async () => {
    const response = await request(app).get('/api/trips');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(6);
    expect(response.body[0]).toHaveProperty('operatingMonths');
  });

  test('returns a trip by ID and reports missing trips', async () => {
    const found = await request(app).get('/api/trips/alpine-panorama');
    const missing = await request(app).get('/api/trips/missing-trip');

    expect(found.status).toBe(200);
    expect(found.body.name).toBe('Alpine Panorama Express');
    expect(missing.status).toBe(404);
  });

  test('renders trip list and details without server-rendered collections', async () => {
    const list = await request(app).get('/trips');
    const details = await request(app).get('/trips/alpine-panorama');

    expect(list.status).toBe(200);
    expect(list.text).toContain('/js/trips.js');
    expect(list.text).toContain('id="trips-grid"');
    expect(details.status).toBe(200);
    expect(details.text).toContain('id="schedule-month"');
  });
});

describe('Trip schedules API', () => {
  test('returns trip schedules and filters trips by operating month', async () => {
    const schedules = await request(app).get('/api/trips/alpine-panorama/schedules');
    const operatingMonth = await request(app).get('/api/trips/alpine-panorama/schedules?month=5');
    const closedMonth = await request(app).get('/api/trips/alpine-panorama/schedules?month=12');

    expect(schedules.status).toBe(200);
    expect(schedules.body.schedules).toHaveLength(2);
    expect(operatingMonth.body.schedules).toHaveLength(2);
    expect(closedMonth.body.schedules).toEqual([]);
  });

  test('rejects invalid months and unknown trips', async () => {
    const invalidMonth = await request(app).get('/api/trips/alpine-panorama/schedules?month=13');
    const missingTrip = await request(app).get('/api/trips/missing-trip/schedules');

    expect(invalidMonth.status).toBe(400);
    expect(missingTrip.status).toBe(404);
  });
});

describe('Bookings', () => {
  test('creates a booking, exposes it through the API, and renders its confirmation', async () => {
    const bookingResponse = await request(app)
      .post('/trips/book')
      .type('form')
      .send({
        scheduleId: '1',
        tripId: 'alpine-panorama',
        ticketClass: 'premium',
        selectedDay: 'monday',
        'passengers[0][firstName]': 'Aiko',
        'passengers[0][lastName]': 'Tanaka',
        'passengers[0][email]': 'aiko@example.com',
        'passengers[0][phone]': '+81 90-1234-5678'
      });

    expect(bookingResponse.status).toBe(302);
    const bookingsResponse = await request(app).get('/api/bookings');
    const booking = bookingsResponse.body.bookings[0];
    expect(bookingsResponse.status).toBe(200);
    expect(booking).toMatchObject({
      scheduleId: 1,
      tripId: 'alpine-panorama',
      ticketClass: 'premium',
      selectedDay: 'monday'
    });
    expect(booking.passengers).toHaveLength(1);

    const confirmation = await request(app).get(bookingResponse.headers.location);
    expect(confirmation.status).toBe(200);
    expect(confirmation.text).toContain(booking.id);
  });

  test('renders the bookings administration page and OpenAPI specification', async () => {
    const page = await request(app).get('/bookings-admin');
    const spec = await request(app).get('/api/openapi.json');
    const docs = await request(app).get('/api-docs/');

    expect(page.status).toBe(200);
    expect(page.text).toContain('/js/bookings.js');
    expect(spec.status).toBe(200);
    expect(spec.body.paths).toHaveProperty('/api/trips/{id}/schedules');
    expect(docs.status).toBe(200);
    expect(docs.text).toContain('Swagger UI');
  });
});
