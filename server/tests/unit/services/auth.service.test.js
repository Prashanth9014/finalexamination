// Mock User model FIRST - before any imports
jest.mock('../../../dist/models/User', () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn()
  }
}));

// Mock Submission model to prevent database connections
jest.mock('../../../dist/models/Submission', () => ({
  Submission: {
    findOne: jest.fn()
  }
}));

// Mock password utilities FIRST - before any imports
jest.mock('../../../dist/utils/password', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashedPassword123'),
  comparePassword: jest.fn()
}));

// Mock JWT utilities FIRST - before any imports
jest.mock('../../../dist/utils/jwt', () => ({
  signToken: jest.fn().mockReturnValue('mock-jwt-token-123')
}));

// Mock mail service to prevent email sending during tests
jest.mock('../../../dist/services/mail.service', () => ({
  sendOtpEmail: jest.fn().mockResolvedValue(true)
}));

// NOW import everything after mocking
const { registerUser, loginUser, verifyOtp } = require('../../../dist/services/auth.service');
const { User } = require('../../../dist/models/User');
const { Submission } = require('../../../dist/models/Submission');
const { comparePassword } = require('../../../dist/utils/password');
const { signToken } = require('../../../dist/utils/jwt');

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Re-setup the signToken mock after clearing
    const { signToken } = require('../../../dist/utils/jwt');
    signToken.mockReturnValue('mock-jwt-token-123');
  });

  describe('registerUser', () => {
    test('should register new user successfully', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'candidate'
      };

      // Mock User.findOne to return null (user doesn't exist)
      User.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      // Mock User.create to return new user
      User.create.mockResolvedValue({
        id: '507f1f77bcf86cd799439011',
        name: userData.name,
        email: userData.email.toLowerCase(),
        password: 'hashedPassword123',
        role: userData.role,
        createdAt: new Date()
      });

      const result = await registerUser(userData);

      expect(User.findOne).toHaveBeenCalledWith({ email: userData.email.toLowerCase() });
      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(userData.email);
      expect(result.token).toBe('mock-jwt-token-123');
    });

    test('should throw error if user already exists', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'candidate'
      };

      // Mock User.findOne to return existing user
      User.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ email: userData.email })
      });

      await expect(registerUser(userData)).rejects.toThrow('User with this email already exists');
    });
  });

  describe('loginUser', () => {
    test('should login candidate with correct credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        id: '507f1f77bcf86cd799439011',
        name: 'Test User',
        email: loginData.email,
        password: 'hashedPassword123',
        role: 'candidate',
        createdAt: new Date()
      };

      // Mock User.findOne to return user
      User.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser)
      });

      // Mock Submission.findOne to return null (no submitted exam)
      Submission.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      // Mock comparePassword to return true
      comparePassword.mockResolvedValue(true);

      const result = await loginUser(loginData);

      expect(User.findOne).toHaveBeenCalledWith({ email: loginData.email.toLowerCase() });
      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.token).toBe('mock-jwt-token-123');
    });

    test('should require OTP for superadmin login', async () => {
      const loginData = {
        email: 'superadmin@example.com',
        password: 'password123'
      };

      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        id: '507f1f77bcf86cd799439011',
        name: 'Super Admin',
        email: loginData.email,
        password: 'hashedPassword123',
        role: 'superadmin',
        save: jest.fn().mockResolvedValue(true),
        createdAt: new Date()
      };

      // Mock User.findOne to return superadmin user
      User.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser)
      });

      // Mock comparePassword to return true
      comparePassword.mockResolvedValue(true);

      const result = await loginUser(loginData);

      expect(result).toBeDefined();
      expect(result.requiresOtp).toBe(true);
      expect(result.message).toContain('OTP sent to your email');
    });

    test('should throw error for invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      // Mock User.findOne to return null (user not found)
      User.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      await expect(loginUser(loginData)).rejects.toThrow('Invalid email or password');
    });

    test('should throw error for wrong password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const mockUser = {
        id: '507f1f77bcf86cd799439011',
        email: loginData.email,
        password: 'hashedPassword123',
        role: 'candidate'
      };

      // Mock User.findOne to return user
      User.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser)
      });

      // Mock comparePassword to return false (wrong password)
      comparePassword.mockResolvedValue(false);

      await expect(loginUser(loginData)).rejects.toThrow('Invalid email or password');
    });

    test('should block candidate who already submitted exam', async () => {
      const loginData = {
        email: 'candidate@example.com',
        password: 'password123'
      };

      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        id: '507f1f77bcf86cd799439011',
        name: 'Test Candidate',
        email: loginData.email,
        password: 'hashedPassword123',
        role: 'candidate',
        canReattempt: false,
        createdAt: new Date()
      };

      const mockSubmission = {
        _id: '507f1f77bcf86cd799439012',
        userId: mockUser._id,
        status: 'submitted'
      };

      // Mock User.findOne to return candidate
      User.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser)
      });

      // Mock Submission.findOne to return submitted exam
      Submission.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSubmission)
      });

      // Mock comparePassword to return true
      comparePassword.mockResolvedValue(true);

      await expect(loginUser(loginData)).rejects.toThrow('You have already attempted an exam');
    });
  });

  describe('verifyOtp', () => {
    test('should verify OTP successfully', async () => {
      const otpData = {
        email: 'superadmin@example.com',
        otp: '123456'
      };

      const mockUser = {
        id: '507f1f77bcf86cd799439011',
        name: 'Super Admin',
        email: otpData.email,
        role: 'superadmin',
        otp: '123456',
        otpExpiry: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
        save: jest.fn().mockResolvedValue(true),
        createdAt: new Date()
      };

      // Mock User.findOne to return user with OTP
      User.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser)
      });

      const result = await verifyOtp(otpData);

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.token).toBe('mock-jwt-token-123');
      expect(mockUser.save).toHaveBeenCalled();
    });

    test('should throw error for invalid OTP', async () => {
      const otpData = {
        email: 'superadmin@example.com',
        otp: '999999'
      };

      const mockUser = {
        id: '507f1f77bcf86cd799439011',
        email: otpData.email,
        otp: '123456', // Different OTP
        otpExpiry: new Date(Date.now() + 5 * 60 * 1000)
      };

      User.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser)
      });

      await expect(verifyOtp(otpData)).rejects.toThrow('Invalid OTP');
    });

    test('should throw error for expired OTP', async () => {
      const otpData = {
        email: 'superadmin@example.com',
        otp: '123456'
      };

      const mockUser = {
        id: '507f1f77bcf86cd799439011',
        email: otpData.email,
        otp: '123456',
        otpExpiry: new Date(Date.now() - 1000) // Expired 1 second ago
      };

      User.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser)
      });

      await expect(verifyOtp(otpData)).rejects.toThrow('OTP has expired');
    });
  });
});
