import { Router } from 'express';
import apiRoutes from './api-routes.js';
import ejsRoutes from './ejs-routes.js';
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

router.use(apiRoutes);
router.use(ejsRoutes);

// Auth routes
router.get('/register', registerPage);
router.post('/register', processRegister);
router.get('/login', loginPage);
router.post('/login', processLogin);
router.get('/logout', logout);

// Protected Admin Dashboard
router.get('/admin/dashboard', requirePageRole('admin'), adminDashboardPage);

export default router;
