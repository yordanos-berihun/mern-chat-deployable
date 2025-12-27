#!/usr/bin/env node
const { spawn } = require('child_process');
const { MongoMemoryServer } = require('mongodb-memory-server');

(async () => {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  // Provide both env vars that tests in this repo look for.
  process.env.MONGODB_URI = uri;
  process.env.MONGODB_URI_TEST = uri;

  const args = process.argv.slice(2);
  // Run jest in this same project
  const jestProc = spawn('npx', ['jest', '--runInBand', ...args], { stdio: 'inherit', env: process.env, shell: true });

  jestProc.on('exit', async (code) => {
    try {
      await mongod.stop();
    } catch (e) {}
    process.exit(code);
  });
})();
