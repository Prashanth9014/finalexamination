// Integration test setup - WITH DATABASE CONNECTION
const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB, clearTestDB } = require('./testDatabase');

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/exam_system_test';

// Global test setup for integration tests
beforeAll(async () => {
  await connectTestDB();
  // Clear database once at the start
  await clearTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

// Global error handler for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Increase timeout for integration tests
jest.setTimeout(60000);

console.log('Integration test setup loaded - using real database');