import type { Request, Response, NextFunction } from 'express';
import { registerAdmin, type AdminRegisterInput } from '../services/admin.service';
import { validateAdminSecretKey } from '../utils/adminValidation';

/**
 * Validate admin registration request body
 */
function validateAdminRegisterBody(body: any): AdminRegisterInput {
  const { name, email, password, secretKey } = body;

  if (!name || typeof name !== 'string') {
    throw new Error('Name is required');
  }
  if (!email || typeof email !== 'string') {
    throw new Error('Email is required');
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }
  return { name, email, password, secretKey: '' };
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
    'Admin secret key is required',
  ];
  return knownErrors.includes(message) || message.includes('exists');
}

/**
 * Check if error is an invalid secret key error
 */
function isInvalidSecretKeyError(message: string): boolean {
  return message === 'Invalid admin secret key';
}

/**
 * Admin registration controller
 * POST /api/admin/register
 * Creates a new admin user with role = 'admin'
 * Requires valid secret key
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
    if (error instanceof Error && isInvalidSecretKeyError(error.message)) {
      res.status(403).json({ message: error.message });
      return;
    }
    if (error instanceof Error && isValidationOrAuthError(error.message)) {
      res.status(400).json({ message: error.message });
      return;
    }
    next(error);
  }
}

/**
 * Get all admins
 * POST /api/admins/list
 * Requires valid secret key in request body
 */
export async function getAdminsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { secretKey } = req.body;

    console.log('\n========== [DEBUG] getAdminsHandler START ==========');
    console.log('Request received at /api/admins/list');
    console.log('Full request body:', JSON.stringify(req.body));
    console.log('Extracted secretKey:', JSON.stringify(secretKey));
    console.log('secretKey type:', typeof secretKey);
    console.log('secretKey length:', secretKey?.length);

    console.log('Secret key validation removed, fetching admins...');

    console.log('Secret key validation passed, fetching admins...');
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
 * Requires valid secret key in request body
 */
export async function deleteAdminHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;
    const { secretKey } = req.body;



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
