/**
 * Core Rate Limiting Engine v0.1.6
 * Sliding window and token bucket implementations for Fear City Cycles
 */

import { rateLimitConfig, RateLimitRule, RateLimitWindow } from './config';

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  blocked?: boolean;
  reason?: string;
}

export interface RateLimitInfo {
  key: string;
  requests: number;
  windowStart: number;
  blocked: boolean;
  blockExpiry?: number;
  violations: number;
}

export abstract class RateLimitStore {
  abstract get(key: string): Promise<RateLimitInfo | null>;
  abstract set(key: string, info: RateLimitInfo, ttl: number): Promise<void>;
  abstract increment(key: string, window: number, ttl: number): Promise<number>;
  abstract delete(key: string): Promise<void>;
  abstract cleanup(): Promise<void>;
}

// In-memory store for development and small applications
export class MemoryRateLimitStore extends RateLimitStore {
  private store = new Map<string, RateLimitInfo>();
  private timers = new Map<string, NodeJS.Timeout>();

  async get(key: string): Promise<RateLimitInfo | null> {
    return this.store.get(key) || null;
  }

  async set(key: string, info: RateLimitInfo, ttl: number): Promise<void> {
    this.store.set(key, info);
    
    // Clear existing timer
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key)!);
    }
    
    // Set expiration timer
    const timer = setTimeout(() => {
      this.store.delete(key);
      this.timers.delete(key);
    }, ttl);
    
    this.timers.set(key, timer);
  }

  async increment(key: string, window: number, ttl: number): Promise<number> {
    const now = Date.now();
    const windowKey = `${key}:${Math.floor(now / window)}`;
    
    const current = this.store.get(windowKey);
    const newCount = (current?.requests || 0) + 1;
    
    await this.set(windowKey, {
      key: windowKey,
      requests: newCount,
      windowStart: Math.floor(now / window) * window,
      blocked: false,
      violations: 0,
    }, ttl);
    
    return newCount;
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key)!);
      this.timers.delete(key);
    }
  }

  async cleanup(): Promise<void> {
    // Cleanup is handled by timers
  }
}

// Redis store for production scalability
export class RedisRateLimitStore extends RateLimitStore {
  private redis: any;
  private keyPrefix: string;

  constructor(redis: any, keyPrefix = 'rl:') {
    super();
    this.redis = redis;
    this.keyPrefix = keyPrefix;
  }

