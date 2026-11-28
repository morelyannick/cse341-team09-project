import { Router } from 'express';
import { getAllBookings } from '../controllers/bookings.js';
import { getSchedulesForTrip, getSchedulesForTripAndMonth } from '../controllers/schedules.js';
import {
  getAllTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  getTripAdminOptions
} from '../controllers/trips.js';
import { requireApiRole } from '../middleware/auth.js';
import { getAllTrains } from '../controllers/trains.js';
import swaggerSpecs from '../swagger.js';

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
 * /api/trips/{id}:
 *   put:
 *     summary: Update a trip (admin only)
 *     description: >
 *       Requires a signed-in admin session (sign in at /login first; the browser sends the session cookie).
 *       Replaces the trip's editable fields. The id cannot change. startStation and endStation must be
 *       existing station ids. scheduleIds moves those existing schedules onto this trip.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: alpine-panorama
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             name: Alpine Panorama Express
 *             description: Journey through the Japanese Alps with stunning mountain views and traditional villages.
 *             region: central
 *             startStation: nagoya
 *             endStation: toyama
 *             duration: 4.5 hours
 *             distance: 180
 *             bestSeason: autumn
 *             highlights: [Mount Tateyama views, Hida River gorge, Traditional alpine villages]
 *             operatingMonths: [4, 5, 6, 7, 8, 9, 10, 11]
 *             scheduleIds: [1, 2]
 *     responses:
 *       200:
 *         description: The updated trip
 *       400:
 *         description: Invalid data, unknown station, or unknown schedule id
 *         content:
 *           application/json:
 *             example:
 *               error: Invalid trip data
 *               errors: ['startStation "atlantis" does not match an existing station']
 *       401:
 *         description: Not signed in
 *         content:
 *           application/json:
 *             example:
 *               message: Authentication required
 *       403:
 *         description: Signed in, but not an admin
 *         content:
 *           application/json:
 *             example:
 *               message: Forbidden
 *       404:
 *         description: Trip not found
 *       500:
 *         description: Unexpected server or database error
 *   delete:
 *     summary: Delete a trip (admin only)
 *     description: >
 *       Requires a signed-in admin session. A trip that still has schedules or bookings cannot be
 *       deleted, because they point to the trip by its id; move its schedules to another trip first.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: romantic-gorge
 *     responses:
 *       204:
 *         description: Trip deleted (no response body)
 *       401:
 *         description: Not signed in
 *       403:
 *         description: Signed in, but not an admin
 *       404:
 *         description: Trip not found
 *       409:
 *         description: The trip still has schedules or bookings
 *         content:
 *           application/json:
 *             example:
 *               error: This trip still has 2 schedule(s). Move them to another trip before deleting it.
 *       500:
 *         description: Unexpected server or database error
 */
router.put('/api/trips/:id', requireApiRole('admin'), updateTrip);
router.delete('/api/trips/:id', requireApiRole('admin'), deleteTrip);

/**
 * @openapi
 * /api/admin/trip-options:
 *   get:
 *     summary: Station and schedule choices for the trip editor (admin only)
 *     description: Requires a signed-in admin session.
 *     responses:
 *       200:
 *         description: All stations (id, name, region) and all schedules with the trip each belongs to
 *       401:
 *         description: Not signed in
 *       403:
 *         description: Signed in, but not an admin
 *       500:
 *         description: Unexpected server or database error
 */
router.get('/api/admin/trip-options', requireApiRole('admin'), getTripAdminOptions);

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

export default router;
