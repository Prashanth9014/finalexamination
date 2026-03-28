"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUser = registerUser;
exports.verifyOtp = verifyOtp;
exports.loginUser = loginUser;
const User_1 = require("../models/User");
const password_1 = require("../utils/password");
const jwt_1 = require("../utils/jwt");
async function registerUser(input) {
    const { name, email, password, role = 'candidate', department, preferredLanguage } = input;
    console.log('[AUTH-SERVICE] Register input:', { name, email, role, department, preferredLanguage });
    const existing = await User_1.User.findOne({ email: email.toLowerCase() }).exec();
    if (existing) {
        throw new Error('User with this email already exists');
    }
    const hashedPassword = await (0, password_1.hashPassword)(password);
    const userDoc = await User_1.User.create({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role,
        department,
        preferredLanguage,
    });
    console.log('[AUTH-SERVICE] User created:', { id: userDoc.id, email: userDoc.email, role: userDoc.role, department: userDoc.department, preferredLanguage: userDoc.preferredLanguage });
    const token = (0, jwt_1.signToken)({ userId: userDoc.id, role: userDoc.role });
    const response = {
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
async function verifyOtp(input) {
    const { email, otp } = input;
    const userDoc = await User_1.User.findOne({ email: email.toLowerCase() }).exec();
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
    const token = (0, jwt_1.signToken)({ userId: userDoc.id, role: userDoc.role });
    const response = {
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
async function loginUser(input) {
    const { email, password } = input;
    const userDoc = await User_1.User.findOne({ email: email.toLowerCase() }).exec();
    if (!userDoc) {
        throw new Error('Invalid email or password');
    }
    const isMatch = await (0, password_1.comparePassword)(password, userDoc.password);
    if (!isMatch) {
        throw new Error('Invalid email or password');
    }
    // STEP 1: LOGIN-LEVEL ATTEMPT RESTRICTION FOR CANDIDATES
    // Check if candidate has already submitted an exam (only for candidates)
    if (userDoc.role === 'candidate' && userDoc.canReattempt !== true) {
        const { Submission } = await Promise.resolve().then(() => __importStar(require('../models/Submission')));
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
            const { sendOtpEmail } = await Promise.resolve().then(() => __importStar(require('./mail.service')));
            await sendOtpEmail({
                email: userDoc.email,
                otp,
                userName: userDoc.name,
            });
        }
        catch (emailError) {
            console.error('[AUTH] Failed to send OTP email:', emailError);
            throw new Error('Failed to send OTP. Please try again.');
        }
        return {
            requiresOtp: true,
            message: 'OTP sent to your email. Please verify to continue.',
        };
    }
    // For admin and candidate - continue with normal flow
    const token = (0, jwt_1.signToken)({ userId: userDoc.id, role: userDoc.role });
    // Explicitly include department and preferredLanguage fields, even if undefined
    const response = {
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