  private getKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  async get(key: string): Promise<RateLimitInfo | null> {
    try {
      const data = await this.redis.get(this.getKey(key));
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set(key: string, info: RateLimitInfo, ttl: number): Promise<void> {
    try {
      await this.redis.setex(
        this.getKey(key),
        Math.ceil(ttl / 1000),
        JSON.stringify(info)
      );
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  async increment(key: string, window: number, ttl: number): Promise<number> {
    const now = Date.now();
    const windowKey = `${key}:${Math.floor(now / window)}`;
    const redisKey = this.getKey(windowKey);
    
    try {
      const pipeline = this.redis.pipeline();
      pipeline.incr(redisKey);
      pipeline.expire(redisKey, Math.ceil(ttl / 1000));
      
      const results = await pipeline.exec();
      return results[0][1]; // Return increment result
    } catch (error) {
      console.error('Redis increment error:', error);
      return 1;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(this.getKey(key));
    } catch (error) {
      console.error('Redis delete error:', error);
    }
  }

  async cleanup(): Promise<void> {
    // Redis handles TTL cleanup automatically
  }
}

// Supabase store for persistent logging and analysis
export class SupabaseRateLimitStore extends RateLimitStore {
  private supabase: any;
  private tableName: string;
  private memoryStore: MemoryRateLimitStore;

  constructor(supabase: any, tableName = 'rate_limit_logs') {
    super();
    this.supabase = supabase;
    this.tableName = tableName;
    this.memoryStore = new MemoryRateLimitStore();
  }

  async get(key: string): Promise<RateLimitInfo | null> {
    // Use memory store for fast access
    return this.memoryStore.get(key);
  }

  async set(key: string, info: RateLimitInfo, ttl: number): Promise<void> {
    // Store in memory for performance
    await this.memoryStore.set(key, info, ttl);
    
    // Log to Supabase for analysis (async, non-blocking)
    this.logToSupabase(key, info).catch(console.error);
  }

  async increment(key: string, window: number, ttl: number): Promise<number> {
    return this.memoryStore.increment(key, window, ttl);
  }

  async delete(key: string): Promise<void> {
    return this.memoryStore.delete(key);
  }

  async cleanup(): Promise<void> {
    return this.memoryStore.cleanup();
  }

  private async logToSupabase(key: string, info: RateLimitInfo): Promise<void> {
    try {
      await this.supabase
        .from(this.tableName)
        .insert({
          key: key,
          requests: info.requests,
          window_start: new Date(info.windowStart),
          blocked: info.blocked,
          violations: info.violations,
          created_at: new Date(),
        });
    } catch (error) {
      console.error('Supabase logging error:', error);
    }
  }
}

// Main rate limiter class
export class RateLimiter {
  private store: RateLimitStore;

  constructor(store: RateLimitStore) {
    this.store = store;
  }

  async checkLimit(
    identifier: string,
    rule: RateLimitRule,
    userTier?: string
  ): Promise<RateLimitResult> {
    try {
      // Check if identifier is blocked
      const blockInfo = await this.store.get(`block:${identifier}`);
      if (blockInfo?.blocked && blockInfo.blockExpiry && blockInfo.blockExpiry > Date.now()) {
        return {
          success: false,
          limit: 0,
          remaining: 0,
          resetTime: blockInfo.blockExpiry,
          retryAfter: Math.ceil((blockInfo.blockExpiry - Date.now()) / 1000),
          blocked: true,
          reason: 'IP temporarily blocked due to rate limit violations',
        };
      }

      // Get applicable windows (rule + user tier)
      const windows = [...rule.windows];
      if (userTier && rateLimitConfig.userTiers[userTier as keyof typeof rateLimitConfig.userTiers]) {
        windows.push(...rateLimitConfig.userTiers[userTier as keyof typeof rateLimitConfig.userTiers]);
      }

      // Check each time window
      for (const window of windows) {
        const result = await this.checkWindow(identifier, window, rule.name);
        if (!result.success) {
          // Handle violation
          await this.handleViolation(identifier, rule.name);
          return result;
        }
      }

      // All windows passed
      return {
        success: true,
        limit: Math.min(...windows.map(w => w.limit)),
        remaining: Math.min(...windows.map(w => w.limit)) - 1,
        resetTime: Date.now() + Math.max(...windows.map(w => w.interval)),
      };
    } catch (error) {
      console.error('Rate limit check error:', error);
      // Fail open for availability
      return {
        success: true,
        limit: 1000,
        remaining: 999,
        resetTime: Date.now() + 60000,
      };
    }
  }

  private async checkWindow(
    identifier: string,
    window: RateLimitWindow,
    ruleName: string
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = Math.floor(now / window.interval) * window.interval;
    const windowKey = `${ruleName}:${identifier}:${windowStart}`;
    
    const count = await this.store.increment(windowKey, window.interval, window.interval + 10000);
    const remaining = Math.max(0, window.limit - count);
    const resetTime = windowStart + window.interval;
    
    if (count > window.limit) {
      return {
        success: false,
        limit: window.limit,
        remaining: 0,
        resetTime,
        retryAfter: Math.ceil((resetTime - now) / 1000),
        reason: `Rate limit exceeded: ${count}/${window.limit} requests in ${window.interval/1000}s`,
      };
    }

    return {
      success: true,
      limit: window.limit,
      remaining,
      resetTime,
    };
  }

  private async handleViolation(identifier: string, ruleName: string): Promise<void> {
    const violationKey = `violations:${identifier}`;
    const violationInfo = await this.store.get(violationKey);
    
    const violations = (violationInfo?.violations || 0) + 1;
    const now = Date.now();
    
    // Update violation count
    await this.store.set(violationKey, {
      key: violationKey,
      requests: violations,
      windowStart: now,
      blocked: false,
      violations,
    }, 24 * 60 * 60 * 1000); // 24 hour TTL
    
    // Apply exponential backoff if enabled
    if (rateLimitConfig.security.exponentialBackoff.enabled && violations >= 3) {
      const delay = Math.min(
        1000 * Math.pow(rateLimitConfig.security.exponentialBackoff.multiplier, violations - 3),
        rateLimitConfig.security.exponentialBackoff.maxDelay
      );
      
      const blockKey = `block:${identifier}`;
      await this.store.set(blockKey, {
        key: blockKey,
        requests: 0,
        windowStart: now,
        blocked: true,
        blockExpiry: now + delay,
        violations,
      }, delay + 10000);
      
      // Log security event
      console.warn(`IP ${identifier} blocked for ${delay}ms after ${violations} violations`);
    }
  }

  async getStats(identifier: string): Promise<any> {
    const violationInfo = await this.store.get(`violations:${identifier}`);
    const blockInfo = await this.store.get(`block:${identifier}`);
    
    return {
      violations: violationInfo?.violations || 0,
      blocked: blockInfo?.blocked || false,
      blockExpiry: blockInfo?.blockExpiry,
    };
  }

  async clearViolations(identifier: string): Promise<void> {
    await this.store.delete(`violations:${identifier}`);
    await this.store.delete(`block:${identifier}`);
  }
}

// Factory function to create rate limiter with appropriate store
export function createRateLimiter(): RateLimiter {
  let store: RateLimitStore;
  
  switch (rateLimitConfig.storage.type) {
    case 'redis':
      if (typeof window === 'undefined') {
        // Server-side Redis (import dynamically to avoid client-side issues)
        try {
          const Redis = require('ioredis');
          const redis = new Redis(rateLimitConfig.storage.redis?.url);
          store = new RedisRateLimitStore(redis, rateLimitConfig.storage.redis?.keyPrefix);
        } catch (error) {
          console.warn('Redis not available, falling back to memory store');
          store = new MemoryRateLimitStore();
        }
      } else {
        store = new MemoryRateLimitStore();
      }
      break;
      
    case 'supabase':
      if (rateLimitConfig.storage.supabase?.enabled) {
        // Import Supabase client dynamically
        try {
          const { createClient } = require('@supabase/supabase-js');
          const supabase = createClient(
            process.env.VITE_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          );
          store = new SupabaseRateLimitStore(supabase, rateLimitConfig.storage.supabase.tableName);
        } catch (error) {
          console.warn('Supabase not available, falling back to memory store');
          store = new MemoryRateLimitStore();
        }
      } else {
        store = new MemoryRateLimitStore();
      }
      break;
      
    default:
      store = new MemoryRateLimitStore();
  }
  
  return new RateLimiter(store);
}