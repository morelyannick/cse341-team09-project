import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { getDb } from '../src/db/connect.js';

const classesOf = (response) => response.body.ticketClasses.map((ticket) => ticket.class);

describe('Ticket classes API', () => {
  test('returns all ticket classes sorted by price, without internal fields', async () => {
    const response = await request(app).get('/api/ticket-classes');

    expect(response.status).toBe(200);
    expect(classesOf(response)).toEqual(['standard', 'premium', 'first']);
    expect(response.body.ticketClasses[0]).toHaveProperty('availableDays');
    expect(response.body.ticketClasses[0]).not.toHaveProperty('_id');
    expect(response.body).not.toHaveProperty('day');
  });

  test('returns only the classes available on the requested day', async () => {
    const monday = await request(app).get('/api/ticket-classes?day=monday');
    const wednesday = await request(app).get('/api/ticket-classes?day=wednesday');
    const saturday = await request(app).get('/api/ticket-classes?day=saturday');

    expect(monday.status).toBe(200);
    expect(monday.body.day).toBe('monday');
    expect(classesOf(monday)).toEqual(['standard']);
    expect(classesOf(wednesday)).toEqual(['standard', 'premium']);
    expect(classesOf(saturday)).toEqual(['standard', 'premium', 'first']);
  });

  test('accepts day names in any letter case', async () => {
    const response = await request(app).get('/api/ticket-classes?day=FriDay');

    expect(response.status).toBe(200);
    expect(response.body.day).toBe('friday');
    expect(classesOf(response)).toEqual(['standard', 'premium', 'first']);
  });

  test('rejects an invalid or empty day with 400', async () => {
    const invalid = await request(app).get('/api/ticket-classes?day=funday');
    const empty = await request(app).get('/api/ticket-classes?day=');

    expect(invalid.status).toBe(400);
    expect(invalid.body.error).toMatch(/Day must be one of/);
    expect(empty.status).toBe(400);
  });

  test('treats a ticket class without availableDays as available every day', async () => {
    await getDb().collection('ticketClasses').updateOne({ class: 'first' }, { $unset: { availableDays: '' } });

    const monday = await request(app).get('/api/ticket-classes?day=monday');

    expect(classesOf(monday)).toEqual(['standard', 'first']);
  });

  test('is documented in Swagger', async () => {
    const response = await request(app).get('/api/openapi.json');

    expect(response.body.paths).toHaveProperty('/api/ticket-classes');
  });
});

describe('Booking page ticket options', () => {
  test('renders every ticket class from the model and loads the availability script', async () => {
    const response = await request(app).get('/trips/booking/1');

    expect(response.status).toBe(200);
    expect(response.text).toContain('id="ticket-standard"');
    expect(response.text).toContain('id="ticket-premium"');
    expect(response.text).toContain('id="ticket-first"');
    expect(response.text).toContain('id="ticketAvailabilityStatus"');
    expect(response.text).toContain('/js/booking-tickets.js');
  });
});
