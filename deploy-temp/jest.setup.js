// Global Jest setup for repository-level tests (CommonJS compatible)
try {
  require('@testing-library/jest-dom');
} catch (e) {
  // optional: @testing-library/jest-dom not installed at repo root (it's usually in client/)
}

// Mock window.matchMedia for tests (JSDOM doesn't implement it)
if (typeof global.window !== 'undefined' && typeof global.window.matchMedia === 'undefined') {
  global.window.matchMedia = function (query) {
    return {
      matches: false,
      media: query,
      onchange: null,
      addListener: function () {},
      removeListener: function () {},
      addEventListener: function () {},
      removeEventListener: function () {},
      dispatchEvent: function () { return false; },
    };
  };
}

// Polyfill TextEncoder/TextDecoder for Node environments when needed
if (typeof global.TextEncoder === 'undefined' || typeof global.TextDecoder === 'undefined') {
  try {
    const { TextEncoder, TextDecoder } = require('util');
    global.TextEncoder = global.TextEncoder || TextEncoder;
    global.TextDecoder = global.TextDecoder || TextDecoder;
  } catch (err) {
    // If util isn't available, ignore — tests that need these APIs will fail.
  }
}

// Polyfill fetch for tests (node/jsdom may not provide it)
try {
  if (typeof global.fetch === 'undefined') {
    global.fetch = require('cross-fetch');
  }
} catch (e) {
  // cross-fetch not installed at repo root — client/tests may use their own polyfills
}

// Polyfill setImmediate for packages that expect it (e.g., nodemailer in tests)
if (typeof global.setImmediate === 'undefined') {
  global.setImmediate = function (fn, ...args) {
    return setTimeout(fn, 0, ...args);
  };
}

// If some tests rely on ResizeObserver or other browser APIs, you can add minimal mocks here as well.