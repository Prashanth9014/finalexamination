import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';
import { loadEnv } from '../config/env';
import type { UserRole } from '../models/User';

const { JWT_SECRET } = loadEnv();
const JWT_SECRET_KEY: Secret = JWT_SECRET;

export interface JwtPayload {
  userId: string;
  role: UserRole;
}

export function signToken(
  payload: JwtPayload,
  expiresIn: SignOptions['expiresIn'] = '7d',
): string {
  const options: SignOptions = { expiresIn };
  return jwt.sign(payload, JWT_SECRET_KEY, options);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET_KEY) as JwtPayload;
}

