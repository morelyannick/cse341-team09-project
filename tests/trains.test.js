import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { getDb } from '../src/db/connect.js';

describe('GET /api/trains', () => {
  test('returns a successful JSON response', async () => {
    const response = await request(app).get('/api/trains');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body).toHaveProperty('trains');
    expect(response.body.trains).toBeInstanceOf(Array);
    expect(response.body).toHaveProperty('pagination');
    expect(response.body.pagination).toMatchObject({
      page: 1,
      limit: 10,
      totalItems: expect.any(Number),
      totalPages: expect.any(Number),
      hasNextPage: expect.any(Boolean),
      hasPreviousPage: expect.any(Boolean)
    });
  });

  test('paginates results using page and limit query parameters', async () => {
    const page1Response = await request(app).get('/api/trains?page=1&limit=2');
    expect(page1Response.status).toBe(200);
    expect(page1Response.body.trains).toHaveLength(2);
    expect(page1Response.body.pagination).toMatchObject({
      page: 1,
      limit: 2,
      totalItems: 4,
      totalPages: 2,
      hasNextPage: true,
      hasPreviousPage: false
    });

    const page2Response = await request(app).get('/api/trains?page=2&limit=2');
    expect(page2Response.status).toBe(200);
    expect(page2Response.body.trains).toHaveLength(2);
    expect(page2Response.body.pagination).toMatchObject({
      page: 2,
      limit: 2,
      totalItems: 4,
      totalPages: 2,
      hasNextPage: false,
      hasPreviousPage: true
    });

    // Page 1 and Page 2 should return distinct items
    const page1Ids = page1Response.body.trains.map((t) => t.id);
    const page2Ids = page2Response.body.trains.map((t) => t.id);
    expect(page1Ids).not.toEqual(page2Ids);
  });

  test('returns 400 Bad Request when page is invalid', async () => {
    const responseZero = await request(app).get('/api/trains?page=0');
    expect(responseZero.status).toBe(400);
    expect(responseZero.body).toHaveProperty('errors');
    expect(responseZero.body.errors[0].field).toBe('page');

    const responseString = await request(app).get('/api/trains?page=invalid');
    expect(responseString.status).toBe(400);
    expect(responseString.body.errors[0].field).toBe('page');
  });

  test('returns 400 Bad Request when limit is invalid or exceeds 50', async () => {
    const responseNegative = await request(app).get('/api/trains?limit=-5');
    expect(responseNegative.status).toBe(400);
    expect(responseNegative.body).toHaveProperty('errors');
    expect(responseNegative.body.errors[0].field).toBe('limit');

    const responseTooLarge = await request(app).get('/api/trains?limit=51');
    expect(responseTooLarge.status).toBe(400);
    expect(responseTooLarge.body).toHaveProperty('errors');
    expect(responseTooLarge.body.errors[0].field).toBe('limit');
  });

  test('filters trains by powerSource', async () => {
    const response = await request(app).get('/api/trains?powerSource=Diesel');
    expect(response.status).toBe(200);
    expect(response.body.trains.length).toBeGreaterThan(0);
    response.body.trains.forEach((t) => {
      expect(t.powerSource).toBe('Diesel');
    });
    expect(response.body.pagination.totalItems).toBe(response.body.trains.length);
  });

  test('searches trains by keyword q across name and description', async () => {
    const response = await request(app).get('/api/trains?q=snow');
    expect(response.status).toBe(200);
    expect(response.body.trains.length).toBe(1);
    expect(response.body.trains[0].name).toContain('KiHa 261');
    expect(response.body.pagination.totalItems).toBe(1);
  });

  test('sorts trains by maxSpeedKmh descending', async () => {
    const response = await request(app).get('/api/trains?sort=maxSpeedKmh&order=desc');
    expect(response.status).toBe(200);
    const speeds = response.body.trains.map((t) => t.maxSpeedKmh);
    for (let i = 1; i < speeds.length; i += 1) {
      expect(speeds[i - 1]).toBeGreaterThanOrEqual(speeds[i]);
    }
  });

  test('combines search, filtering, sorting, and pagination correctly', async () => {
    const response = await request(app).get('/api/trains?powerSource=Electric&sort=name&order=asc&page=1&limit=1');
    expect(response.status).toBe(200);
    expect(response.body.trains).toHaveLength(1);
    expect(response.body.trains[0].powerSource).toBe('Electric');
    expect(response.body.pagination.totalItems).toBe(2);
    expect(response.body.pagination.totalPages).toBe(2);
    expect(response.body.pagination.hasNextPage).toBe(true);
  });

  test('returns 400 Bad Request for unsupported powerSource', async () => {
    const response = await request(app).get('/api/trains?powerSource=Nuclear');
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('errors');
    expect(response.body.errors[0].field).toBe('powerSource');
  });

  test('returns 400 Bad Request for unsupported sort field or order', async () => {
    const responseSort = await request(app).get('/api/trains?sort=color');
    expect(responseSort.status).toBe(400);
    expect(responseSort.body.errors[0].field).toBe('sort');

    const responseOrder = await request(app).get('/api/trains?order=sideways');
    expect(responseOrder.status).toBe(400);
    expect(responseOrder.body.errors[0].field).toBe('order');
  });

  test('returns 400 Bad Request for query q exceeding 100 characters', async () => {
    const longQuery = 'a'.repeat(101);
    const response = await request(app).get(`/api/trains?q=${longQuery}`);
    expect(response.status).toBe(400);
    expect(response.body.errors[0].field).toBe('q');
  });

  test('returns the trains from the starter data', async () => {
    const response = await request(app).get('/api/trains');

    expect(response.status).toBe(200);
    expect(response.body.trains).toHaveLength(4);
    expect(response.body.trains).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'series-e353',
          name: 'Series E353 Limited Express',
          powerSource: 'Electric'
        })
      ])
    );
  });

  test('returns a train added to the test database', async () => {
    await getDb().collection('trains').insertOne({
      id: 'test-express',
      name: 'Test Express',
      operator: 'Test Railway'
    });

    const response = await request(app).get('/api/trains');

    expect(response.status).toBe(200);
    expect(response.body.trains).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'test-express',
          name: 'Test Express'
        })
      ])
    );
  });
});
