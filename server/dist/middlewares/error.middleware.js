"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const logger_1 = require("../utils/logger");
const isProd = process.env.NODE_ENV === 'production';
function errorHandler(err, _req, res, _next) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger_1.logger.error('Request error', error, { path: _req.path, method: _req.method });
    const status = err.status ?? 500;
    const message = status === 500 && isProd ? 'Internal server error' : error.message;
    res.status(status).json({ message });
}
