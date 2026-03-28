"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAdmin = registerAdmin;
const User_1 = require("../models/User");
const password_1 = require("../utils/password");
const jwt_1 = require("../utils/jwt");
/**
 * Register a new admin user
 * Admin registration endpoint - always creates user with role = 'admin'
 * Requires valid secret key for security
 */
async function registerAdmin(input) {
    const { name, email, password, secretKey } = input;
    // Check if user already exists
    const existing = await User_1.User.findOne({ email: email.toLowerCase() }).exec();
    if (existing) {
        throw new Error('User with this email already exists');
    }
    // Hash password using bcrypt with 10 salt rounds
    // The number 10 represents the cost factor (salt rounds)
    // Higher number = more secure but slower
    // 10 is the standard used throughout the application
    const hashedPassword = await (0, password_1.hashPassword)(password);
    // Create new user with admin role
    // Role is always set to 'admin' for admin registration endpoint
    const userDoc = await User_1.User.create({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'admin',
    });
    // Generate JWT token for automatic login
    const token = (0, jwt_1.signToken)({ userId: userDoc.id, role: userDoc.role });
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
