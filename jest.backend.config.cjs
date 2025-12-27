module.exports = {
  displayName: 'backend',
  testMatch: ['<rootDir>/backend/tests/**/*.test.js'],
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest.setup.backend-early.js'],
  setupFilesAfterEnv: ['<rootDir>/backend/tests/setup.js', '<rootDir>/jest.setup.backend.js'],
  moduleFileExtensions: ['js', 'json', 'node'],
  // Increase timeout for slower integration tests (DB/socket interactions)
  testTimeout: 20000,
  // Ensure that nodemailer is always mocked early by mapping the module
  moduleNameMapper: {
    '^nodemailer$': '<rootDir>/__mocks__/nodemailer.js'
  }
};
