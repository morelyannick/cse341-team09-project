import { Router } from 'express';
import { getAllStations, getStationById } from '../controllers/stations.js';
import { trainsApi } from './trains.js';

const router = Router();

// Trains API
router.get('/trains', trainsApi);

/**
 * @openapi
 * /api/stations:
 *   get:
 *     summary: Returns all stations
 *     tags:
 *       - Stations
 *     responses:
 *       200:
 *         description: A list of stations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stations:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Failed to fetch stations
 */
router.get('/stations', getAllStations);

/**
 * @openapi
 * /api/stations/{id}:
 *   get:
 *     summary: Returns one station by ID
 *     tags:
 *       - Stations
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The station ID (e.g. nagoya)
 *     responses:
 *       200:
 *         description: Station details
 *       404:
 *         description: Station not found
 *       500:
 *         description: Failed to fetch station
 */
router.get('/stations/:id', getStationById);

export default router;
