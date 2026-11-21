import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { createConfirmation } from '../src/models/confirmations.js';

describe('GET /api/confirmations/:id', () => {
  test('returns an existing confirmation', async () => {
    const confirmation = await createConfirmation({
      id: 'TEST123',
      scheduleId: 1,
      tripId: 'test-trip',
      ticketClass: 'standard',
      totalPrice: 800,
      selectedDay: 'monday',
      passengers: [
        {
          firstName: 'John',
          lastName: 'Smith',
          email: 'john@example.com',
          phone: '555-123-4567'
        }
      ]
    });

    const response = await request(app)
      .get(`/api/confirmations/${confirmation.id}`);

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body.confirmation.id).toBe('TEST123');
    expect(response.body.confirmation.passengers).toHaveLength(1);
  });

  test('returns 404 when the confirmation does not exist', async () => {
    const response = await request(app)
      .get('/api/confirmations/DOESNOTEXIST');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      message: 'Confirmation not found.'
    });
  });
});
