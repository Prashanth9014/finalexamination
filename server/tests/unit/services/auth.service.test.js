const authService = require('../../../dist/services/auth.service');
const User = require('../../../dist/models/User');

// Mock the User model
jest.mock('../../../dist/models/User');

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    test('should register new user successfully', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'candidate'
      };

      User.findOne.mockResolvedValue(null); // User doesn't exist
      User.prototype.save = jest.fn().mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        ...userData,
        password: 'hashedPassword'
      });

      const result = await authService.registerUser(userData);

      expect(User.findOne).toHaveBeenCalledWith({ email: userData.email });
      expect(result).toBeDefined();
      expect(result.email).toBe(userData.email);
    });

    test('should throw error if user already exists', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'candidate'
      };

      User.findOne.mockResolvedValue({ email: userData.email }); // User exists

      await expect(authService.registerUser(userData)).rejects.toThrow('User already exists');
    });
  });

  describe('loginUser', () => {
    test('should login user with correct credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: loginData.email,
        password: 'hashedPassword',
        role: 'candidate',
        comparePassword: jest.fn().mockResolvedValue(true)
      };

      User.findOne.mockResolvedValue(mockUser);

      const result = await authService.loginUser(loginData);

      expect(User.findOne).toHaveBeenCalledWith({ email: loginData.email });
      expect(mockUser.comparePassword).toHaveBeenCalledWith(loginData.password);
      expect(result).toBeDefined();
      expect(result.token).toBeDefined();
    });

    test('should throw error for invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      User.findOne.mockResolvedValue(null); // User not found

      await expect(authService.loginUser(loginData)).rejects.toThrow('Invalid credentials');
    });
  });
});