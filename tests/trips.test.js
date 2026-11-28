import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('GET /api/trips', () => {
  test('returns all trips as a JSON array', async () => {
    const response = await request(app).get('/api/trips');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body).toHaveLength(6);
    expect(response.body[0]).toHaveProperty('operatingMonths');
  });

  test('filters trips by region, season, or both', async () => {
    const byRegion = await request(app).get('/api/trips?region=northern');
    const bySeason = await request(app).get('/api/trips?season=summer');
    const byBoth = await request(app).get('/api/trips?region=kansai&season=autumn');

    expect(byRegion.status).toBe(200);
    expect(byRegion.body.map((trip) => trip.id)).toEqual(['coastal-breeze']);
    expect(bySeason.status).toBe(200);
    expect(bySeason.body.map((trip) => trip.id)).toEqual(['coastal-breeze']);
    expect(byBoth.status).toBe(200);
    expect(byBoth.body.map((trip) => trip.id)).toEqual(['romantic-gorge']);
  });

  test('rejects repeated region or season filters', async () => {
    const response = await request(app).get('/api/trips?region=northern&region=central');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
});

describe('GET /api/trips/:id', () => {
  test('returns a trip or 404 when it does not exist', async () => {
    const found = await request(app).get('/api/trips/alpine-panorama');
    const missing = await request(app).get('/api/trips/missing-trip');

    expect(found.status).toBe(200);
    expect(found.body.name).toBe('Alpine Panorama Express');
    expect(missing.status).toBe(404);
  });
});
