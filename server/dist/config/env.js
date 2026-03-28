"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadEnv = loadEnv;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load .env from project root (not from dist folder)
const envPath = path_1.default.resolve(__dirname, '../../.env');
console.log('[ENV] Loading .env from:', envPath);
const result = dotenv_1.default.config({ path: envPath });
if (result.error) {
    console.warn('[ENV] Warning: Could not load .env file:', result.error.message);
}
else {
    console.log('[ENV] .env file loaded successfully');
}
const LOCAL_MONGO_URI = 'mongodb://localhost:27017/online_recruit_system';
function loadEnv() {
    const { NODE_ENV = 'development', PORT = '5000', MONGODB_URI, USE_LOCAL_MONGO, JWT_SECRET, CORS_ORIGIN, EMAIL_USER, EMAIL_PASSWORD, EMAIL_HOST = 'smtp.gmail.com', EMAIL_PORT = '587', EMAIL_SECURE = 'false', USE_MAILTRAP = 'false', MAILTRAP_USER, MAILTRAP_PASSWORD, } = process.env;
    const isProd = NODE_ENV === 'production';
    // Production: require MONGODB_URI; no local fallback
    let mongoUri;
    if (isProd) {
        if (!MONGODB_URI || !MONGODB_URI.startsWith('mongodb')) {
            throw new Error('MONGODB_URI must be set and valid in production.');
        }
        mongoUri = MONGODB_URI;
    }
    else {
        mongoUri =
            USE_LOCAL_MONGO === 'true' || USE_LOCAL_MONGO === '1'
                ? LOCAL_MONGO_URI
                : MONGODB_URI || LOCAL_MONGO_URI;
    }
    if (!mongoUri) {
        throw new Error('MONGODB_URI is not set. Set it in .env or USE_LOCAL_MONGO=true for local MongoDB.');
    }
    if (!JWT_SECRET || JWT_SECRET.length < 32) {
        if (isProd) {
            throw new Error('JWT_SECRET must be set and at least 32 characters in production.');
        }
    }
    const jwtSecret = JWT_SECRET || 'dev-secret-change-in-production';
    // Email configuration validation
    const useMailtrap = USE_MAILTRAP === 'true' || USE_MAILTRAP === '1';
    if (!useMailtrap && (!EMAIL_USER || !EMAIL_PASSWORD)) {
        console.warn('[ENV] Warning: EMAIL_USER or EMAIL_PASSWORD not set. Password reset emails will fail.');
    }
    return {
        NODE_ENV,
        isProd,
        PORT: parseInt(PORT, 10) || 5000,
        MONGODB_URI: mongoUri,
        JWT_SECRET: jwtSecret,
        CORS_ORIGIN: CORS_ORIGIN || (isProd ? '' : '*'),
        EMAIL_USER: EMAIL_USER || '',
        EMAIL_PASSWORD: EMAIL_PASSWORD || '',
        EMAIL_HOST: EMAIL_HOST,
        EMAIL_PORT: parseInt(EMAIL_PORT, 10) || 587,
        EMAIL_SECURE: EMAIL_SECURE === 'true' || EMAIL_SECURE === '1',
        USE_MAILTRAP: useMailtrap,
        MAILTRAP_USER: MAILTRAP_USER,
        MAILTRAP_PASSWORD: MAILTRAP_PASSWORD,
    };
}
