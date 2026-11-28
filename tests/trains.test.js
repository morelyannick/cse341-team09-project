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
