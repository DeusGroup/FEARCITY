/**
 * Core Rate Limiting Tests v0.1.6
 * Comprehensive test suite for rate limiting functionality
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { 
  RateLimiter, 
  MemoryRateLimitStore, 
  RateLimitInfo,
  createRateLimiter 
} from '../../lib/rate-limit/core';
import { rateLimitConfig } from '../../lib/rate-limit/config';

// Mock timers for testing
jest.useFakeTimers();

describe('MemoryRateLimitStore', () => {
  let store: MemoryRateLimitStore;

  beforeEach(() => {
    store = new MemoryRateLimitStore();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('should store and retrieve rate limit info', async () => {
    const info: RateLimitInfo = {
      key: 'test-key',
      requests: 5,
      windowStart: Date.now(),
      blocked: false,
      violations: 0,
    };

    await store.set('test-key', info, 60000);
    const retrieved = await store.get('test-key');

    expect(retrieved).toEqual(info);
  });

  it('should return null for non-existent keys', async () => {
    const retrieved = await store.get('non-existent-key');
    expect(retrieved).toBeNull();
  });

  it('should increment request count', async () => {
    const count1 = await store.increment('test-key', 60000, 60000);
    expect(count1).toBe(1);

    const count2 = await store.increment('test-key', 60000, 60000);
    expect(count2).toBe(2);
  });

  it('should auto-expire entries', async () => {
    const info: RateLimitInfo = {
      key: 'test-key',
      requests: 1,
      windowStart: Date.now(),
      blocked: false,
      violations: 0,
    };

    await store.set('test-key', info, 1000); // 1 second TTL
    
    // Entry should exist immediately
    let retrieved = await store.get('test-key');
    expect(retrieved).toEqual(info);

    // Fast-forward time
    jest.advanceTimersByTime(1500);

    // Entry should be expired
    retrieved = await store.get('test-key');
    expect(retrieved).toBeNull();
  });

  it('should delete entries', async () => {
    const info: RateLimitInfo = {
      key: 'test-key',
      requests: 1,
      windowStart: Date.now(),
      blocked: false,
      violations: 0,
    };

    await store.set('test-key', info, 60000);
    await store.delete('test-key');

    const retrieved = await store.get('test-key');
    expect(retrieved).toBeNull();
  });
});

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;
  let store: MemoryRateLimitStore;

  beforeEach(() => {
    store = new MemoryRateLimitStore();
    rateLimiter = new RateLimiter(store);
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('should allow requests within rate limit', async () => {
    const rule = {
      name: 'test-rule',
      windows: [
        { interval: 60000, limit: 10 }, // 10 requests per minute
      ],
    };

    const result = await rateLimiter.checkLimit('test-user', rule);

    expect(result.success).toBe(true);
    expect(result.limit).toBe(10);
    expect(result.remaining).toBe(9);
  });

  it('should block requests when rate limit exceeded', async () => {
    const rule = {
      name: 'test-rule',
      windows: [
        { interval: 60000, limit: 2 }, // 2 requests per minute
      ],
    };

    // First request should succeed
    let result = await rateLimiter.checkLimit('test-user', rule);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(1);

    // Second request should succeed
    result = await rateLimiter.checkLimit('test-user', rule);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(0);

    // Third request should be blocked
    result = await rateLimiter.checkLimit('test-user', rule);
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it('should handle multiple time windows', async () => {
    const rule = {
      name: 'test-rule',
      windows: [
        { interval: 1000, limit: 2 },   // 2 per second
        { interval: 60000, limit: 10 }, // 10 per minute
      ],
    };

    // Should be limited by the stricter per-second limit
    let result = await rateLimiter.checkLimit('test-user', rule);
    expect(result.success).toBe(true);

    result = await rateLimiter.checkLimit('test-user', rule);
    expect(result.success).toBe(true);

    result = await rateLimiter.checkLimit('test-user', rule);
    expect(result.success).toBe(false);
  });

  it('should apply exponential backoff for repeat violations', async () => {
    // Enable exponential backoff in config
    const originalConfig = rateLimitConfig.security.exponentialBackoff.enabled;
    rateLimitConfig.security.exponentialBackoff.enabled = true;

    const rule = {
      name: 'test-rule',
      windows: [
        { interval: 60000, limit: 1 },
      ],
    };

    try {
      // Generate multiple violations
      for (let i = 0; i < 5; i++) {
        await rateLimiter.checkLimit('test-user', rule);
      }

      // Check if user is now blocked
      const stats = await rateLimiter.getStats('test-user');
      expect(stats.violations).toBeGreaterThan(0);

      // Further requests should be blocked
      const result = await rateLimiter.checkLimit('test-user', rule);
      expect(result.success).toBe(false);
      expect(result.blocked).toBe(true);

    } finally {
      rateLimitConfig.security.exponentialBackoff.enabled = originalConfig;
    }
  });

  it('should clear violations', async () => {
    const rule = {
      name: 'test-rule',
      windows: [
        { interval: 60000, limit: 1 },
      ],
    };

    // Generate violations
    await rateLimiter.checkLimit('test-user', rule);
    await rateLimiter.checkLimit('test-user', rule); // This will violate

    let stats = await rateLimiter.getStats('test-user');
    expect(stats.violations).toBeGreaterThan(0);

    // Clear violations
    await rateLimiter.clearViolations('test-user');

    stats = await rateLimiter.getStats('test-user');
    expect(stats.violations).toBe(0);
  });

  it('should handle concurrent requests correctly', async () => {
    const rule = {
      name: 'test-rule',
      windows: [
        { interval: 60000, limit: 5 },
      ],
    };

    // Make 10 concurrent requests
    const promises = Array(10).fill(0).map(() => 
      rateLimiter.checkLimit('test-user', rule)
    );

    const results = await Promise.all(promises);

    // Should have exactly 5 successful requests
    const successfulRequests = results.filter(r => r.success).length;
    const blockedRequests = results.filter(r => !r.success).length;

    expect(successfulRequests).toBe(5);
    expect(blockedRequests).toBe(5);
  });

  it('should reset limits after time window expires', async () => {
    const rule = {
      name: 'test-rule',
      windows: [
        { interval: 1000, limit: 1 }, // 1 request per second
      ],
    };

    // First request should succeed
    let result = await rateLimiter.checkLimit('test-user', rule);
    expect(result.success).toBe(true);

    // Second request should be blocked
    result = await rateLimiter.checkLimit('test-user', rule);
    expect(result.success).toBe(false);

    // Fast-forward time past window
    jest.advanceTimersByTime(1500);

    // Request should succeed again
    result = await rateLimiter.checkLimit('test-user', rule);
    expect(result.success).toBe(true);
  });

  it('should handle different user tiers', async () => {
    const rule = {
      name: 'test-rule',
      windows: [
        { interval: 60000, limit: 10 },
      ],
    };

    // Test free tier (should apply additional limits)
    const freeResult = await rateLimiter.checkLimit('free-user', rule, 'free');
    expect(freeResult.success).toBe(true);

    // Test premium tier
    const premiumResult = await rateLimiter.checkLimit('premium-user', rule, 'premium');
    expect(premiumResult.success).toBe(true);
    // Premium should have higher limits
    expect(premiumResult.limit).toBeGreaterThanOrEqual(freeResult.limit);
  });

  it('should fail gracefully on store errors', async () => {
    // Create a mock store that throws errors
    const errorStore = {
      get: jest.fn().mockRejectedValue(new Error('Store error')),
      set: jest.fn().mockRejectedValue(new Error('Store error')),
      increment: jest.fn().mockRejectedValue(new Error('Store error')),
      delete: jest.fn().mockRejectedValue(new Error('Store error')),
      cleanup: jest.fn().mockRejectedValue(new Error('Store error')),
    };

    const errorRateLimiter = new RateLimiter(errorStore as any);

    const rule = {
      name: 'test-rule',
      windows: [
        { interval: 60000, limit: 10 },
      ],
    };

    // Should fail open (allow request) when store fails
    const result = await errorRateLimiter.checkLimit('test-user', rule);
    expect(result.success).toBe(true);
  });
});

describe('createRateLimiter factory', () => {
  it('should create a rate limiter with memory store by default', () => {
    const rateLimiter = createRateLimiter();
    expect(rateLimiter).toBeInstanceOf(RateLimiter);
  });

  it('should create rate limiter with configured store type', () => {
    // Test with memory store (default)
    const originalStorageType = rateLimitConfig.storage.type;
    rateLimitConfig.storage.type = 'memory';

    try {
      const rateLimiter = createRateLimiter();
      expect(rateLimiter).toBeInstanceOf(RateLimiter);
    } finally {
      rateLimitConfig.storage.type = originalStorageType;
    }
  });
});

describe('Rate Limiting Configuration', () => {
  it('should validate time window intervals', () => {
    const rule = rateLimitConfig.endpoints['/api/auth/*'];
    expect(rule).toBeDefined();
    expect(rule.windows).toBeInstanceOf(Array);
    expect(rule.windows.length).toBeGreaterThan(0);
    
    rule.windows.forEach(window => {
      expect(window.interval).toBeGreaterThan(0);
      expect(window.limit).toBeGreaterThan(0);
    });
  });

  it('should have sensible default limits', () => {
    const defaultRule = rateLimitConfig.global.defaultRule;
    expect(defaultRule.windows[0].limit).toBeGreaterThan(0);
    expect(defaultRule.windows[0].interval).toBeGreaterThan(0);
  });

  it('should have stricter limits for sensitive endpoints', () => {
    const authRule = rateLimitConfig.endpoints['/api/auth/*'];
    const defaultRule = rateLimitConfig.global.defaultRule;
    
    // Auth endpoints should have stricter limits
    expect(authRule.windows[0].limit).toBeLessThan(defaultRule.windows[0].limit);
  });
});

// Performance tests
describe('Rate Limiter Performance', () => {
  let rateLimiter: RateLimiter;
  let store: MemoryRateLimitStore;

  beforeEach(() => {
    store = new MemoryRateLimitStore();
    rateLimiter = new RateLimiter(store);
  });

  it('should handle high throughput requests', async () => {
    const rule = {
      name: 'performance-test',
      windows: [
        { interval: 60000, limit: 1000 },
      ],
    };

    const startTime = Date.now();
    const numRequests = 100;

    // Make many requests
    const promises = Array(numRequests).fill(0).map((_, i) => 
      rateLimiter.checkLimit(`user-${i}`, rule)
    );

    await Promise.all(promises);
    
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Should complete within reasonable time (< 1 second for 100 requests)
    expect(duration).toBeLessThan(1000);
  }, 10000);

  it('should have low latency for individual requests', async () => {
    const rule = {
      name: 'latency-test',
      windows: [
        { interval: 60000, limit: 100 },
      ],
    };

    const startTime = Date.now();
    await rateLimiter.checkLimit('test-user', rule);
    const endTime = Date.now();

    const latency = endTime - startTime;

    // Should complete within 10ms
    expect(latency).toBeLessThan(10);
  });
});

// Integration tests
describe('Rate Limiter Integration', () => {
  it('should work with different identifier formats', async () => {
    const rateLimiter = createRateLimiter();
    const rule = {
      name: 'integration-test',
      windows: [
        { interval: 60000, limit: 10 },
      ],
    };

    const identifiers = [
      'ip:192.168.1.1',
      'user:12345',
      'api-key:abc123',
      'session:xyz789',
    ];

    for (const identifier of identifiers) {
      const result = await rateLimiter.checkLimit(identifier, rule);
      expect(result.success).toBe(true);
    }
  });

  it('should isolate limits between different identifiers', async () => {
    const rateLimiter = createRateLimiter();
    const rule = {
      name: 'isolation-test',
      windows: [
        { interval: 60000, limit: 1 },
      ],
    };

    // User 1 hits limit
    await rateLimiter.checkLimit('user-1', rule);
    const result1 = await rateLimiter.checkLimit('user-1', rule);
    expect(result1.success).toBe(false);

    // User 2 should still be able to make requests
    const result2 = await rateLimiter.checkLimit('user-2', rule);
    expect(result2.success).toBe(true);
  });
});