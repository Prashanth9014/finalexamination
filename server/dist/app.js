"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const mongoose_1 = __importDefault(require("mongoose"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const exam_routes_1 = __importDefault(require("./routes/exam.routes"));
const submission_routes_1 = __importDefault(require("./routes/submission.routes"));
const codeExecution_routes_1 = __importDefault(require("./routes/codeExecution.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const error_middleware_1 = require("./middlewares/error.middleware");
function createApp(corsOrigin) {
    const app = (0, express_1.default)();
    // Disable ETags globally to prevent 304 responses
    app.set('etag', false);
    app.use((0, helmet_1.default)());
    app.use(express_1.default.json({ limit: '1mb' }));
    const corsOptions = corsOrigin === '*'
        ? { origin: true }
        : { origin: corsOrigin.split(',').map((o) => o.trim()), credentials: true };
    app.use((0, cors_1.default)(corsOptions));
    if (process.env.NODE_ENV === 'production') {
        app.use((0, morgan_1.default)('combined'));
        app.use((0, express_rate_limit_1.default)({
            windowMs: 15 * 60 * 1000,
            max: 100,
            message: { message: 'Too many requests, please try again later.' },
            standardHeaders: true,
            legacyHeaders: false,
        }));
        app.use('/api/auth', (0, express_rate_limit_1.default)({
            windowMs: 15 * 60 * 1000,
            max: 20,
            message: { message: 'Too many auth attempts. Try again later.' },
            standardHeaders: true,
            legacyHeaders: false,
        }));
    }
    else {
        app.use((0, morgan_1.default)('dev'));
    }
    app.use('/api/auth', auth_routes_1.default);
    app.use('/api/admin', admin_routes_1.default);
    app.use('/api/admins', admin_routes_1.default);
    app.use('/api/exams', exam_routes_1.default);
    app.use('/api/submissions', submission_routes_1.default);
    app.use('/api/code', codeExecution_routes_1.default);
    app.get('/api/health', async (_req, res) => {
        const dbState = mongoose_1.default.connection.readyState;
        const healthy = dbState === 1;
        if (process.env.NODE_ENV === 'production' && !healthy) {
            return res.status(503).json({
                status: 'unhealthy',
                service: 'online-recruit-system-backend',
                database: dbState === 0 ? 'disconnected' : dbState === 2 ? 'connecting' : 'disconnecting',
            });
        }
        res.json({
            status: healthy ? 'ok' : 'degraded',
            service: 'online-recruit-system-backend',
            ...(process.env.NODE_ENV !== 'production' && { database: dbState === 1 ? 'connected' : 'not connected' }),
        });
    });
    app.use(error_middleware_1.errorHandler);
    return app;
}
const corsOrigin = process.env.CORS_ORIGIN || '*';
exports.default = createApp(corsOrigin);
