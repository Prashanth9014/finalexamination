import nodemailer from 'nodemailer';
import { loadEnv } from '../config/env';

// Initialize transporter with explicit SMTP configuration
let transporter: nodemailer.Transporter | null = null;
let transporterVerified = false;

/**
 * Initialize the email transporter for Gmail SMTP
 * Uses explicit host/port configuration (not service: 'gmail')
 */
function initializeTransporter(): nodemailer.Transporter {
  if (transporter && transporterVerified) {
    return transporter;
  }

  const env = loadEnv();
  
  console.log('[MAIL] ========== TRANSPORTER INITIALIZATION ==========');
  console.log('[MAIL] Environment variables loaded:');
  console.log(`  EMAIL_USER: ${env.EMAIL_USER ? env.EMAIL_USER.substring(0, 5) + '***' : 'NOT SET'}`);
  console.log(`  EMAIL_PASSWORD length: ${env.EMAIL_PASSWORD ? env.EMAIL_PASSWORD.length : 0} characters`);
  console.log(`  EMAIL_HOST: ${env.EMAIL_HOST}`);
  console.log(`  EMAIL_PORT: ${env.EMAIL_PORT}`);
  console.log(`  EMAIL_SECURE: ${env.EMAIL_SECURE}`);

  // Validate required Gmail configuration
  if (!env.EMAIL_USER || !env.EMAIL_PASSWORD) {
    console.error('[MAIL] ❌ EMAIL_USER or EMAIL_PASSWORD not set in .env');
    console.error('[MAIL] Please configure Gmail credentials in server/.env');
    console.log('[MAIL] ================================================');
    throw new Error('Gmail credentials not configured. Set EMAIL_USER and EMAIL_PASSWORD in .env');
  }

  // Create Gmail transporter with explicit SMTP configuration
  console.log('[MAIL] Initializing Gmail SMTP transporter...');
  try {
    transporter = nodemailer.createTransport({
      host: env.EMAIL_HOST,
      port: env.EMAIL_PORT,
      secure: env.EMAIL_SECURE,
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASSWORD,
      },
      connectionTimeout: 10000,
      socketTimeout: 10000,
      logger: true,
      debug: true,
      tls: {
        rejectUnauthorized: false,
      },
    });
    
    console.log('[MAIL] ✅ Gmail transporter created successfully');
    console.log('[MAIL] ================================================');
    return transporter;
  } catch (error) {
    console.error('[MAIL] ❌ Failed to create Gmail transporter:', error);
    console.log('[MAIL] ================================================');
    throw new Error('Failed to initialize Gmail transporter');
  }
}

export interface SendOtpEmailInput {
  email: string;
  otp: string;
  userName: string;
}

/**
 * Send OTP email for superadmin login
 */
export async function sendOtpEmail(input: SendOtpEmailInput): Promise<void> {
  const { email, otp, userName } = input;

  try {
    console.log('[MAIL] ========== OTP EMAIL SENDING ==========');
    
    // Load environment variables
    const env = loadEnv();
    
    // Initialize transporter
    const mailTransporter = initializeTransporter();
    console.log('[MAIL] Gmail transporter ready for OTP');

    // Verify transporter connection before sending
    if (!transporterVerified) {
      console.log('[MAIL] Verifying Gmail connection...');
      try {
        await mailTransporter.verify();
        transporterVerified = true;
        console.log('[MAIL] ✅ Gmail connection verified successfully');
      } catch (verifyError) {
        console.error('[MAIL] ❌ Gmail connection verification failed:', verifyError);
        transporterVerified = false;
        throw verifyError;
      }
    }

    const mailOptions = {
      from: env.EMAIL_USER,
      to: email,
      subject: 'Superadmin Login - OTP Verification',
      html: `
        <h2>Superadmin Login Verification</h2>
        <p>Hi ${userName},</p>
        <p>Your OTP for superadmin login is:</p>
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
          <h1 style="color: #667eea; font-size: 32px; margin: 0; letter-spacing: 4px;">${otp}</h1>
        </div>
        <p><strong>This OTP will expire in 5 minutes.</strong></p>
        <p>If you didn't attempt to login, please secure your account immediately.</p>
        <p>Best regards,<br>Online Recruitment System</p>
      `,
    };

    console.log(`[MAIL] Sending OTP email to: ${email}`);
    
    const info = await mailTransporter.sendMail(mailOptions);
    
    console.log(`[MAIL] ✅ OTP email sent successfully!`);
    console.log(`[MAIL] Message ID: ${info.messageId}`);
    console.log('[MAIL] ==========================================');
  } catch (error) {
    console.error('[MAIL] ❌ Error sending OTP email:', error);
    console.log('[MAIL] ==========================================');
    throw new Error('Failed to send OTP email. Please try again later.');
  }
}

