import { Router } from 'express';
import { homePage, aboutPage, testErrorPage } from '../controllers/pages.js';
import {
    bookingConfirmationPage,
    bookingPage,
    processBookingRequest
} from '../controllers/bookings.js';
import {
    tripDetailsPage,
    tripListPage,
    trainsPage
} from '../controllers/trip-pages.js';
import {
    registerPage,
    processRegister,
    loginPage,
    processLogin,
    logout,
    adminDashboardPage
} from '../controllers/auth.js';
import { requirePageLogin, requirePageRole } from '../middleware/auth.js';

const router = Router();

// General pages
router.get('/', homePage);
router.get('/about', aboutPage);
router.get('/trains', trainsPage);
router.get('/500', testErrorPage);

// Trip pages
router.get('/trips', tripListPage);
router.get('/trips/:tripId', tripDetailsPage);

// Booking pages
router.get('/trips/booking/:scheduleId', bookingPage);
router.post('/trips/book', processBookingRequest);
router.get('/trips/confirmation/:bookingId', bookingConfirmationPage);

// Booking administration
router.get('/bookings-admin', (req, res) =>
    res.render('bookings', { title: 'Bookings Administration' })
);

// Authentication
router.get('/register', registerPage);
router.post('/register', processRegister);
router.get('/login', loginPage);
router.post('/login', processLogin);
router.get('/logout', logout);

// Protected admin dashboard
router.get('/admin/dashboard', requirePageRole('admin'), adminDashboardPage);

// Protected user administration
router.get('/admin/users', requirePageLogin, (req, res) => {
    res.render('admin/users', { title: 'User Administration' });
});

export default router;