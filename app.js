import express from 'express';
import Path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import pkg from './package.json' with { type: 'json' };
import swaggerUi from 'swagger-ui-express';
import globalMiddleware from './src/middleware/global.js';
import { loadSessionUser } from './src/middleware/auth.js';
import routes from './src/routes/router.js';
import swaggerSpecs from './src/swagger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = Path.dirname(__filename);

const app = express();

// Add version info to res.locals for access in templates.
app.use((req, res, next) => {
    res.locals.appVersion = pkg.version;
    next();
});

// Configure static files and EJS templates.
app.use(express.static(Path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', Path.join(__dirname, 'src/views'));

// Parse JSON and URL-encoded request bodies.
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Set up session management
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'kizuna-rail-secure-session-secret-key-2026',
        resave: false,
        saveUninitialized: false,
        rolling: true,
        cookie: {
            maxAge: 60 * 60 * 1000
        }
    })
);

// Load session user into req.user and res.locals.user
app.use(loadSessionUser);

app.use(globalMiddleware);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));
app.use('/', routes);

// Catch requests that did not match a route.
app.use((req, res, next) => {
    const err = new Error('Page Not Found');
    err.status = 404;
    next(err);
});

// Render the appropriate error page.
app.use((err, req, res, next) => {
    const status = err.status || 500;
    if (req.path.startsWith('/api/')) {
        return res.status(status).json({ error: status === 500 ? 'Internal Server Error' : err.message });
    }
    const template = status === 404 ? '404' : '500';
    const context = {
        title: status === 404 ? 'Page Not Found' : 'Server Error',
        error: err.message,
        stack: err.stack
    };

    return res.status(status).render(`errors/${template}`, context);
});

export default app;
