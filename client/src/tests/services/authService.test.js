import { describe, test, expect, beforeEach, vi } from 'vitest';
import authService from '../services/authService';
import api from '../services/api';

// Mock the api module
vi.mock('../services/api');

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('login', () => {
    test('should login successfully and store token', async () => {
      const mockResponse = {
        data: {
          token: 'mock-jwt-token',
          user: {
            id: '1',
            email: 'test@example.com',
            role: 'candidate'
          }
        }
      };

      api.post.mockResolvedValue(mockResponse);

      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      const result = await authService.login(credentials);

      expect(api.post).toHaveBeenCalledWith('/auth/login', credentials);
      expect(localStorage.getItem('token')).toBe('mock-jwt-token');
      expect(localStorage.getItem('user')).toBe(JSON.stringify(mockResponse.data.user));
      expect(result).toEqual(mockResponse.data);
    });

    test('should throw error on failed login', async () => {
      const mockError = {
        response: {
          data: {
            message: 'Invalid credentials'
          }
        }
      };

      api.post.mockRejectedValue(mockError);

      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      await expect(authService.login(credentials)).rejects.toThrow('Invalid credentials');
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('register', () => {
    test('should register successfully', async () => {
      const mockResponse = {
        data: {
          message: 'User registered successfully',
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User'
          }
        }
      };

      api.post.mockResolvedValue(mockResponse);

      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'candidate'
      };

      const result = await authService.register(userData);

      expect(api.post).toHaveBeenCalledWith('/auth/register', userData);
      expect(result).toEqual(mockResponse.data);
    });

    test('should throw error on registration failure', async () => {
      const mockError = {
        response: {
          data: {
            message: 'User already exists'
          }
        }
      };

      api.post.mockRejectedValue(mockError);

      const userData = {
        name: 'Test User',
        email: 'existing@example.com',
        password: 'password123',
        role: 'candidate'
      };

      await expect(authService.register(userData)).rejects.toThrow('User already exists');
    });
  });

  describe('logout', () => {
    test('should clear localStorage on logout', () => {
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('user', JSON.stringify({ id: '1' }));

      authService.logout();

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    test('should return current user from localStorage', () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      localStorage.setItem('user', JSON.stringify(mockUser));

      const result = authService.getCurrentUser();

      expect(result).toEqual(mockUser);
    });

    test('should return null if no user in localStorage', () => {
      const result = authService.getCurrentUser();

      expect(result).toBeNull();
    });
  });

  describe('getToken', () => {
    test('should return token from localStorage', () => {
      const mockToken = 'mock-jwt-token';
      localStorage.setItem('token', mockToken);

      const result = authService.getToken();

      expect(result).toBe(mockToken);
    });

    test('should return null if no token in localStorage', () => {
      const result = authService.getToken();

      expect(result).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    test('should return true if token exists', () => {
      localStorage.setItem('token', 'mock-token');

      const result = authService.isAuthenticated();

      expect(result).toBe(true);
    });

    test('should return false if no token exists', () => {
      const result = authService.isAuthenticated();

      expect(result).toBe(false);
    });
  });
});