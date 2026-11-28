import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('Swagger API documentation', () => {
  test('serves the OpenAPI specification', async () => {
    const response = await request(app).get('/api-docs.json');

    expect(response.status).toBe(200);
    expect(response.body.openapi).toBe('3.0.3');
    expect(response.body.paths).toHaveProperty('/api/trains');
    expect(response.body.paths).toHaveProperty('/api/bookings/me');
    expect(response.body.paths).toHaveProperty('/api/users');
    expect(response.body.paths['/api/users'].get.parameters[0].name).toBe('page');
  });

  test('serves Swagger UI', async () => {
    const response = await request(app).get('/api-docs/');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Swagger UI');
  });

  test('configures Swagger UI to send the browser session cookie', async () => {
    const response = await request(app).get('/api-docs/swagger-ui-init.js');

    expect(response.status).toBe(200);
    expect(response.text).toContain('"withCredentials": true');
  });
});
