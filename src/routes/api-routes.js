// src/routes/api-routes.js
import { Router } from 'express';
import {
  getSchedulesForTrip,
  getSchedulesForTripAndMonth,
} from '../controllers/schedules.js';

const apiRouter = Router();

/**
 * @swagger
 * /api/trips/{id}/schedules:
 *   get:
 *     summary: Get schedules for a specific trip
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trip ID
 *       - in: query
 *         name: month
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Optional month number (1-12)
 *     responses:
 *       200:
 *         description: Schedules list for the trip
 *       400:
 *         description: Invalid month parameter
 *       404:
 *         description: No schedules found
 *       500:
 *         description: Server error
 */
apiRouter.get('/trips/:id/schedules', getSchedulesForTrip);

/**
 * @swagger
 * /api/trips/{id}/schedules/{month}:
 *   get:
 *     summary: Get schedules for a specific trip and month
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trip ID
 *       - in: path
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Month number (1-12)
 *     responses:
 *       200:
 *         description: Schedules list for the trip and month
 *       400:
 *         description: Invalid month parameter
 *       404:
 *         description: No schedules found
 *       500:
 *         description: Server error
 */
apiRouter.get('/trips/:id/schedules/:month', getSchedulesForTripAndMonth);

export default apiRouter;