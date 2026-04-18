const { signToken, verifyToken } = require('../../../dist/utils/jwt');

describe('JWT Utils', () => {
  const mockPayload = {
    userId: '507f1f77bcf86cd799439011',
    role: 'candidate'
  };

  describe('signToken', () => {
    test('should create a valid JWT token', () => {
      const token = signToken(mockPayload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    test('should create token with custom expiration', () => {
      const token = signToken(mockPayload, '1h');
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });
  });

  describe('verifyToken', () => {
    test('should verify valid token', () => {
      const token = signToken(mockPayload);
      const decoded = verifyToken(token);
      
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.role).toBe(mockPayload.role);
    });

    test('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      
      expect(() => {
        verifyToken(invalidToken);
      }).toThrow();
    });

    test('should throw error for expired token', () => {
      const expiredToken = signToken(mockPayload, '0s');
      
      setTimeout(() => {
        expect(() => {
          verifyToken(expiredToken);
        }).toThrow();
      }, 1000);
    });
  });
});