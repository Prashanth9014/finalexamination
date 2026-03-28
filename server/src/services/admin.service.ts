import { User, type IUser } from '../models/User';
import { hashPassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { validateAdminSecretKey } from '../utils/adminValidation';

export interface AdminRegisterInput {
  name: string;
  email: string;
  password: string;
  secretKey: string;
}

export interface AdminRegisterResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'admin';
    createdAt: Date;
  };
  token: string;
}

/**
 * Register a new admin user
 * Admin registration endpoint - always creates user with role = 'admin'
 * Requires valid secret key for security
 */
export async function registerAdmin(input: AdminRegisterInput): Promise<AdminRegisterResponse> {
  const { name, email, password, secretKey } = input;



  // Check if user already exists
  const existing = await User.findOne({ email: email.toLowerCase() }).exec();
  if (existing) {
    throw new Error('User with this email already exists');
  }

  // Hash password using bcrypt with 10 salt rounds
  // The number 10 represents the cost factor (salt rounds)
  // Higher number = more secure but slower
  // 10 is the standard used throughout the application
  const hashedPassword = await hashPassword(password);

  // Create new user with admin role
  // Role is always set to 'admin' for admin registration endpoint
  const userDoc: IUser = await User.create({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    role: 'admin',
  });

  // Generate JWT token for automatic login
  const token = signToken({ userId: userDoc.id, role: userDoc.role });

  return {
    user: {
      id: userDoc.id,
      name: userDoc.name,
      email: userDoc.email,
      role: 'admin',
      createdAt: userDoc.createdAt,
    },
    token,
  };
}
