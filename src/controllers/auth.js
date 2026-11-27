import { promisify } from 'node:util';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { getDb } from '../db/connect.js';
import { createSession, dashboardPathFor, destroySession } from '../includes/auth.js';

const scrypt = promisify(scryptCallback);

const hashPassword = async (password) => {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = await scrypt(password, salt, 64);
    return `${salt}:${derivedKey.toString('hex')}`;
};

const verifyPassword = async (password, passwordHash) => {
    const [salt, storedKey] = passwordHash.split(':');
    const derivedKey = await scrypt(password, salt, 64);
    const storedBuffer = Buffer.from(storedKey, 'hex');
    return storedBuffer.length === derivedKey.length && timingSafeEqual(storedBuffer, derivedKey);
};

const loginPage = (req, res) => {
    if (req.user) {
        return res.redirect(dashboardPathFor(req.user));
    }
    return res.render('auth/login', { title: 'Login', error: null, email: '' });
};

const registerPage = (req, res) => {
    if (req.user) {
        return res.redirect(dashboardPathFor(req.user));
    }
    return res.render('auth/register', {
        title: 'Register',
        error: null,
        form: { displayName: '', email: '' }
    });
};

const register = async (req, res) => {
    const displayName = typeof req.body.displayName === 'string' ? req.body.displayName.trim() : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!displayName || displayName.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        || password.length < 8) {
        return res.status(400).render('auth/register', {
            title: 'Register',
            error: 'Enter a display name, valid email, and password with at least 8 characters.',
            form: { displayName, email }
        });
    }

    const users = getDb().collection('users');
    await users.createIndex({ email: 1 }, { unique: true });

    let result;
    try {
        result = await users.insertOne({
            displayName,
            email,
            passwordHash: await hashPassword(password),
            role: 'user',
            createdAt: new Date()
        });
    } catch (error) {
        if (error.code !== 11000) {
            throw error;
        }
        return res.status(409).render('auth/register', {
            title: 'Register',
            error: 'An account with that email already exists.',
            form: { displayName, email }
        });
    }

    const user = await users.findOne({ _id: result.insertedId });
    await createSession(user._id, res);
    return res.redirect(dashboardPathFor(user));
};

const login = async (req, res) => {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const user = await getDb().collection('users').findOne({ email });

    if (!user || !await verifyPassword(password, user.passwordHash)) {
        return res.status(401).render('auth/login', {
            title: 'Login',
            error: 'Invalid email or password.',
            email
        });
    }

    await createSession(user._id, res);
    return res.redirect(dashboardPathFor(user));
};

const logout = async (req, res) => {
    await destroySession(req, res);
    return res.redirect('/');
};

export { login, loginPage, logout, register, registerPage };
