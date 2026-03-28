"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;
exports.verifyResetToken = verifyResetToken;
const crypto_1 = __importDefault(require("crypto"));
const User_1 = require("../models/User");
const password_1 = require("../utils/password");
const mail_service_1 = require("./mail.service");
/**
 * Generate a secure reset token
 */
function generateResetToken() {
    return crypto_1.default.randomBytes(32).toString('hex');
}
/**
 * Handle forgot password request
 * Generates reset token and sends email
 */
async function forgotPassword(input) {
    const { email } = input;
    const user = await User_1.User.findOne({ email: email.toLowerCase() }).exec();
    // Always return success message to prevent email enumeration
    if (!user) {
        console.log(`[PASSWORD-RESET] Forgot password request for non-existent email: ${email}`);
        return;
    }
    try {
        // Generate reset token (valid for 15 minutes)
        const resetToken = generateResetToken();
        const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        // Save token to database
        user.resetToken = resetToken;
        user.resetTokenExpiry = resetTokenExpiry;
        await user.save();
        console.log(`[PASSWORD-RESET] Reset token generated for ${email}`);
        // Send reset email
        await (0, mail_service_1.sendResetPasswordEmail)({
            email: user.email,
            resetToken,
            userName: user.name,
        });
        console.log(`[PASSWORD-RESET] Password reset email sent successfully for ${email}`);
    }
    catch (error) {
        console.error(`[PASSWORD-RESET] Error during password reset process for ${email}:`, error);
        // Clear the reset token if email sending failed
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        await user.save();
        throw error;
    }
}
/**
 * Handle reset password request
 * Validates token and updates password
 */
async function resetPassword(input) {
    const { token, newPassword } = input;
    // Find user with valid reset token
    const user = await User_1.User.findOne({
        resetToken: token,
        resetTokenExpiry: { $gt: new Date() }, // Token must not be expired
    }).exec();
    if (!user) {
        throw new Error('Invalid or expired reset token');
    }
    // Hash new password
    const hashedPassword = await (0, password_1.hashPassword)(newPassword);
    // Update password and clear reset token
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();
    console.log(`[PASSWORD-RESET] Password reset successful for ${user.email}`);
}
/**
 * Verify reset token is valid
 */
async function verifyResetToken(token) {
    const user = await User_1.User.findOne({
        resetToken: token,
        resetTokenExpiry: { $gt: new Date() },
    }).exec();
    return !!user;
}
