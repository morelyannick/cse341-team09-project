import { getDb } from '../db/connect.js';
import { createHash } from 'node:crypto';

/**
 * Helper function to set all expected res.locals values
 */
const setLocalVariables = async (req, res, next) => {
    // Make NODE_ENV available to all templates
    res.locals.NODE_ENV = process.env.NODE_ENV?.toLowerCase() || 'production';

    // Make any query parameters available to all templates
    res.locals.query = req.query;

    const cookie = req.headers.cookie?.split(';')
        .map((part) => part.trim())
        .find((part) => part.startsWith('kizuna_session='));
    const sessionToken = cookie?.slice('kizuna_session='.length);

    if (sessionToken) {
        const tokenHash = createHash('sha256').update(sessionToken).digest('hex');
        const session = await getDb().collection('sessions').findOne({
            tokenHash,
            expiresAt: { $gt: new Date() }
        });

        if (session) {
            req.user = await getDb().collection('users').findOne(
                { _id: session.userId },
                { projection: { displayName: 1, email: 1, role: 1 } }
            );
        }
    }

    res.locals.currentUser = req.user || null;
    res.locals.dashboardUrl = req.user?.role === 'admin' ? '/admin/dashboard' : '/dashboard';
    next();
};

export default setLocalVariables;