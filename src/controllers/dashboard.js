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


const userAdminApi = async (req, res, next) => {
    const pageParam = req.query.page ?? '1';
    if (typeof pageParam !== 'string' || !/^[1-9]\d*$/.test(pageParam)) {
        return res.status(400).json({ error: 'Page must be a positive integer.' });
    }


    const page = Number(pageParam);
    if (!Number.isSafeInteger(page)) {
        return res.status(400).json({ error: 'Page must be a positive integer.' });
    }


    const limit = 10; // Number of users per page


    try {
        const users = getDb().collection('users');
        const [totalItems, data] = await Promise.all([
            users.countDocuments(),
            users.find({}, {
                projection: { displayName: 1, email: 1, role: 1, createdAt: 1 }
            })
                .collation({ locale: 'en', strength: 2 })
                .sort({displayName: 1, _id: 1})
                .skip((page - 1) * limit)
                .limit(limit)
                .toArray()
        ]);


        return res.json({
            metadata: {
                page,
                limit,
                totalItems,
                totalPages: Math.ceil(totalItems / limit)
            },
            data
        });
    } catch (error) {
        return next(error);
    }
};


const bookingAdminPage = (req, res) => res.render('dashboard/booking-admin', { title: 'Booking Admin' });
const userAdminPage = (req, res) => res.render('dashboard/user-admin', { title: 'User Admin' });


export { adminDashboard, bookingAdminPage, userAdminApi, userAdminPage, userBookingsApi, userDashboard };