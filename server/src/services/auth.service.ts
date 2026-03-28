import { User, type IUser, type UserRole } from '../models/User';
import { hashPassword, comparePassword } from '../utils/password';
import { signToken } from '../utils/jwt';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  department?: string;
  preferredLanguage?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    department?: string;
    preferredLanguage?: string;
    createdAt: Date;
  };
  token: string;
}

export interface OtpRequiredResponse {
  requiresOtp: true;
  message: string;
}

export async function registerUser(input: RegisterInput): Promise<AuthResponse> {
  const { name, email, password, role = 'candidate', department, preferredLanguage } = input;

  console.log('[AUTH-SERVICE] Register input:', { name, email, role, department, preferredLanguage });

  const existing = await User.findOne({ email: email.toLowerCase() }).exec();
  if (existing) {
    throw new Error('User with this email already exists');
  }

  const hashedPassword = await hashPassword(password);

  const userDoc: IUser = await User.create({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    role,
    department,
    preferredLanguage,
  });

  console.log('[AUTH-SERVICE] User created:', { id: userDoc.id, email: userDoc.email, role: userDoc.role, department: userDoc.department, preferredLanguage: userDoc.preferredLanguage });

  const token = signToken({ userId: userDoc.id, role: userDoc.role });

  const response: AuthResponse = {
    user: {
      id: userDoc.id,
      name: userDoc.name,
      email: userDoc.email,
      role: userDoc.role,
      department: userDoc.department || undefined,
      preferredLanguage: userDoc.preferredLanguage || undefined,
      createdAt: userDoc.createdAt,
    },
    token,
  };

  console.log('[AUTH-SERVICE] Register response:', JSON.stringify(response, null, 2));

  return response;
}

export interface OtpVerificationInput {
  email: string;
  otp: string;
}

export async function verifyOtp(input: OtpVerificationInput): Promise<AuthResponse> {
  const { email, otp } = input;

  const userDoc = await User.findOne({ email: email.toLowerCase() }).exec();
  if (!userDoc) {
    throw new Error('User not found');
  }

  // Check if OTP exists and matches
  if (!userDoc.otp || userDoc.otp !== otp) {
    throw new Error('Invalid OTP');
  }

  // Check if OTP is expired
  if (!userDoc.otpExpiry || userDoc.otpExpiry < new Date()) {
    throw new Error('OTP has expired. Please login again.');
  }

  // Clear OTP fields after successful verification
  userDoc.otp = undefined;
  userDoc.otpExpiry = undefined;
  await userDoc.save();

  // Generate token
  const token = signToken({ userId: userDoc.id, role: userDoc.role });

  const response: AuthResponse = {
    user: {
      id: userDoc.id,
      name: userDoc.name,
      email: userDoc.email,
      role: userDoc.role,
      department: userDoc.department || undefined,
      preferredLanguage: userDoc.preferredLanguage || undefined,
      createdAt: userDoc.createdAt,
    },
    token,
  };

  console.log('[AUTH-SERVICE] OTP verification successful for:', userDoc.email);

  return response;
}

export async function loginUser(input: LoginInput): Promise<AuthResponse | OtpRequiredResponse> {
  const { email, password } = input;

  const userDoc = await User.findOne({ email: email.toLowerCase() }).exec();
  if (!userDoc) {
    throw new Error('Invalid email or password');
  }

  const isMatch = await comparePassword(password, userDoc.password);
  if (!isMatch) {
    throw new Error('Invalid email or password');
  }

  // STEP 1: LOGIN-LEVEL ATTEMPT RESTRICTION FOR CANDIDATES
  // Check if candidate has already submitted an exam (only for candidates)
  if (userDoc.role === 'candidate' && userDoc.canReattempt !== true) {
    const { Submission } = await import('../models/Submission');
    
    const submittedExam = await Submission.findOne({
      userId: userDoc._id,
      status: 'submitted'
    }).exec();

    if (submittedExam) {
      console.log(`[AUTH-SERVICE] Login blocked for candidate ${userDoc.email} - already submitted exam`);
      throw new Error('You have already attempted an exam with these credentials. Please contact admin to reattempt.');
    }
  }

  // Check if user is superadmin - require OTP
  if (userDoc.role === 'superadmin') {
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set OTP and expiry (5 minutes)
    userDoc.otp = otp;
    userDoc.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    await userDoc.save();

    // Send OTP via email
    try {
      const { sendOtpEmail } = await import('./mail.service');
      await sendOtpEmail({
        email: userDoc.email,
        otp,
        userName: userDoc.name,
      });
    } catch (emailError) {
      console.error('[AUTH] Failed to send OTP email:', emailError);
      throw new Error('Failed to send OTP. Please try again.');
    }

    return {
      requiresOtp: true,
      message: 'OTP sent to your email. Please verify to continue.',
    };
  }

  // For admin and candidate - continue with normal flow
  const token = signToken({ userId: userDoc.id, role: userDoc.role });

  // Explicitly include department and preferredLanguage fields, even if undefined
  const response: AuthResponse = {
    user: {
      id: userDoc.id,
      name: userDoc.name,
      email: userDoc.email,
      role: userDoc.role,
      department: userDoc.department || undefined,
      preferredLanguage: userDoc.preferredLanguage || undefined,
      createdAt: userDoc.createdAt,
    },
    token,
  };

  console.log('[AUTH-SERVICE] Login response:', JSON.stringify(response, null, 2));

  return response;
}

