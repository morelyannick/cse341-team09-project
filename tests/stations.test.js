import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { getDb } from '../src/db/connect.js';

describe('GET /api/stations', () => {
    test('returns a successful JSON response', async () => {
        const response = await request(app).get('/api/stations');

        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toContain('application/json');
        expect(response.body).toHaveProperty('stations');
        expect(response.body.stations).toBeInstanceOf(Array);
    });

    test('returns the stations from the starter data', async () => {
        const response = await request(app).get('/api/stations');

        expect(response.status).toBe(200);
        expect(response.body.stations.length).toBeGreaterThan(0);
        expect(response.body.stations).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: 'nagoya',
                    name: 'Nagoya Station',
                    prefecture: 'Aichi'
                })
            ])
        );
    });

    test('returns a station added to the test database', async () => {
        await getDb().collection('stations').insertOne({
            id: 'shinjuku',
            name: 'Shinjuku Station',
            prefecture: 'Tokyo',
            region: 'eastern',
            facilities: ['restroom', 'lockers']
        });

        const response = await request(app).get('/api/stations');

        expect(response.status).toBe(200);
        expect(response.body.stations).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: 'shinjuku',
                    name: 'Shinjuku Station'
                })
            ])
        );
    });
});

describe('GET /api/stations/:id', () => {
    test('returns a single station by id', async () => {
        const response = await request(app).get('/api/stations/nagoya');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('station');
        expect(response.body.station.name).toBe('Nagoya Station');
        expect(response.body.station.prefecture).toBe('Aichi');
    });

    test('returns 404 for a non-existent station id', async () => {
        const response = await request(app).get('/api/stations/non-existent-station');

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('message', 'Station not found');
    });
});
