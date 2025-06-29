/**
 * Test Setup Configuration v0.1.6
 * Global test setup for rate limiting test suite
 */

import { jest } from '@jest/globals';

// Mock Next.js environment
Object.defineProperty(global, 'window', {
  value: undefined,
  writable: true,
});

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.REDIS_URL = 'redis://localhost:6379';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock fetch for API tests
global.fetch = jest.fn();

// Mock timers
jest.useFakeTimers();

// Global test timeout
jest.setTimeout(10000);

// Setup global mocks for Next.js
jest.mock('next/server', () => {
  const MockNextResponse = jest.fn().mockImplementation((body?: any, init?: any) => ({
    status: init?.status || 200,
    headers: new Map(Object.entries(init?.headers || {})),
    json: jest.fn().mockResolvedValue(body),
  }));

  MockNextResponse.json = jest.fn().mockImplementation((data: any, options?: any) => ({
    json: jest.fn().mockResolvedValue(data),
    status: options?.status || 200,
    headers: new Map(Object.entries(options?.headers || {})),
  }));

  MockNextResponse.next = jest.fn().mockImplementation((options?: any) => ({
    headers: new Map(Object.entries(options?.headers || {})),
  }));

  return {
    NextRequest: jest.fn().mockImplementation((url: string, init?: any) => ({
      url,
      method: init?.method || 'GET',
      headers: new Map(Object.entries(init?.headers || {})),
      nextUrl: new URL(url),
      ip: '127.0.0.1',
    })),
    NextResponse: MockNextResponse,
  };
});

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn().mockReturnValue({
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
        gte: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
      insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      upsert: jest.fn().mockResolvedValue({ data: null, error: null }),
    }),
    rpc: jest.fn().mockResolvedValue({ data: [], error: null }),
  }),
}));

// Mock Redis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    setex: jest.fn().mockResolvedValue('OK'),
    incr: jest.fn().mockResolvedValue(1),
    del: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
    pipeline: jest.fn().mockReturnValue({
      incr: jest.fn().mockReturnThis(),
      expire: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([[null, 1]]),
    }),
    eval: jest.fn().mockResolvedValue([1, 1, 9]),
    hgetall: jest.fn().mockResolvedValue({}),
    hmset: jest.fn().mockResolvedValue('OK'),
    ping: jest.fn().mockResolvedValue('PONG'),
    quit: jest.fn().mockResolvedValue('OK'),
    disconnect: jest.fn(),
    on: jest.fn(),
    status: 'ready',
  }));
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
});

// Clean up after all tests
afterAll(() => {
  jest.useRealTimers();
});