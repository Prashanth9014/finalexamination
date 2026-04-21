// Unit test setup - NO DATABASE CONNECTION
// Unit tests should use mocks only

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only';

// Global error handler for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Set timeout for unit tests (shorter than integration tests)
jest.setTimeout(10000);

console.log('Unit test setup loaded - using mocks only');