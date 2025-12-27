// Early backend setup: runs before test framework and before modules are required.
// Mock nodemailer at module load time so routes that require it don't attempt real SMTP.
try {
  jest.mock('nodemailer', () => ({
    createTransport: () => ({
      sendMail: jest.fn().mockResolvedValue({})
    })
  }));
} catch (e) {
  // If jest isn't available in this context, try providing a minimal noop module fallback
  try {
    require('fs').writeFileSync('./.nodemailer-mock', '');
  } catch (err) {}
}

// Provide fetch via cross-fetch for server-side tests
try {
  if (typeof global.fetch === 'undefined') {
    global.fetch = require('cross-fetch');
  }
} catch (e) {}

// Ensure mongoose is reachable before tests that require models are loaded.
// We run a short synchronous helper process to connect and exit once connected.
try {
  const uri = process.env.MONGODB_URI_TEST || process.env.MONGODB_URI;
  if (uri) {
    const { execSync } = require('child_process');
    // Run a node one-liner that connects mongoose and exits when connected.
    execSync(
      `node -e "(async ()=>{const mongoose=require('mongoose');try{await mongoose.connect('${uri}');console.log('mongoose-sync-connected');await mongoose.disconnect();process.exit(0);}catch(e){console.error(e);process.exit(1);}})()"`,
      { stdio: 'ignore' }
    );
  }
} catch (e) {
  // ignore failures here; tests will surface connection errors
}
