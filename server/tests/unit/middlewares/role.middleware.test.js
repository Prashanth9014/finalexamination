const { requireRole } = require('../../../dist/middlewares/role.middleware');

describe('Role Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  describe('requireRole', () => {
    test('should allow access for correct role', () => {
      req.user = { userId: '507f1f77bcf86cd799439011', role: 'admin' };
      const middleware = requireRole('admin');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should deny access for incorrect role', () => {
      req.user = { userId: '507f1f77bcf86cd799439011', role: 'candidate' };
      const middleware = requireRole('admin');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Access denied. Insufficient permissions.' 
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should allow access for multiple roles', () => {
      req.user = { userId: '507f1f77bcf86cd799439011', role: 'candidate' };
      const middleware = requireRole(['admin', 'candidate']);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should deny access when user is not authenticated', () => {
      req.user = null;
      const middleware = requireRole('admin');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Authentication required' 
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});