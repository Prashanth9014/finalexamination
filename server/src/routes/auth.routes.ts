import { Router, Request, Response } from 'express';
import { register, login, getMe, verifyOtpController } from '../controllers/auth.controller';
import {
  forgotPasswordHandler,
  resetPasswordHandler,
  verifyResetTokenHandler,
} from '../controllers/password-reset.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

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

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOtpController);
router.get('/me', authenticate, getMe);

// Password reset routes
router.post('/forgot-password', forgotPasswordHandler);
router.post('/reset-password', resetPasswordHandler);
router.get('/verify-reset-token/:token', verifyResetTokenHandler);

export default router;


// Diagnostic endpoint to verify Gmail configuration (development only)
if (process.env.NODE_ENV === 'development') {
  router.get('/verify-email-config', async (req: Request, res: Response) => {
    try {
      const { verifyTransporter } = await import('../services/mail.service');
      const isValid = await verifyTransporter();

      if (isValid) {
        res.status(200).json({
          status: 'success',
          message: 'Gmail configuration is valid and ready to send emails',
        });
      } else {
        res.status(400).json({
          status: 'error',
          message: 'Gmail configuration failed. Check backend logs for details.',
        });
      }
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Error verifying email configuration',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}

