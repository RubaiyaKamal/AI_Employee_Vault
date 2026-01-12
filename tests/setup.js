/**
 * Jest Test Setup
 * Global setup and configuration for all tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.SMTP_HOST = 'smtp.test.com';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'test@example.com';
process.env.SMTP_PASS = 'test-password';
process.env.MCP_SERVER_PORT = '3001';
process.env.CIRCUIT_BREAKER_THRESHOLD = '5';
process.env.MAX_RETRY_ATTEMPTS = '3';

// Suppress console.log in tests (optional)
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  // Keep error and warn for debugging
  error: console.error,
  warn: console.warn,
};

// Global test timeout
jest.setTimeout(10000);

// Mock timers setup
beforeEach(() => {
  // Reset any mocked timers before each test
  jest.clearAllTimers();
});

afterEach(() => {
  // Cleanup after each test
  jest.clearAllMocks();
});

// Global cleanup
afterAll(() => {
  // Final cleanup
});
