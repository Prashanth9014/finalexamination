import type { Request, Response, NextFunction } from 'express';
import {
  registerUser,
  loginUser,
  verifyOtp,
  type RegisterInput,
  type LoginInput,
  type OtpVerificationInput,
} from '../services/auth.service';

function validateRegisterBody(body: any): RegisterInput {
  const { name, email, password, role, department, preferredLanguage } = body;

  if (!name || typeof name !== 'string') {
    throw new Error('Name is required');
  }
  if (!email || typeof email !== 'string') {
    throw new Error('Email is required');
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }
  if (role && role !== 'superadmin' && role !== 'admin' && role !== 'candidate') {
    throw new Error('Role must be superadmin, admin or candidate');
  }

  // Validate department - only required for candidates
  const validDepartments = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'MBA'];
  // if (role === 'candidate' || (!role && !department)) {
  //   // For candidates or default registration (which defaults to candidate)
  //   if (!department || typeof department !== 'string' || !validDepartments.includes(department)) {
  //     throw new Error(`Department is required for candidates. Must be one of: ${validDepartments.join(', ')}`);
  //   }
  // }

  // Validate preferred language - only required for candidates
  const validLanguages = ['Python', 'Java', 'C', 'C++'];
  // if (role === 'candidate' || (!role && !preferredLanguage)) {
  //   // For candidates or default registration (which defaults to candidate)
  //   if (!preferredLanguage || typeof preferredLanguage !== 'string' || !validLanguages.includes(preferredLanguage)) {
  //     throw new Error(`Preferred programming language is required for candidates. Must be one of: ${validLanguages.join(', ')}`);
  //   }
  // }

  return { name, email, password, role, department, preferredLanguage };
}

function validateOtpBody(body: any): OtpVerificationInput {
  const { email, otp } = body;

  if (!email || typeof email !== 'string') {
    throw new Error('Email is required');
  }
  if (!otp || typeof otp !== 'string' || otp.length !== 6) {
    throw new Error('Valid 6-digit OTP is required');
  }

  return { email, otp };
}

function validateLoginBody(body: any): LoginInput {
  const { email, password } = body;

  if (!email || typeof email !== 'string') {
    throw new Error('Email is required');
  }
  if (!password || typeof password !== 'string') {
    throw new Error('Password is required');
  }

  return { email, password };
}

function isValidationOrAuthError(message: string): boolean {
  const known = [
    'Name is required',
    'Email is required',
    'Password is required',
    'Password must be at least 6 characters long',
    'Role must be superadmin, admin or candidate',
    'Invalid department',
    'Department is required for candidates',
    'You have already attempted an exam with these credentials',
  ];
  return known.some(msg => message.includes(msg)) || message.includes('exists') || message.includes('Invalid email');
}

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const input = validateRegisterBody(req.body);
    const result = await registerUser(input);
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof Error && isValidationOrAuthError(error.message)) {
      const msg = error.message.includes('Invalid email') ? 'Invalid email or password' : error.message;
      res.status(400).json({ message: msg });
      return;
    }
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const input = validateLoginBody(req.body);
    const result = await loginUser(input);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error) {
      // Handle attempt restriction with 403 status
      if (error.message.includes('You have already attempted an exam with these credentials')) {
        res.status(403).json({ message: error.message });
        return;
      }
      
      // Handle other validation/auth errors with 400 status
      if (isValidationOrAuthError(error.message)) {
        const msg = error.message.includes('Invalid email') ? 'Invalid email or password' : error.message;
        res.status(400).json({ message: msg });
        return;
      }
    }
    next(error);
  }
}

export async function verifyOtpController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = validateOtpBody(req.body);
    const result = await verifyOtp(input);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error && (
      error.message.includes('Email is required') ||
      error.message.includes('OTP is required') ||
      error.message.includes('Invalid OTP') ||
      error.message.includes('OTP has expired') ||
      error.message.includes('User not found')
    )) {
      res.status(400).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export async function getMe(req: any, res: Response, next: NextFunction) {
  try {
    // Fetch full user data from database to include department and preferred language
    const { User } = await import('../models/User');
    const user = await User.findById(req.user.userId).select('id name email role department preferredLanguage canReattempt').exec();
    
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({
      message: "User authenticated",
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department || undefined,
      preferredLanguage: user.preferredLanguage || undefined,
      canReattempt: user.canReattempt || false,
    });
  } catch (error) {
    console.error('Error in getMe:', error);
    res.status(500).json({ message: 'Failed to fetch user info' });
  }
};