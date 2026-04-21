const { authenticate } = require('../../../dist/middlewares/auth.middleware');
const { signToken } = require('../../../dist/utils/jwt');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      user: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  describe('authenticateToken', () => {
    test('should authenticate valid token', () => {
      const mockPayload = { userId: '507f1f77bcf86cd799439011', role: 'candidate' };
      const token = signToken(mockPayload);
      req.headers.authorization = `Bearer ${token}`;

      authenticate(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.userId).toBe(mockPayload.userId);
      expect(next).toHaveBeenCalled();
    });

    test('should reject request without token', () => {
      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Authorization header missing or invalid'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject invalid token', () => {
      req.headers.authorization = 'Bearer invalid-token';

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid or expired token'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject malformed authorization header', () => {
      req.headers.authorization = 'InvalidFormat';

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });
});