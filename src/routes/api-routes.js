import { Router } from 'express';
import { getAllBookings } from '../controllers/bookings.js';
import { getSchedulesForTrip, getSchedulesForTripAndMonth } from '../controllers/schedules.js';
import { getAllTrips, getTripById } from '../controllers/trips.js';
import { getAllTrains } from '../controllers/trains.js';
import swaggerSpecs from '../swagger.js';
import { getUsers, updateUser, deleteUser } from '../controllers/users.js';
import { requireApiLogin } from '../middleware/auth.js';

const router = Router();

/**
 * @openapi
 * /api/trips:
 *   get:
 *     summary: List all scenic trips
 *     parameters:
 *       - in: query
 *         name: region
 *         schema:
 *           type: string
 *       - in: query
 *         name: season
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Array of trips returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       400:
 *         description: Invalid filter
 */
router.get('/api/trips', getAllTrips);

/**
 * @openapi
 * /api/trips/{id}:
 *   get:
 *     summary: Get a scenic trip by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trip returned successfully
 *       404:
 *         description: Trip not found
 */
router.get('/api/trips/:id', getTripById);

/**
 * @openapi
 * /api/trips/{id}/schedules:
 *   get:
 *     summary: Get schedules for a trip, optionally filtered by operating month
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: month
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *     responses:
 *       200:
 *         description: Schedules returned successfully
 *       400:
 *         description: Invalid month
 *       404:
 *         description: Trip not found
 */
router.get('/api/trips/:id/schedules', (req, res, next) => {
  if (req.query.month !== undefined) {
    return getSchedulesForTripAndMonth(req, res, next);
  }
  return getSchedulesForTrip(req, res, next);
});

/**
 * @openapi
 * /api/bookings:
 *   get:
 *     summary: List all bookings
 *     responses:
 *       200:
 *         description: Bookings returned successfully
 */
router.get('/api/bookings', getAllBookings);

/**
 * @openapi
 * /api/trains:
 *   get:
 *     summary: List all trains
 *     responses:
 *       200:
 *         description: Trains returned successfully
 */
router.get('/api/trains', getAllTrains);

router.get('/api/openapi.json', (req, res) => res.json(swaggerSpecs));

// User administration
router.get('/api/users', requireApiLogin, getUsers);
router.patch('/api/users/:id', requireApiLogin, updateUser);
router.delete('/api/users/:id', requireApiLogin, deleteUser);

export default router;
