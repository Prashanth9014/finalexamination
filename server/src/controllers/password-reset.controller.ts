import type { Request, Response, NextFunction } from 'express';
import {
  forgotPassword,
  resetPassword,
  verifyResetToken,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from '../services/password-reset.service';

/**
 * Validate forgot password request body
 */
function validateForgotPasswordBody(body: any): ForgotPasswordInput {
  const { email } = body;

  if (!email || typeof email !== 'string') {
    throw new Error('Email is required');
  }

  return { email };
}

/**
 * Validate reset password request body
 */
function validateResetPasswordBody(body: any): ResetPasswordInput {
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
 * POST /api/auth/forgot-password
 * Request password reset email
 */
export async function forgotPasswordHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const input = validateForgotPasswordBody(req.body);
    await forgotPassword(input);

    // Always return success to prevent email enumeration
    res.status(200).json({
      message: 'If the email exists in our system, a password reset link will be sent.',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Email is required') {
      res.status(400).json({ message: error.message });
      return;
    }
    
    // Handle email sending errors
    if (error instanceof Error && error.message.includes('Failed to send reset password email')) {
      console.error('[FORGOT-PASSWORD] Email sending failed:', error.message);
      // Still return success to prevent email enumeration, but log the error
      res.status(200).json({
        message: 'If the email exists in our system, a password reset link will be sent.',
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
export async function resetPasswordHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const input = validateResetPasswordBody(req.body);
    await resetPassword(input);

    res.status(200).json({
      message: 'Password reset successful. You can now login with your new password.',
    });
  } catch (error) {
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
export async function verifyResetTokenHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { token } = req.params;

    if (!token || typeof token !== 'string') {
      res.status(400).json({ message: 'Reset token is required' });
      return;
    }

    const isValid = await verifyResetToken(token);

    if (!isValid) {
      res.status(400).json({ message: 'Invalid or expired reset token' });
      return;
    }

    res.status(200).json({ message: 'Reset token is valid' });
  } catch (error) {
    next(error);
  }
}
