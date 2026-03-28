import mongoose, { Schema, Document, Model } from 'mongoose';

export type UserRole = 'superadmin' | 'admin' | 'candidate';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department?: string; // For candidates: CSE, ECE, EEE, MECH, CIVIL, MBA (kept for backward compatibility)
  preferredLanguage?: string; // For candidates: Python, Java, C, C++
  canReattempt?: boolean; // For candidates taking exams multiple times
  resetToken?: string;
  resetTokenExpiry?: Date;
  otp?: string; // For superadmin OTP verification
  otpExpiry?: Date; // OTP expiration time
  createdAt: Date;
}

const UserSchema: Schema<IUser> = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['superadmin', 'admin', 'candidate'],
      default: 'candidate',
      required: true,
    },
    department: {
      type: String,
      enum: ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'MBA'],
      default: undefined,
    },
    preferredLanguage: {
      type: String,
      enum: ['Python', 'Java', 'C', 'C++'],
      default: undefined,
    },
    resetToken: {
      type: String,
      default: undefined,
    },
    resetTokenExpiry: {
      type: Date,
      default: undefined,
    },
    canReattempt: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      default: undefined,
    },
    otpExpiry: {
      type: Date,
      default: undefined,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  },
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

