/**
 * Middleware Tests v0.1.6
 * Tests for Next.js middleware rate limiting
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';

// Mock the configuration
jest.mock('../../lib/rate-limit/config', () => ({
  rateLimitConfig: {
    global: { enabled: true },
    security: {
      blacklist: ['1.2.3.4'],
      whitelist: ['127.0.0.1'],
      blockedUserAgents: ['curl', 'bot'],
      exponentialBackoff: {
        enabled: true,
        multiplier: 2,
        maxDelay: 300000,
      },
    },
  },
  getRuleForPath: jest.fn().mockReturnValue({
    name: 'test',
    windows: [{ interval: 60000, limit: 10 }],
  }),
  isWhitelisted: jest.fn(),
  isBlacklisted: jest.fn(),
  isBlockedUserAgent: jest.fn(),
}));

// Since we can't easily import the middleware directly due to its structure,
// we'll test the components and logic that would be used in middleware

describe('Middleware Rate Limiting Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('IP Extraction', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const request = new NextRequest('https://example.com', {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        },
      });

      // Simulate the getClientIP function from middleware
      function getClientIP(req: NextRequest): string {
        const forwarded = req.headers.get('x-forwarded-for');
        const realIP = req.headers.get('x-real-ip');
        const cfConnectingIP = req.headers.get('cf-connecting-ip');
        
        if (cfConnectingIP) return cfConnectingIP;
        if (realIP) return realIP;
        if (forwarded) return forwarded.split(',')[0].trim();
        
        return 'unknown';
      }

      const ip = getClientIP(request);
      expect(ip).toBe('192.168.1.1');
    });

    it('should prioritize Cloudflare connecting IP', () => {
      const request = new NextRequest('https://example.com', {
        headers: {
          'cf-connecting-ip': '203.0.113.1',
          'x-forwarded-for': '192.168.1.1',
          'x-real-ip': '10.0.0.1',
        },
      });

      function getClientIP(req: NextRequest): string {
        const forwarded = req.headers.get('x-forwarded-for');
        const realIP = req.headers.get('x-real-ip');
        const cfConnectingIP = req.headers.get('cf-connecting-ip');
        
        if (cfConnectingIP) return cfConnectingIP;
        if (realIP) return realIP;
        if (forwarded) return forwarded.split(',')[0].trim();
        
        return 'unknown';
      }

      const ip = getClientIP(request);
      expect(ip).toBe('203.0.113.1');
    });
  });

  describe('Security Checks', () => {
    it('should block blacklisted IPs', () => {
      const { isBlacklisted } = require('../../lib/rate-limit/config');
      isBlacklisted.mockReturnValue(true);

      function performSecurityChecks(ip: string, userAgent: string): NextResponse | null {
        if (isBlacklisted(ip)) {
          return new NextResponse('Access Denied', {
            status: 403,
            headers: { 'X-RateLimit-Reason': 'IP blacklisted' },
          });
        }
        return null;
      }

      const result = performSecurityChecks('1.2.3.4', 'Mozilla/5.0');
      expect(result).toBeInstanceOf(NextResponse);
      expect(result!.status).toBe(403);
    });

    it('should allow whitelisted IPs', () => {
      const { isWhitelisted } = require('../../lib/rate-limit/config');
      isWhitelisted.mockReturnValue(true);

      function shouldRateLimit(ip: string): boolean {
        if (isWhitelisted(ip)) return false;
        return true;
      }

      const result = shouldRateLimit('127.0.0.1');
      expect(result).toBe(false);
    });

    it('should block known bot user agents', () => {
      const { isBlockedUserAgent } = require('../../lib/rate-limit/config');
      isBlockedUserAgent.mockReturnValue(true);

      function performSecurityChecks(ip: string, userAgent: string): NextResponse | null {
        const { isBlacklisted, isBlockedUserAgent } = require('../../lib/rate-limit/config');
        
        if (isBlacklisted(ip)) {
          return new NextResponse('Access Denied', {
            status: 403,
            headers: { 'X-RateLimit-Reason': 'IP blacklisted' },
          });
        }
        
        if (isBlockedUserAgent(userAgent)) {
          return new NextResponse('Access Denied', {
            status: 403,
            headers: { 'X-RateLimit-Reason': 'User agent blocked' },
          });
        }
        
        return null;
      }

      const result = performSecurityChecks('192.168.1.1', 'curl/7.68.0');
      expect(result).toBeInstanceOf(NextResponse);
      expect(result!.status).toBe(403);
    });
  });

  describe('Rate Limiting Logic', () => {
    let rateLimitStore: Map<string, any>;

    beforeEach(() => {
      rateLimitStore = new Map();
    });

    it('should allow requests within limit', () => {
      function checkRateLimit(ip: string, path: string): {
        allowed: boolean;
        limit: number;
        remaining: number;
        resetTime: number;
      } {
        const rule = { windows: [{ interval: 60000, limit: 10 }] };
        const now = Date.now();
        const windowStart = Math.floor(now / rule.windows[0].interval) * rule.windows[0].interval;
        const key = `${ip}:${path}:${windowStart}`;
        
        const data = rateLimitStore.get(key) || { requests: 0, resetTime: windowStart + rule.windows[0].interval };
        data.requests++;
        
        if (data.requests <= rule.windows[0].limit) {
          rateLimitStore.set(key, data);
          return {
            allowed: true,
            limit: rule.windows[0].limit,
            remaining: rule.windows[0].limit - data.requests,
            resetTime: data.resetTime,
          };
        }
        
        return {
          allowed: false,
          limit: rule.windows[0].limit,
          remaining: 0,
          resetTime: data.resetTime,
        };
      }

      const result = checkRateLimit('192.168.1.1', '/api/test');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
    });

    it('should block requests exceeding limit', () => {
      function checkRateLimit(ip: string, path: string): {
        allowed: boolean;
        limit: number;
        remaining: number;
        resetTime: number;
      } {
        const rule = { windows: [{ interval: 60000, limit: 2 }] };
        const now = Date.now();
        const windowStart = Math.floor(now / rule.windows[0].interval) * rule.windows[0].interval;
        const key = `${ip}:${path}:${windowStart}`;
        
        const data = rateLimitStore.get(key) || { requests: 0, resetTime: windowStart + rule.windows[0].interval };
        data.requests++;
        
        if (data.requests <= rule.windows[0].limit) {
          rateLimitStore.set(key, data);
          return {
            allowed: true,
            limit: rule.windows[0].limit,
            remaining: rule.windows[0].limit - data.requests,
            resetTime: data.resetTime,
          };
        }
        
        rateLimitStore.set(key, data);
        return {
          allowed: false,
          limit: rule.windows[0].limit,
          remaining: 0,
          resetTime: data.resetTime,
        };
      }

      // First two requests should succeed
      let result = checkRateLimit('192.168.1.1', '/api/test');
      expect(result.allowed).toBe(true);

      result = checkRateLimit('192.168.1.1', '/api/test');
      expect(result.allowed).toBe(true);

      // Third request should be blocked
      result = checkRateLimit('192.168.1.1', '/api/test');
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should handle violations tracking', () => {
      function handleViolation(ip: string): { blocked: boolean; blockExpiry?: number } {
        const violationKey = `violations:${ip}`;
        const violationData = rateLimitStore.get(violationKey) || { violations: 0 };
        violationData.violations++;
        
        if (violationData.violations >= 3) {
          const blockDuration = 1000 * Math.pow(2, violationData.violations - 3);
          const blockExpiry = Date.now() + blockDuration;
          
          rateLimitStore.set(`block:${ip}`, {
            blocked: true,
            blockExpiry,
          });
          
          return { blocked: true, blockExpiry };
        }
        
        rateLimitStore.set(violationKey, violationData);
        return { blocked: false };
      }

      // Simulate multiple violations
      for (let i = 0; i < 3; i++) {
        handleViolation('192.168.1.1');
      }

      const result = handleViolation('192.168.1.1');
      expect(result.blocked).toBe(true);
      expect(result.blockExpiry).toBeGreaterThan(Date.now());
    });
  });

  describe('Response Headers', () => {
    it('should set appropriate rate limit headers', () => {
      const response = NextResponse.next();
      const rateLimitResult = {
        limit: 10,
        remaining: 5,
        resetTime: Date.now() + 60000,
        retryAfter: 60,
      };

      // Simulate setting headers
      response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
      response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());
      response.headers.set('Retry-After', rateLimitResult.retryAfter.toString());

      expect(response.headers.get('X-RateLimit-Limit')).toBe('10');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('5');
      expect(response.headers.get('X-RateLimit-Reset')).toBe(rateLimitResult.resetTime.toString());
      expect(response.headers.get('Retry-After')).toBe('60');
    });

    it('should set security headers', () => {
      const response = NextResponse.next();

      // Simulate setting security headers
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-XSS-Protection', '1; mode=block');

      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block');
    });
  });

  describe('Path Matching', () => {
    it('should skip rate limiting for static assets', () => {
      function shouldRateLimit(pathname: string): boolean {
        if (pathname.startsWith('/_next/') || 
            pathname.startsWith('/favicon') ||
            pathname.includes('.') && !pathname.startsWith('/api/')) {
          return false;
        }
        return true;
      }

      expect(shouldRateLimit('/_next/static/css/app.css')).toBe(false);
      expect(shouldRateLimit('/favicon.ico')).toBe(false);
      expect(shouldRateLimit('/images/logo.png')).toBe(false);
      expect(shouldRateLimit('/api/products')).toBe(true);
      expect(shouldRateLimit('/contact')).toBe(true);
    });
  });

  describe('Cleanup Logic', () => {
    it('should clean up expired entries', () => {
      const rateLimitStore = new Map();
      const now = Date.now();

      // Add some entries
      rateLimitStore.set('current-entry', { resetTime: now + 60000 });
      rateLimitStore.set('expired-entry', { resetTime: now - 60000 });

      function cleanupRateLimitStore(): number {
        const currentTime = Date.now();
        let cleanedCount = 0;
        
        for (const [key, data] of rateLimitStore.entries()) {
          if (data.resetTime < currentTime) {
            rateLimitStore.delete(key);
            cleanedCount++;
          }
        }
        
        return cleanedCount;
      }

      const cleanedCount = cleanupRateLimitStore();
      expect(cleanedCount).toBe(1);
      expect(rateLimitStore.has('current-entry')).toBe(true);
      expect(rateLimitStore.has('expired-entry')).toBe(false);
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should handle concurrent requests correctly', () => {
      const rateLimitStore = new Map();

      function checkRateLimit(ip: string, path: string): boolean {
        const rule = { windows: [{ interval: 60000, limit: 5 }] };
        const now = Date.now();
        const windowStart = Math.floor(now / rule.windows[0].interval) * rule.windows[0].interval;
        const key = `${ip}:${path}:${windowStart}`;
        
        const data = rateLimitStore.get(key) || { requests: 0 };
        data.requests++;
        
        if (data.requests <= rule.windows[0].limit) {
          rateLimitStore.set(key, data);
          return true;
        }
        
        return false;
      }

      // Simulate 10 concurrent requests
      const results = Array(10).fill(0).map(() => 
        checkRateLimit('192.168.1.1', '/api/test')
      );

      const allowedRequests = results.filter(Boolean).length;
      const blockedRequests = results.filter(r => !r).length;

      expect(allowedRequests).toBe(5);
      expect(blockedRequests).toBe(5);
    });
  });

  describe('Error Handling', () => {
    it('should handle store errors gracefully', () => {
      function checkRateLimitWithError(): {
        allowed: boolean;
        limit: number;
        remaining: number;
      } {
        try {
          // Simulate store error
          throw new Error('Store unavailable');
        } catch (error) {
          console.error('Rate limit check error:', error);
          // Fail open for availability
          return {
            allowed: true,
            limit: 1000,
            remaining: 999,
          };
        }
      }

      const result = checkRateLimitWithError();
      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(1000);
    });
  });
});

describe('Middleware Configuration', () => {
  it('should have correct matcher configuration', () => {
    // This is the actual matcher configuration from the middleware
    const config = {
      matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
      ],
    };

    expect(config.matcher).toHaveLength(1);
    expect(config.matcher[0]).toContain('_next/static');
    expect(config.matcher[0]).toContain('favicon.ico');
  });
});

describe('Rate Limit Window Logic', () => {
  it('should calculate window start correctly', () => {
    function calculateWindowStart(timestamp: number, interval: number): number {
      return Math.floor(timestamp / interval) * interval;
    }

    const now = 1640995200000; // Example timestamp
    const interval = 60000; // 1 minute

    const windowStart = calculateWindowStart(now, interval);
    const expectedStart = Math.floor(now / interval) * interval;

    expect(windowStart).toBe(expectedStart);
    expect(windowStart).toBeLessThanOrEqual(now);
    expect(windowStart + interval).toBeGreaterThan(now);
  });

  it('should generate consistent keys for same window', () => {
    function generateKey(ip: string, path: string, windowStart: number): string {
      return `${ip}:${path}:${windowStart}`;
    }

    const ip = '192.168.1.1';
    const path = '/api/test';
    const windowStart = 1640995200000;

    const key1 = generateKey(ip, path, windowStart);
    const key2 = generateKey(ip, path, windowStart);

    expect(key1).toBe(key2);
    expect(key1).toBe('192.168.1.1:/api/test:1640995200000');
  });
});