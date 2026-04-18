const { validateAdminSecretKey } = require('../../../dist/utils/adminValidation');

describe('Admin Validation Utils', () => {
  const originalEnv = process.env.ADMIN_SECRET_KEY;

  beforeAll(() => {
    process.env.ADMIN_SECRET_KEY = 'test-secret-key';
  });

  afterAll(() => {
    process.env.ADMIN_SECRET_KEY = originalEnv;
  });

  describe('validateAdminSecretKey', () => {
    test('should return true for correct secret key', () => {
      const result = validateAdminSecretKey('test-secret-key');
      expect(result).toBe(true);
    });

    test('should return false for incorrect secret key', () => {
      const result = validateAdminSecretKey('wrong-secret-key');
      expect(result).toBe(false);
    });

    test('should return false for empty secret key', () => {
      const result = validateAdminSecretKey('');
      expect(result).toBe(false);
    });

    test('should return false for null secret key', () => {
      const result = validateAdminSecretKey(null);
      expect(result).toBe(false);
    });

    test('should handle whitespace in secret key', () => {
      const result = validateAdminSecretKey('  test-secret-key  ');
      expect(result).toBe(true);
    });
  });
});