export interface SendResetEmailInput {
  email: string;
  resetToken: string;
  userName: string;
}

/**
 * Send password reset email
 */
export async function sendResetPasswordEmail(input: SendResetEmailInput): Promise<void> {
  const { email, resetToken, userName } = input;

  try {
    console.log('[MAIL] ========== EMAIL SENDING PROCESS ==========');
    
    // Load environment variables
    const env = loadEnv();
    
    // Initialize transporter
    const mailTransporter = initializeTransporter();
    console.log('[MAIL] Gmail transporter ready');

    // Verify transporter connection before sending
    if (!transporterVerified) {
      console.log('[MAIL] Verifying Gmail connection...');
      try {
        await mailTransporter.verify();
        transporterVerified = true;
        console.log('[MAIL] ✅ Gmail connection verified successfully');
      } catch (verifyError) {
        console.error('[MAIL] ❌ Gmail connection verification failed:', verifyError);
        transporterVerified = false;
        throw verifyError;
      }
    }

    // Build reset link
    const resetLink = `http://localhost:3001/reset-password/${resetToken}`;
    console.log(`[MAIL] Reset link generated: ${resetLink.substring(0, 50)}...`);

    const mailOptions = {
      from: env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <h2>Password Reset Request</h2>
        <p>Hi ${userName},</p>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <p>
          <a href="${resetLink}" style="background-color: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </p>
        <p>Or copy this link: ${resetLink}</p>
        <p>This link will expire in 15 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>Online Recruitment System</p>
      `,
    };

    console.log(`[MAIL] Sending email to: ${email}`);
    console.log(`[MAIL] From: ${mailOptions.from}`);
    
    const info = await mailTransporter.sendMail(mailOptions);
    
    console.log(`[MAIL] ✅ Email sent successfully!`);
    console.log(`[MAIL] Message ID: ${info.messageId}`);
    console.log(`[MAIL] Response: ${info.response}`);
    console.log('[MAIL] ==========================================');
  } catch (error) {
    console.error('[MAIL] ❌ Error sending email:', error);
    
    // Log specific error details for debugging
    if (error instanceof Error) {
      console.error(`[MAIL] Error message: ${error.message}`);
      console.error(`[MAIL] Error code: ${(error as any).code}`);
      console.error(`[MAIL] Error command: ${(error as any).command}`);
      console.error(`[MAIL] Error response: ${(error as any).response}`);
      
      // Check if it's a Gmail authentication error
      if ((error as any).code === 'EAUTH') {
        console.error('[MAIL] ');
        console.error('[MAIL] ⚠️  GMAIL AUTHENTICATION FAILED');
        console.error('[MAIL] The EMAIL_PASSWORD in .env is incorrect or invalid.');
        console.error('[MAIL] ');
        console.error('[MAIL] To fix this:');
        console.error('[MAIL] 1. Go to https://myaccount.google.com/apppasswords');
        console.error('[MAIL] 2. Make sure 2-Factor Authentication is enabled');
        console.error('[MAIL] 3. Select "Mail" and "Windows Computer"');
        console.error('[MAIL] 4. Copy the 16-character password (with spaces)');
        console.error('[MAIL] 5. Update EMAIL_PASSWORD in server/.env');
        console.error('[MAIL] 6. Restart the backend with: npm run dev');
        console.error('[MAIL] ');
      }
    }
    
    console.log('[MAIL] ==========================================');
    throw new Error('Failed to send reset password email. Please try again later.');
  }
}

/**
 * Verify transporter connection (for testing)
 */
export async function verifyTransporter(): Promise<boolean> {
  try {
    console.log('[MAIL] Verifying Gmail transporter connection...');
    const mailTransporter = initializeTransporter();
    await mailTransporter.verify();
    transporterVerified = true;
    console.log('[MAIL] ✅ Gmail transporter verification successful');
    return true;
  } catch (error) {
    console.error('[MAIL] ❌ Gmail transporter verification failed:', error);
    transporterVerified = false;
    return false;
  }
}
