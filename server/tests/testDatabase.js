const mongoose = require('mongoose');

// Test database configuration
const TEST_DB_URL = 'mongodb://localhost:27017/exam_system_test';

// Connect to test database
async function connectTestDB() {
  try {
    await mongoose.connect(TEST_DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to test database');
  } catch (error) {
    console.error('Test database connection error:', error);
    throw error;
  }
}

// Disconnect from test database
async function disconnectTestDB() {
  try {
    await mongoose.connection.close();
    console.log('Disconnected from test database');
  } catch (error) {
    console.error('Test database disconnection error:', error);
  }
}

// Clear all collections in test database
async function clearTestDB() {
  try {
    const collections = mongoose.connection.collections;
    
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
    console.log('Test database cleared');
  } catch (error) {
    console.error('Error clearing test database:', error);
    throw error;
  }
}

module.exports = {
  connectTestDB,
  disconnectTestDB,
  clearTestDB,
  TEST_DB_URL
};