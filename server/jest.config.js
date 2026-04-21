module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  projects: [
    {
      // Unit tests configuration - NO DATABASE
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/unit/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/unit-setup.js'],
      testTimeout: 10000,
    },
    {
      // Integration tests configuration - WITH DATABASE
      displayName: 'integration', 
      testMatch: ['<rootDir>/tests/integration/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/integration-setup.js'],
      testTimeout: 30000,
    }
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(uuid)/)'
  ],
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true
    }
  },
  moduleNameMapper: {
    '^uuid$': '<rootDir>/tests/__mocks__/uuid.js'
  },
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.d.ts',
    '!src/server.ts',
    '!src/config/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};
