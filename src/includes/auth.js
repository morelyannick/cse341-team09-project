import { createHash, randomBytes } from 'node:crypto';
import { getDb } from '../db/connect.js';

const SESSION_COOKIE = 'kizuna_session';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

const sessionCookieOptions = () => ({
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV?.toLowerCase() === 'production',
    path: '/',
    maxAge: SESSION_DURATION_MS
});

const createSession = async (userId, res) => {
    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    const sessions = getDb().collection('sessions');
    await sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    await sessions.insertOne({ tokenHash, userId, expiresAt });
    res.cookie(SESSION_COOKIE, token, sessionCookieOptions());
};

const destroySession = async (req, res) => {
    const cookie = req.headers.cookie?.split(';')
        .map((part) => part.trim())
        .find((part) => part.startsWith(`${SESSION_COOKIE}=`));
    const token = cookie?.slice(`${SESSION_COOKIE}=`.length);

    if (token) {
        const tokenHash = createHash('sha256').update(token).digest('hex');
        await getDb().collection('sessions').deleteOne({ tokenHash });
    }

    res.clearCookie(SESSION_COOKIE, sessionCookieOptions());
};

const requireAuth = (req, res, next) => {
    if (!req.user) {
        return res.redirect('/login');
    }

    return next();
};

const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.redirect('/login');
    }
    if (req.user.role !== 'admin') {
        return res.status(403).render('errors/403', { title: 'Forbidden' });
    }

    return next();
};

const dashboardPathFor = (user) => user.role === 'admin' ? '/admin/dashboard' : '/dashboard';

export { createSession, dashboardPathFor, destroySession, requireAdmin, requireAuth };
