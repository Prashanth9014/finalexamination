// Mock UUID module for Jest tests
module.exports = {
  v4: jest.fn(() => 'mock-uuid-v4-12345'),
  v1: jest.fn(() => 'mock-uuid-v1-12345'),
  v3: jest.fn(() => 'mock-uuid-v3-12345'),
  v5: jest.fn(() => 'mock-uuid-v5-12345'),
  validate: jest.fn(() => true),
  version: jest.fn(() => 4),
  NIL: '00000000-0000-0000-0000-000000000000'
};