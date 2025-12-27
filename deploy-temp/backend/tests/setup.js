const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Clear all collections after each test to ensure isolated test state.
// Some suites that require shared state should recreate fixtures within
// their own test file. This prevents duplicate-key and cross-suite
// interference (E11000) seen in CI.
// Clear collections when the active test file (suite) changes. This keeps
// state persistent across tests inside the same file while isolating
// different test files to prevent cross-suite interference.
const path = require('path');
let _lastTestPath = null;

// Clear DB at the start of each test file (suite) for non-model suites so
// test setup in `beforeAll` isn't affected by a subsequent `beforeEach`.
beforeAll(async () => {
  const state = expect.getState();
  const currentTestPath = state.testPath || null;
  const isModel = currentTestPath && currentTestPath.includes(`${path.sep}tests${path.sep}models`);

  if (!isModel && _lastTestPath !== currentTestPath) {
    const collections = Object.keys(mongoose.connection.collections);
    for (const collectionName of collections) {
      const collection = mongoose.connection.collections[collectionName];
      try {
        await collection.deleteMany({});
      } catch (err) {
        // ignore transient errors
      }
    }
  }
  _lastTestPath = currentTestPath;
});

// For model/unit tests, clear before each test for strict isolation
beforeEach(async () => {
  const state = expect.getState();
  const currentTestPath = state.testPath || null;
  const isModel = currentTestPath && currentTestPath.includes(`${path.sep}tests${path.sep}models`);
  if (isModel) {
    const collections = Object.keys(mongoose.connection.collections);
    for (const collectionName of collections) {
      const collection = mongoose.connection.collections[collectionName];
      try {
        await collection.deleteMany({});
      } catch (err) {
        // ignore
      }
    }
  }
});

// Mock console methods in tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};