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
exports.checkEmailHandler = checkEmailHandler;
exports.forgotPasswordHandler = forgotPasswordHandler;
exports.resetPasswordHandler = resetPasswordHandler;
exports.verifyResetTokenHandler = verifyResetTokenHandler;
const password_reset_service_1 = require("../services/password-reset.service");
/**
 * Validate forgot password request body
 */
function validateForgotPasswordBody(body) {
    const { email } = body;
    if (!email || typeof email !== 'string') {
        throw new Error('Email is required');
    }
    return { email };
}
/**
 * Validate reset password request body
 */
function validateResetPasswordBody(body) {
    const { token, newPassword } = body;
    if (!token || typeof token !== 'string') {
        throw new Error('Reset token is required');
    }
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters long');
    }
    return { token, newPassword };
}
/**
 * POST /api/auth/check-email
 * Check if email exists in the system (for forgot password flow)
 */
async function checkEmailHandler(req, res, next) {
    try {
        const { email } = req.body;
        if (!email || typeof email !== 'string') {
            res.status(400).json({ message: 'Email is required' });
            return;
        }
        const { User } = await Promise.resolve().then(() => __importStar(require('../models/User')));
        const user = await User.findOne({ email: email.toLowerCase() }).exec();
        if (user) {
            res.status(200).json({
                exists: true,
                message: 'Email found in our system'
            });
        }
        else {
            res.status(200).json({
                exists: false,
                message: 'No account found with this email address'
            });
        }
    }
    catch (error) {
        next(error);
    }
}
/**
 * POST /api/auth/forgot-password
 * Request password reset email
 */
async function forgotPasswordHandler(req, res, next) {
    try {
        const input = validateForgotPasswordBody(req.body);
        await (0, password_reset_service_1.forgotPassword)(input);
        // Always return success to prevent email enumeration
        res.status(200).json({
            message: 'If the email exists in our system, a password reset link will be sent.',
        });
    }
    catch (error) {
        if (error instanceof Error && error.message === 'Email is required') {
            res.status(400).json({ message: error.message });
            return;
        }
        // Handle email sending errors
        if (error instanceof Error && error.message.includes('Failed to send reset password email')) {
            console.error('[FORGOT-PASSWORD] Email sending failed:', error.message);
            // Return actual error for debugging
            res.status(500).json({
                message: 'Failed to send reset email. Please try again.',
            });
            return;
        }
        next(error);
    }
}
/**
 * POST /api/auth/reset-password
 * Reset password with valid token
 */
async function resetPasswordHandler(req, res, next) {
    try {
        const input = validateResetPasswordBody(req.body);
        await (0, password_reset_service_1.resetPassword)(input);
        res.status(200).json({
            message: 'Password reset successful. You can now login with your new password.',
        });
    }
    catch (error) {
        if (error instanceof Error) {
            if (error.message === 'Invalid or expired reset token') {
                res.status(400).json({ message: error.message });
                return;
            }
            if (error.message === 'Password must be at least 6 characters long') {
                res.status(400).json({ message: error.message });
                return;
            }
            if (error.message === 'Reset token is required') {
                res.status(400).json({ message: error.message });
                return;
            }
        }
        next(error);
    }
}
/**
 * GET /api/auth/verify-reset-token/:token
 * Verify if reset token is valid
 */
async function verifyResetTokenHandler(req, res, next) {
    try {
        const { token } = req.params;
        if (!token || typeof token !== 'string') {
            res.status(400).json({ message: 'Reset token is required' });
            return;
        }
        const isValid = await (0, password_reset_service_1.verifyResetToken)(token);
        if (!isValid) {
            res.status(400).json({ message: 'Invalid or expired reset token' });
            return;
        }
        res.status(200).json({ message: 'Reset token is valid' });
    }
    catch (error) {
        next(error);
    }
}
