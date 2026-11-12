import railTripsRouter from './trips.js';
import { trainsApi, trainsPage } from './trains.js';
import { stationsApi, stationDetailsApi } from './stations.js';
import { Router } from 'express';
import { homePage, aboutPage, testErrorPage } from './index.js';

const router = Router();

// Home page
router.get('/', homePage);

// About page
router.get('/about', aboutPage);

// Trains page
router.get('/trains', trainsPage);

// Trains API
router.get('/api/trains', trainsApi);

// Stations API
router.get('/api/stations', stationsApi);
router.get('/api/stations/:id', stationDetailsApi);

// Rail trips
router.use('/trips', railTripsRouter);

// Test 500 error page
router.get('/500', testErrorPage);

export default router;
