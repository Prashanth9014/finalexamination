"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const password_reset_controller_1 = require("../controllers/password-reset.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Helpful response when user opens URL in browser (GET instead of POST)
router.get('/register', (_req, res) => {
    res.status(405).json({
        message: 'Use POST to register. Example: POST /api/auth/register with body { "name", "email", "password" }',
    });
});
router.get('/login', (_req, res) => {
    res.status(405).json({
        message: 'Use POST to login. Example: POST /api/auth/login with body { "email", "password" }',
    });
});
router.post('/register', auth_controller_1.register);
router.post('/login', auth_controller_1.login);
router.post('/verify-otp', auth_controller_1.verifyOtpController);
router.get('/me', auth_middleware_1.authenticate, auth_controller_1.getMe);
// Password reset routes
router.post('/forgot-password', password_reset_controller_1.forgotPasswordHandler);
router.post('/reset-password', password_reset_controller_1.resetPasswordHandler);
router.get('/verify-reset-token/:token', password_reset_controller_1.verifyResetTokenHandler);
exports.default = router;
// Diagnostic endpoint to verify Gmail configuration (development only)
if (process.env.NODE_ENV === 'development') {
    router.get('/verify-email-config', async (req, res) => {
        try {
            const { verifyTransporter } = await Promise.resolve().then(() => __importStar(require('../services/mail.service')));
            const isValid = await verifyTransporter();
            if (isValid) {
                res.status(200).json({
                    status: 'success',
                    message: 'Gmail configuration is valid and ready to send emails',
                });
            }
            else {
                res.status(400).json({
                    status: 'error',
                    message: 'Gmail configuration failed. Check backend logs for details.',
                });
            }
        }
        catch (error) {
            res.status(500).json({
                status: 'error',
                message: 'Error verifying email configuration',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    });
}
