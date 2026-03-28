import crypto from 'crypto';
import { User } from '../models/User';
import { hashPassword } from '../utils/password';
import { sendResetPasswordEmail } from './mail.service';

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

/**
 * Generate a secure reset token
 */
function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Handle forgot password request
 * Generates reset token and sends email
 */
export async function forgotPassword(input: ForgotPasswordInput): Promise<void> {
  const { email } = input;

  const user = await User.findOne({ email: email.toLowerCase() }).exec();

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
    await sendResetPasswordEmail({
      email: user.email,
      resetToken,
      userName: user.name,
    });

    console.log(`[PASSWORD-RESET] Password reset email sent successfully for ${email}`);
  } catch (error) {
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
export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  const { token, newPassword } = input;

  // Find user with valid reset token
  const user = await User.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: new Date() }, // Token must not be expired
  }).exec();

  if (!user) {
    throw new Error('Invalid or expired reset token');
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);

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
export async function verifyResetToken(token: string): Promise<boolean> {
  const user = await User.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: new Date() },
  }).exec();

  return !!user;
}
