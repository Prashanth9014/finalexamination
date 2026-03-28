"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const logger_1 = require("./utils/logger");
const env = (0, env_1.loadEnv)();
const PORT = env.PORT || 5000;
const LOCAL_MONGO_URI = 'mongodb://localhost:27017/online_recruit_system';
function srvToStandardUri(srvUri) {
    try {
        const match = srvUri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^/]+)\/([^?]*)(\?.*)?/);
        if (!match)
            return srvUri;
        const [, user, pass, host, db, qs = ''] = match;
        const params = new URLSearchParams(qs.replace('?', ''));
        params.set('ssl', 'true');
        params.set('authSource', 'admin');
        return `mongodb://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:27017/${db}?${params.toString()}`;
    }
    catch {
        return srvUri;
    }
}
async function connectMongo() {
    const options = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: env.isProd ? 10000 : 5000,
    };
    try {
        await mongoose_1.default.connect(env.MONGODB_URI, options);
        logger_1.logger.info('Connected to MongoDB');
    }
    catch (mongoError) {
        const err = mongoError;
        const isSrvError = err?.code === 'ECONNREFUSED' && err?.syscall === 'querySrv';
        if (env.isProd) {
            logger_1.logger.error('MongoDB connection failed', mongoError);
            throw mongoError;
        }
        if (isSrvError && env.MONGODB_URI.startsWith('mongodb+srv://') && !env.MONGODB_URI.includes('localhost')) {
            logger_1.logger.warn('SRV lookup failed. Trying standard connection string...');
            try {
                await mongoose_1.default.connect(srvToStandardUri(env.MONGODB_URI), options);
                logger_1.logger.info('Connected to MongoDB');
                return;
            }
            catch {
                logger_1.logger.warn('Standard Atlas failed. Trying local MongoDB...');
            }
            try {
                await mongoose_1.default.connect(LOCAL_MONGO_URI, options);
                logger_1.logger.info('Connected to MongoDB (local)');
            }
            catch {
                logger_1.logger.error('All connection attempts failed. Install MongoDB locally or fix network.', mongoError);
                throw mongoError;
            }
        }
        else {
            throw mongoError;
        }
    }
}
async function start() {
    try {
        await connectMongo();
        const server = http_1.default.createServer(app_1.default);
        server.listen(PORT, () => {
            logger_1.logger.info(`Server running on port ${PORT}`, { NODE_ENV: env.NODE_ENV });
        });
        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                logger_1.logger.error(`Port ${PORT} is already in use. Please free the port and restart.`);
                process.exit(1);
            }
            else {
                logger_1.logger.error('Server error', error);
                process.exit(1);
            }
        });
        const shutdown = (signal) => {
            logger_1.logger.info(`${signal} received. Shutting down gracefully.`);
            server.close(() => {
                mongoose_1.default.connection.close(false).then(() => {
                    logger_1.logger.info('MongoDB connection closed.');
                    process.exit(0);
                }, (err) => {
                    logger_1.logger.error('Error closing MongoDB', err);
                    process.exit(1);
                });
            });
        };
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    }
    catch (error) {
        logger_1.logger.error('Failed to start server', error);
        process.exit(1);
    }
}
void start();
