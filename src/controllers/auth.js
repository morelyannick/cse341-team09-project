import { createUser, findUserByEmail, findUserByUsername, verifyPassword } from '../models/users.js';

export const registerPage = (req, res) => {
    return res.render('auth/register', { title: 'Register', error: null });
};

export const processRegister = async (req, res) => {
    try {
        const { name, username, email, password } = req.body;

        if (!name || !username || !email || !password) {
            return res.status(400).render('auth/register', {
                title: 'Register',
                error: 'All fields (name, username, email, password) are required.'
            });
        }

        const existingEmail = await findUserByEmail(email);
        if (existingEmail) {
            return res.status(400).render('auth/register', {
                title: 'Register',
                error: 'An account with this email already exists.'
            });
        }

        const existingUsername = await findUserByUsername(username);
        if (existingUsername) {
            return res.status(400).render('auth/register', {
                title: 'Register',
                error: 'An account with this username already exists.'
            });
        }

        const user = await createUser({
            name,
            username,
            email,
            password,
            roleName: 'customer'
        });

        req.session.user = {
            id: user._id.toString(),
            name: user.name,
            username: user.username,
            email: user.email,
            role: 'customer'
        };

        return res.redirect('/');
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).render('auth/register', {
            title: 'Register',
            error: 'Registration failed due to an unexpected error.'
        });
    }
};

export const loginPage = (req, res) => {
    return res.render('auth/login', { title: 'Login', error: null });
};

export const processLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).render('auth/login', {
                title: 'Login',
                error: 'Email and password are required.'
            });
        }

        const user = await findUserByEmail(email);
        if (!user) {
            return res.status(401).render('auth/login', {
                title: 'Login',
                error: 'Invalid email or password.'
            });
        }

        const matches = await verifyPassword(password, user.passwordHash);
        if (!matches) {
            return res.status(401).render('auth/login', {
                title: 'Login',
                error: 'Invalid email or password.'
            });
        }

        const roleName = user.role ? user.role.name : 'customer';

        req.session.user = {
            id: user._id.toString(),
            name: user.name,
            username: user.username,
            email: user.email,
            role: roleName
        };

        if (roleName === 'admin') {
            return res.redirect('/admin/dashboard');
        }

        return res.redirect('/');
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).render('auth/login', {
            title: 'Login',
            error: 'Login failed due to an unexpected server error.'
        });
    }
};

export const logout = (req, res) => {
    if (req.session) {
        req.session.destroy(() => {
            res.redirect('/');
        });
    } else {
        res.redirect('/');
    }
};

export const adminDashboardPage = (req, res) => {
    return res.render('admin/dashboard', {
        title: 'Admin Dashboard',
        user: req.user
    });
};
