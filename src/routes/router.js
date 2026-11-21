import { Router } from 'express';
import railTripsRouter from './trips.js';
import { trainsApi, trainsPage } from './trains.js';
import { homePage, aboutPage, testErrorPage } from './index.js';
import {
    registerPage,
    processRegister,
    loginPage,
    processLogin,
    logout,
    adminDashboardPage
} from '../controllers/auth.js';
import { requirePageRole } from '../middleware/auth.js';

const router = Router();

// Home page
router.get('/', homePage);

// About page
router.get('/about', aboutPage);

// Trains page
router.get('/trains', trainsPage);

// Trains API
router.get('/api/trains', trainsApi);

// Rail trips
router.use('/trips', railTripsRouter);

// Auth routes
router.get('/register', registerPage);
router.post('/register', processRegister);
router.get('/login', loginPage);
router.post('/login', processLogin);
router.get('/logout', logout);

// Protected Admin Dashboard
router.get('/admin/dashboard', requirePageRole('admin'), adminDashboardPage);

// Test 500 error page
router.get('/500', testErrorPage);

export default router;
