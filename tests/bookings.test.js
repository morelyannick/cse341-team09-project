
import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('POST /trips/book', () => {
  test('creates a booking and displays its confirmation page', async () => {
    const response = await request(app)
      .post('/trips/book')
      .type('form')
      .send({
        scheduleId: '1',
        tripId: 'alpine-panorama',
        ticketClass: 'standard',
        selectedDay: 'monday',
        totalPrice: '1',
        'passengers[0][firstName]': 'John',
        'passengers[0][lastName]': 'Smith',
        'passengers[0][email]': 'john@example.com',
        'passengers[0][phone]': '555-123-4567',
        'passengers[1][firstName]': 'Jane',
        'passengers[1][lastName]': 'Smith',
        'passengers[1][email]': 'jane@example.com',
        'passengers[1][phone]': '555-987-6543'
      });

    expect(response.status).toBe(302);
    expect(response.headers.location).toMatch(
      /^\/trips\/confirmation\/JR[A-Z0-9]+$/
    );

    const confirmationId = response.headers.location.split('/').pop();

    // Verify the confirmation was saved correctly.
    const confirmationResponse = await request(app)
      .get(`/api/confirmations/${confirmationId}`);

    expect(confirmationResponse.status).toBe(200);
    expect(confirmationResponse.body.confirmation.totalPrice).toBe(28800);
    expect(confirmationResponse.body.confirmation.passengers).toHaveLength(2);
    expect(confirmationResponse.body.confirmation.ticketClass).toBe('standard');
    expect(confirmationResponse.body.confirmation.selectedDay).toBe('monday');

    // Verify the customer-facing confirmation page.
    const pageResponse = await request(app)
      .get(response.headers.location);

    expect(pageResponse.status).toBe(200);
    expect(pageResponse.text).toContain(confirmationId);
    expect(pageResponse.text).toContain('Alpine Panorama Express');
    expect(pageResponse.text).toContain('John Smith');
    expect(pageResponse.text).toContain('Jane Smith');
    expect(pageResponse.text).toContain('28,800');
    expect(pageResponse.text).not.toContain('confirmation email');
  });

  
  test('rejects a booking for an unavailable travel day', async () => {
    const response = await request(app)
      .post('/trips/book')
      .type('form')
      .send({
        scheduleId: '1',
        tripId: 'alpine-panorama',
        ticketClass: 'standard',
        selectedDay: 'sunday',
        'passengers[0][firstName]': 'John',
        'passengers[0][lastName]': 'Smith',
        'passengers[0][email]': 'john@example.com',
        'passengers[0][phone]': '555-123-4567'
      });

    expect(response.status).toBe(400);
    expect(response.text).toContain('selected travel day is unavailable');
  });

  test('rejects incomplete passenger information', async () => {
    const response = await request(app)
      .post('/trips/book')
      .type('form')
      .send({
        scheduleId: '1',
        tripId: 'alpine-panorama',
        ticketClass: 'standard',
        selectedDay: 'monday',
        'passengers[0][firstName]': 'John',
        'passengers[0][email]': 'john@example.com',
        'passengers[0][phone]': '555-123-4567'
      });

    expect(response.status).toBe(400);
    expect(response.text).toContain('complete and valid passenger information');
  });

  test('rejects an invalid passenger email', async () => {
    const response = await request(app)
      .post('/trips/book')
      .type('form')
      .send({
        scheduleId: '1',
        tripId: 'alpine-panorama',
        ticketClass: 'standard',
        selectedDay: 'monday',
        'passengers[0][firstName]': 'John',
        'passengers[0][lastName]': 'Smith',
        'passengers[0][email]': 'not-an-email',
        'passengers[0][phone]': '555-123-4567'
      });

    expect(response.status).toBe(400);
    expect(response.text).toContain('complete and valid passenger information');
  });
});
