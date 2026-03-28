"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const isProd = process.env.NODE_ENV === 'production';
exports.logger = {
    info: (msg, meta) => {
        if (isProd) {
            console.log(JSON.stringify({ level: 'info', msg, ...meta }));
        }
        else {
            console.log(msg, meta ?? '');
        }
    },
    warn: (msg, meta) => {
        if (isProd) {
            console.warn(JSON.stringify({ level: 'warn', msg, ...meta }));
        }
        else {
            console.warn(msg, meta ?? '');
        }
    },
    error: (msg, err, meta) => {
        const payload = { level: 'error', msg, ...meta };
        if (err instanceof Error) {
            payload.error = err.message;
            if (!isProd)
                payload.stack = err.stack;
        }
        else if (err != null) {
            payload.error = String(err);
        }
        if (isProd) {
            console.error(JSON.stringify(payload));
        }
        else {
            console.error(msg, err, meta ?? '');
        }
    },
};
