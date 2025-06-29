/**
 * Redis-based Distributed Rate Limiting Store v0.1.6
 * High-performance, scalable rate limiting with Redis
 */

import { Redis } from 'ioredis';
import { RateLimitStore, RateLimitInfo } from './core';

export interface RedisConfig {
  url: string;
  keyPrefix: string;
  maxRetries: number;
  retryDelayOnFailover: number;
  enableOfflineQueue: boolean;
  lazyConnect: boolean;
}

export class AdvancedRedisRateLimitStore extends RateLimitStore {
  private redis: Redis;
  private slidingWindowScript: string;
  private tokenBucketScript: string;
  private keyPrefix: string;

  constructor(config: RedisConfig) {
    super();
    
    this.keyPrefix = config.keyPrefix;
    this.redis = new Redis(config.url, {
      maxRetriesPerRequest: config.maxRetries,
      retryDelayOnFailover: config.retryDelayOnFailover,
      enableOfflineQueue: config.enableOfflineQueue,
      lazyConnect: config.lazyConnect,
      // Connection resilience
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        return err.message.includes(targetError);
      },
      // Performance optimizations
      enableAutoPipelining: true,
      maxRetriesPerRequest: 3,
    });

    // Sliding window rate limiting script (Lua for atomicity)
    this.slidingWindowScript = `
      local key = KEYS[1]
      local window = tonumber(ARGV[1])
      local limit = tonumber(ARGV[2])
      local current_time = tonumber(ARGV[3])
      local expiry = tonumber(ARGV[4])
      
      -- Remove expired entries
      redis.call('ZREMRANGEBYSCORE', key, 0, current_time - window)
      
      -- Get current count
      local current_count = redis.call('ZCARD', key)
      
      if current_count < limit then
        -- Add current request
        redis.call('ZADD', key, current_time, current_time .. '-' .. math.random())
        redis.call('EXPIRE', key, expiry)
        return {1, current_count + 1, limit - current_count - 1}
      else
        -- Rate limit exceeded
        redis.call('EXPIRE', key, expiry)
        return {0, current_count, 0}
      end
    `;

    // Token bucket algorithm script
    this.tokenBucketScript = `
      local key = KEYS[1]
      local capacity = tonumber(ARGV[1])
      local refill_rate = tonumber(ARGV[2])
      local refill_period = tonumber(ARGV[3])
      local current_time = tonumber(ARGV[4])
      local tokens_requested = tonumber(ARGV[5])
      local expiry = tonumber(ARGV[6])
      
      -- Get current bucket state
      local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
      local tokens = tonumber(bucket[1]) or capacity
      local last_refill = tonumber(bucket[2]) or current_time
      
      -- Calculate tokens to add based on time elapsed
      local time_elapsed = current_time - last_refill
      local tokens_to_add = math.floor(time_elapsed / refill_period) * refill_rate
      tokens = math.min(capacity, tokens + tokens_to_add)
      
      if tokens >= tokens_requested then
        -- Allow request and consume tokens
        tokens = tokens - tokens_requested
        redis.call('HMSET', key, 'tokens', tokens, 'last_refill', current_time)
        redis.call('EXPIRE', key, expiry)
        return {1, tokens, capacity}
      else
        -- Rate limit exceeded
        redis.call('HMSET', key, 'tokens', tokens, 'last_refill', current_time)
        redis.call('EXPIRE', key, expiry)
        return {0, tokens, capacity}
      end
    `;

    // Error handling
    this.redis.on('error', (error) => {
      console.error('Redis connection error:', error);
    });

