import { getDb } from '../db/connect.js';
import { dashboardPathFor } from '../includes/auth.js';

const userDashboard = (req, res) => {
    if (req.user.role === 'admin') {
        return res.redirect(dashboardPathFor(req.user));
    }
    return res.render('dashboard/user', { title: 'Your Dashboard' });
};

const adminDashboard = (req, res) => res.render('dashboard/admin', { title: 'Admin Dashboard' });

const userBookingsApi = async (req, res, next) => {
    try {
        const escapedEmail = req.user.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const bookings = await getDb().collection('confirmations').find({
            'passengers.email': { $regex: `^${escapedEmail}$`, $options: 'i' }
        }).toArray();
        return res.json({ bookings });
    } catch (error) {
        return next(error);
    }
};

const bookingAdminPage = (req, res) => res.render('dashboard/booking-admin', { title: 'Booking Admin' });
const userAdminPage = (req, res) => res.render('dashboard/user-admin', { title: 'User Admin' });

export { adminDashboard, bookingAdminPage, userAdminPage, userBookingsApi, userDashboard };
