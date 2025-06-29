/**
 * Rate Limiting Configuration for Fear City Cycles
 * Comprehensive configuration system for all rate limiting strategies
 */

export interface RateLimitWindow {
  interval: number; // Time window in milliseconds
  limit: number;    // Number of requests allowed
}

export interface RateLimitRule {
  name: string;
  windows: RateLimitWindow[];
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: any) => string;
}

export interface UserTierLimits {
  free: RateLimitWindow[];
  premium: RateLimitWindow[];
  admin: RateLimitWindow[];
}

export interface SecurityConfig {
  enableCaptcha: boolean;
  captchaThreshold: number;
  exponentialBackoff: {
    enabled: boolean;
    maxDelay: number;
    multiplier: number;
  };
  blacklist: string[];
  whitelist: string[];
  blockedUserAgents: string[];
}

export interface MonitoringConfig {
  enableLogging: boolean;
  alertThreshold: number;
  webhookUrl?: string;
  logRetentionDays: number;
}

export interface RateLimitConfig {
  // Global settings
  global: {
    enabled: boolean;
    defaultRule: RateLimitRule;
  };

  // Endpoint-specific rules
  endpoints: {
    [pattern: string]: RateLimitRule;
  };

  // User tier-based limits
  userTiers: UserTierLimits;

  // Security features
  security: SecurityConfig;

  // Monitoring and alerts
  monitoring: MonitoringConfig;

  // Storage backend
  storage: {
    type: 'memory' | 'redis' | 'supabase';
    redis?: {
      url: string;
      keyPrefix: string;
    };
    supabase?: {
      enabled: boolean;
      tableName: string;
    };
  };
}

// Fear City Cycles Rate Limiting Configuration
export const rateLimitConfig: RateLimitConfig = {
  global: {
    enabled: true,
    defaultRule: {
      name: 'default',
      windows: [
        { interval: 60 * 1000, limit: 100 }, // 100 requests per minute
        { interval: 60 * 60 * 1000, limit: 1000 }, // 1000 requests per hour
      ],
    },
  },

  endpoints: {
    // Authentication endpoints - strict limits
    '/api/auth/*': {
      name: 'auth',
      windows: [
        { interval: 60 * 1000, limit: 5 }, // 5 login attempts per minute
        { interval: 15 * 60 * 1000, limit: 10 }, // 10 attempts per 15 minutes
      ],
      skipSuccessfulRequests: false,
    },

    // Contact form - prevent spam
    '/api/contact': {
      name: 'contact',
      windows: [
        { interval: 60 * 1000, limit: 2 }, // 2 submissions per minute
        { interval: 60 * 60 * 1000, limit: 10 }, // 10 submissions per hour
      ],
    },

    // Newsletter signup
    '/api/newsletter': {
      name: 'newsletter',
      windows: [
        { interval: 60 * 1000, limit: 1 }, // 1 signup per minute
        { interval: 24 * 60 * 60 * 1000, limit: 3 }, // 3 signups per day
      ],
    },

    // Product catalog - generous limits for browsing
    '/api/products/*': {
      name: 'products',
      windows: [
        { interval: 60 * 1000, limit: 200 }, // 200 requests per minute
        { interval: 60 * 60 * 1000, limit: 2000 }, // 2000 requests per hour
      ],
      skipSuccessfulRequests: true,
    },

    // Cart operations
    '/api/cart/*': {
      name: 'cart',
      windows: [
        { interval: 60 * 1000, limit: 50 }, // 50 cart operations per minute
        { interval: 60 * 60 * 1000, limit: 500 }, // 500 operations per hour
      ],
    },

    // Admin endpoints - very strict
    '/api/admin/*': {
      name: 'admin',
      windows: [
        { interval: 60 * 1000, limit: 20 }, // 20 requests per minute
        { interval: 60 * 60 * 1000, limit: 100 }, // 100 requests per hour
      ],
    },

    // Search functionality
    '/api/search': {
      name: 'search',
      windows: [
        { interval: 1000, limit: 2 }, // 2 searches per second
        { interval: 60 * 1000, limit: 30 }, // 30 searches per minute
      ],
    },

    // Static assets - very generous
    '/assets/*': {
      name: 'assets',
      windows: [
        { interval: 60 * 1000, limit: 1000 }, // 1000 asset requests per minute
      ],
      skipSuccessfulRequests: true,
    },
  },

  userTiers: {
    free: [
      { interval: 60 * 1000, limit: 50 }, // 50 requests per minute
      { interval: 60 * 60 * 1000, limit: 500 }, // 500 requests per hour
    ],
    premium: [
      { interval: 60 * 1000, limit: 200 }, // 200 requests per minute
      { interval: 60 * 60 * 1000, limit: 2000 }, // 2000 requests per hour
    ],
    admin: [
      { interval: 60 * 1000, limit: 1000 }, // 1000 requests per minute
      { interval: 60 * 60 * 1000, limit: 10000 }, // 10000 requests per hour
    ],
  },

  security: {
    enableCaptcha: true,
    captchaThreshold: 10, // Show CAPTCHA after 10 violations
    exponentialBackoff: {
      enabled: true,
      maxDelay: 300000, // Maximum 5 minutes delay
      multiplier: 2,
    },
    blacklist: [
      // Add known bad IPs here
    ],
    whitelist: [
      '127.0.0.1',
      '::1',
      // Add trusted IPs here
    ],
    blockedUserAgents: [
      'curl',
      'wget',
      'python-requests',
      'scrapy',
      'bot',
      'spider',
      'crawler',
    ],
  },

  monitoring: {
    enableLogging: true,
    alertThreshold: 100, // Alert when > 100 violations per hour
    logRetentionDays: 30,
    webhookUrl: process.env.RATE_LIMIT_WEBHOOK_URL,
  },

  storage: {
    type: process.env.NODE_ENV === 'production' ? 'redis' : 'memory',
    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      keyPrefix: 'fear_city_rl:',
    },
    supabase: {
      enabled: true,
      tableName: 'rate_limit_logs',
    },
  },
};

// Utility functions for configuration
export function getRuleForPath(path: string): RateLimitRule {
  // Find the most specific matching rule
  const patterns = Object.keys(rateLimitConfig.endpoints);
  
  for (const pattern of patterns.sort((a, b) => b.length - a.length)) {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    if (regex.test(path)) {
      return rateLimitConfig.endpoints[pattern];
    }
  }
  
  return rateLimitConfig.global.defaultRule;
}

export function getUserTierLimits(userTier: keyof UserTierLimits): RateLimitWindow[] {
  return rateLimitConfig.userTiers[userTier] || rateLimitConfig.userTiers.free;
}

export function isWhitelisted(ip: string): boolean {
  return rateLimitConfig.security.whitelist.includes(ip);
}

export function isBlacklisted(ip: string): boolean {
  return rateLimitConfig.security.blacklist.includes(ip);
}

export function isBlockedUserAgent(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return rateLimitConfig.security.blockedUserAgents.some(blocked => 
    ua.includes(blocked.toLowerCase())
  );
}