    this.redis.on('connect', () => {
      console.log('Redis connected successfully');
    });
  }

  private getKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  async get(key: string): Promise<RateLimitInfo | null> {
    try {
      const data = await this.redis.hgetall(this.getKey(key));
      if (!data || Object.keys(data).length === 0) {
        return null;
      }

      return {
        key,
        requests: parseInt(data.requests) || 0,
        windowStart: parseInt(data.windowStart) || Date.now(),
        blocked: data.blocked === 'true',
        blockExpiry: data.blockExpiry ? parseInt(data.blockExpiry) : undefined,
        violations: parseInt(data.violations) || 0,
      };
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set(key: string, info: RateLimitInfo, ttl: number): Promise<void> {
    try {
      const redisKey = this.getKey(key);
      const pipeline = this.redis.pipeline();
      
      pipeline.hmset(redisKey, {
        requests: info.requests.toString(),
        windowStart: info.windowStart.toString(),
        blocked: info.blocked.toString(),
        violations: info.violations.toString(),
        ...(info.blockExpiry && { blockExpiry: info.blockExpiry.toString() }),
      });
      
      pipeline.expire(redisKey, Math.ceil(ttl / 1000));
      
      await pipeline.exec();
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  async increment(key: string, window: number, ttl: number): Promise<number> {
    try {
      const redisKey = this.getKey(key);
      const pipeline = this.redis.pipeline();
      
      pipeline.incr(redisKey);
      pipeline.expire(redisKey, Math.ceil(ttl / 1000));
      
      const results = await pipeline.exec();
      return (results?.[0]?.[1] as number) || 1;
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
    // This method is for interface compatibility
  }

  // Sliding window rate limiting with Lua script
  async slidingWindowCheck(
    key: string,
    windowMs: number,
    limit: number
  ): Promise<{
    allowed: boolean;
    count: number;
    remaining: number;
  }> {
    try {
      const redisKey = this.getKey(`sw:${key}`);
      const currentTime = Date.now();
      const expiry = Math.ceil(windowMs / 1000) + 10; // Extra buffer
      
      const result = await this.redis.eval(
        this.slidingWindowScript,
        1,
        redisKey,
        windowMs.toString(),
        limit.toString(),
        currentTime.toString(),
        expiry.toString()
      ) as [number, number, number];
      
      return {
        allowed: result[0] === 1,
        count: result[1],
        remaining: result[2],
      };
    } catch (error) {
      console.error('Redis sliding window error:', error);
      // Fail open for availability
      return {
        allowed: true,
        count: 0,
        remaining: limit,
      };
    }
  }

  // Token bucket rate limiting with Lua script
  async tokenBucketCheck(
    key: string,
    capacity: number,
    refillRate: number,
    refillPeriodMs: number,
    tokensRequested: number = 1
  ): Promise<{
    allowed: boolean;
    tokens: number;
    capacity: number;
  }> {
    try {
      const redisKey = this.getKey(`tb:${key}`);
      const currentTime = Date.now();
      const expiry = Math.ceil(refillPeriodMs / 1000) * 10; // Long TTL for token buckets
      
      const result = await this.redis.eval(
        this.tokenBucketScript,
        1,
        redisKey,
        capacity.toString(),
        refillRate.toString(),
        refillPeriodMs.toString(),
        currentTime.toString(),
        tokensRequested.toString(),
        expiry.toString()
      ) as [number, number, number];
      
      return {
        allowed: result[0] === 1,
        tokens: result[1],
        capacity: result[2],
      };
    } catch (error) {
      console.error('Redis token bucket error:', error);
      // Fail open for availability
      return {
        allowed: true,
        tokens: capacity,
        capacity,
      };
    }
  }

  // Distributed locking for critical operations
  async acquireLock(
    lockKey: string,
    ttlMs: number,
    identifier: string = Math.random().toString(36)
  ): Promise<{ acquired: boolean; identifier: string }> {
    try {
      const redisKey = this.getKey(`lock:${lockKey}`);
      const result = await this.redis.set(
        redisKey,
        identifier,
        'PX', // Expire in milliseconds
        ttlMs,
        'NX' // Only set if not exists
      );
      
      return {
        acquired: result === 'OK',
        identifier,
      };
    } catch (error) {
      console.error('Redis lock acquisition error:', error);
      return {
        acquired: false,
        identifier,
      };
    }
  }

  async releaseLock(lockKey: string, identifier: string): Promise<boolean> {
    try {
      const redisKey = this.getKey(`lock:${lockKey}`);
      
      // Lua script to ensure we only release our own lock
      const script = `
        if redis.call("GET", KEYS[1]) == ARGV[1] then
          return redis.call("DEL", KEYS[1])
        else
          return 0
        end
      `;
      
      const result = await this.redis.eval(script, 1, redisKey, identifier);
      return result === 1;
    } catch (error) {
      console.error('Redis lock release error:', error);
      return false;
    }
  }

  // Bulk operations for performance
  async getBatch(keys: string[]): Promise<(RateLimitInfo | null)[]> {
    try {
      if (keys.length === 0) return [];
      
      const pipeline = this.redis.pipeline();
      keys.forEach(key => {
        pipeline.hgetall(this.getKey(key));
      });
      
      const results = await pipeline.exec();
      
      return results?.map((result, index) => {
        if (!result || result[0]) return null; // Error occurred
        
        const data = result[1] as Record<string, string>;
        if (!data || Object.keys(data).length === 0) return null;
        
        return {
          key: keys[index],
          requests: parseInt(data.requests) || 0,
          windowStart: parseInt(data.windowStart) || Date.now(),
          blocked: data.blocked === 'true',
          blockExpiry: data.blockExpiry ? parseInt(data.blockExpiry) : undefined,
          violations: parseInt(data.violations) || 0,
        };
      }) || [];
    } catch (error) {
      console.error('Redis batch get error:', error);
      return keys.map(() => null);
    }
  }

  async setBatch(items: Array<{ key: string; info: RateLimitInfo; ttl: number }>): Promise<void> {
    try {
      if (items.length === 0) return;
      
      const pipeline = this.redis.pipeline();
      
      items.forEach(({ key, info, ttl }) => {
        const redisKey = this.getKey(key);
        
        pipeline.hmset(redisKey, {
          requests: info.requests.toString(),
          windowStart: info.windowStart.toString(),
          blocked: info.blocked.toString(),
          violations: info.violations.toString(),
          ...(info.blockExpiry && { blockExpiry: info.blockExpiry.toString() }),
        });
        
        pipeline.expire(redisKey, Math.ceil(ttl / 1000));
      });
      
      await pipeline.exec();
    } catch (error) {
      console.error('Redis batch set error:', error);
    }
  }

  // Analytics and monitoring
  async getStats(): Promise<{
    totalKeys: number;
    memoryUsage: string;
    hitRate: number;
    connectionStatus: string;
  }> {
    try {
      const [dbSize, info] = await Promise.all([
        this.redis.dbsize(),
        this.redis.info('memory')
      ]);
      
      const memoryMatch = info.match(/used_memory_human:(.+)\r\n/);
      const memoryUsage = memoryMatch ? memoryMatch[1] : 'unknown';
      
      return {
        totalKeys: dbSize,
        memoryUsage,
        hitRate: 0, // Would need to implement hit tracking
        connectionStatus: this.redis.status,
      };
    } catch (error) {
      console.error('Redis stats error:', error);
      return {
        totalKeys: 0,
        memoryUsage: 'unknown',
        hitRate: 0,
        connectionStatus: 'error',
      };
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  }

  // Graceful shutdown
  async disconnect(): Promise<void> {
    try {
      await this.redis.quit();
    } catch (error) {
      console.error('Redis disconnect error:', error);
      this.redis.disconnect();
    }
  }
}

// Factory function for Redis store with configuration
export function createRedisRateLimitStore(overrides: Partial<RedisConfig> = {}): AdvancedRedisRateLimitStore {
  const defaultConfig: RedisConfig = {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    keyPrefix: 'fear_city_rl:',
    maxRetries: 3,
    retryDelayOnFailover: 100,
    enableOfflineQueue: false,
    lazyConnect: true,
  };

  const config = { ...defaultConfig, ...overrides };
  return new AdvancedRedisRateLimitStore(config);
}

// Connection pool manager for multiple Redis instances
export class RedisRateLimitCluster {
  private stores: AdvancedRedisRateLimitStore[];
  private currentIndex: number = 0;

  constructor(configs: RedisConfig[]) {
    this.stores = configs.map(config => new AdvancedRedisRateLimitStore(config));
  }

  // Round-robin load balancing
  private getNextStore(): AdvancedRedisRateLimitStore {
    const store = this.stores[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.stores.length;
    return store;
  }

  // Hash-based sharding
  private getStoreByKey(key: string): AdvancedRedisRateLimitStore {
    const hash = this.simpleHash(key);
    const index = hash % this.stores.length;
    return this.stores[index];
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  async slidingWindowCheck(key: string, windowMs: number, limit: number) {
    const store = this.getStoreByKey(key);
    return store.slidingWindowCheck(key, windowMs, limit);
  }

  async tokenBucketCheck(
    key: string,
    capacity: number,
    refillRate: number,
    refillPeriodMs: number,
    tokensRequested?: number
  ) {
    const store = this.getStoreByKey(key);
    return store.tokenBucketCheck(key, capacity, refillRate, refillPeriodMs, tokensRequested);
  }

  async healthCheck(): Promise<{ healthy: number; total: number; details: boolean[] }> {
    const results = await Promise.all(
      this.stores.map(store => store.healthCheck())
    );
    
    const healthy = results.filter(Boolean).length;
    
    return {
      healthy,
      total: this.stores.length,
      details: results,
    };
  }

  async disconnect(): Promise<void> {
    await Promise.all(this.stores.map(store => store.disconnect()));
  }
}