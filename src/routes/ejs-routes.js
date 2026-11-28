import { Router } from 'express';
import { homePage, aboutPage, testErrorPage } from '../controllers/pages.js';
import { bookingConfirmationPage, bookingPage, processBookingRequest } from '../controllers/bookings.js';
import { tripDetailsPage, tripListPage, trainsPage } from '../controllers/trip-pages.js';
import { tripAdminPage } from '../controllers/trips.js';
import { requirePageRole } from '../middleware/auth.js';

const router = Router();

router.get('/', homePage);
router.get('/about', aboutPage);
router.get('/trains', trainsPage);
router.get('/trips', tripListPage);
router.get('/trips/:tripId', tripDetailsPage);
router.get('/trips/booking/:scheduleId', bookingPage);
router.post('/trips/book', processBookingRequest);
router.get('/trips/confirmation/:bookingId', bookingConfirmationPage);
router.get('/bookings-admin', (req, res) => res.render('bookings', { title: 'Bookings Administration' }));
router.get('/admin/trips', requirePageRole('admin'), tripAdminPage);
router.get('/500', testErrorPage);

export default router;
