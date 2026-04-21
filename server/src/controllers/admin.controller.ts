import type { Request, Response, NextFunction } from 'express';
import { registerAdmin, type AdminRegisterInput } from '../services/admin.service';

/**
 * Validate admin registration request body
 */
function validateAdminRegisterBody(body: any): AdminRegisterInput {
  const { name, email, password } = body;

  if (!name || typeof name !== 'string') {
    throw new Error('Name is required');
  }
  if (!email || typeof email !== 'string') {
    throw new Error('Email is required');
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }
  return { name, email, password };
}

/**
 * Check if error is a validation or authentication error
 */
function isValidationOrAuthError(message: string): boolean {
  const knownErrors = [
    'Name is required',
    'Email is required',
    'Password is required',
    'Password must be at least 6 characters long',
  ];
  return knownErrors.includes(message) || message.includes('exists');
}

/**
 * Admin registration controller
 * POST /api/admins/register
 * Creates a new admin user with role = 'admin'
 * Only accessible by superadmin (authentication handled by middleware)
 */
export async function registerAdminHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const input = validateAdminRegisterBody(req.body);
    const result = await registerAdmin(input);
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof Error && isValidationOrAuthError(error.message)) {
      res.status(400).json({ message: error.message });
      return;
    }
    next(error);
  }
}

/**
 * Get all admins
 * GET /api/admins/list
 * Only accessible by superadmin (authentication handled by middleware)
 */
export async function getAdminsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    console.log('\n========== [DEBUG] getAdminsHandler START ==========');
    console.log('Request received at /api/admins/list');
    console.log('User from token:', (req as any).user);

    const { User } = await import('../models/User');
    const admins = await User.find({ role: 'admin' }).select('-password');

    console.log('Found', admins.length, 'admins');
    console.log('========== [DEBUG] getAdminsHandler END (SUCCESS) ==========\n');
    res.status(200).json({ admins });
  } catch (error) {
    console.log('ERROR in getAdminsHandler:', error);
    console.log('========== [DEBUG] getAdminsHandler END (ERROR) ==========\n');
    next(error);
  }
}

/**
 * Delete an admin
 * DELETE /api/admins/:id
 * Only accessible by superadmin (authentication handled by middleware)
 */
export async function deleteAdminHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;

    const { User } = await import('../models/User');
    const admin = await User.findById(id);

    if (!admin) {
      res.status(404).json({ message: 'Admin not found' });
      return;
    }

    if (admin.role !== 'admin') {
      res.status(400).json({ message: 'User is not an admin' });
      return;
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({ message: 'Admin deleted successfully' });
  } catch (error) {
    next(error);
  }
}
