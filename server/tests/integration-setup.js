// Integration test setup - WITH DATABASE CONNECTION
const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB, clearTestDB } = require('./testDatabase');

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only';
process.env.MONGODB_URI = 'mongodb://localhost:27017/exam_system_test';

// Global test setup for integration tests
beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

// Clear database before each test
beforeEach(async () => {
  await clearTestDB();
});

// Global error handler for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Increase timeout for integration tests
jest.setTimeout(30000);

console.log('Integration test setup loaded - using real database');