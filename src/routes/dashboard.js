import { Router } from 'express';
import {
    adminDashboard,
    bookingAdminPage,
    userAdminApi,
    userAdminPage,
    userBookingsApi,
    userDashboard
} from '../controllers/dashboard.js';
import { requireAdmin, requireAuth } from '../includes/auth.js';

const router = Router();

router.get('/dashboard', requireAuth, userDashboard);
router.get('/admin/dashboard', requireAdmin, adminDashboard);
router.get('/admin/bookings', requireAdmin, bookingAdminPage);
router.get('/admin/users', requireAdmin, userAdminPage);
router.get('/api/users', requireAdmin, userAdminApi);
router.get('/api/bookings/me', requireAuth, userBookingsApi);

export default router;
