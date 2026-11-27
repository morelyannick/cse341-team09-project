import { Router } from 'express';
import { getAllBookings } from '../controllers/bookings.js';
import { getSchedulesForTrip, getSchedulesForTripAndMonth } from '../controllers/schedules.js';
import { getAllTrips, getTripById } from '../controllers/trips.js';
import { getAllTrains } from '../controllers/trains.js';
import { getAllTicketClasses, getTicketClassesForDay } from '../controllers/ticket-classes.js';
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
 * /api/ticket-classes:
 *   get:
 *     summary: List ticket classes, optionally only those available on a day of the week
 *     description: >
 *       Without a day, returns every ticket class. With ?day=monday (any day of the week,
 *       case-insensitive), returns only the classes sold on that day. Sorted by price per km,
 *       cheapest first.
 *     parameters:
 *       - in: query
 *         name: day
 *         required: false
 *         description: Day of the week
 *         schema:
 *           type: string
 *           enum: [monday, tuesday, wednesday, thursday, friday, saturday, sunday]
 *     responses:
 *       200:
 *         description: Ticket classes returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 day:
 *                   type: string
 *                   description: Only present when the day filter is used
 *                   example: monday
 *                 ticketClasses:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       class:
 *                         type: string
 *                         example: standard
 *                       name:
 *                         type: string
 *                         example: Standard Class
 *                       pricePerKm:
 *                         type: number
 *                         example: 80
 *                       amenities:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: [Comfortable seats, Large windows, Complimentary tea]
 *                       description:
 *                         type: string
 *                       availableDays:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: [monday, tuesday, wednesday, thursday, friday, saturday, sunday]
 *       400:
 *         description: Invalid day
 *         content:
 *           application/json:
 *             example:
 *               error: 'Day must be one of: monday, tuesday, wednesday, thursday, friday, saturday, sunday'
 *       500:
 *         description: Unexpected server or database error
 *         content:
 *           application/json:
 *             example:
 *               error: Failed to fetch ticket classes
 */
router.get('/api/ticket-classes', (req, res, next) => {
  if (req.query.day !== undefined) {
    return getTicketClassesForDay(req, res, next);
  }
  return getAllTicketClasses(req, res, next);
});

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
