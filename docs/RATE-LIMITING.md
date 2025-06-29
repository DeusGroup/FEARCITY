# Rate Limiting System v0.1.6

Complete rate limiting solution for Fear City Cycles website with multi-layered protection against abuse, bots, and DDoS attacks.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Security Features](#security-features)
- [Monitoring](#monitoring)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Overview

The Fear City Cycles rate limiting system provides:

- **Multi-layered Protection**: Next.js middleware + Supabase Edge Functions
- **Flexible Configuration**: Endpoint-specific rules and user tiers
- **Advanced Security**: CAPTCHA challenges, bot detection, threat analysis
- **Real-time Monitoring**: Dashboard with analytics and alerts
- **High Performance**: Redis-based distributed storage with fallbacks

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client        │───▶│  Next.js        │───▶│  Supabase       │
│   Request       │    │  Middleware     │    │  Edge Function  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                        │
                              ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │  Rate Limit     │    │  API Rate       │
                       │  Check (IP)     │    │  Limiting       │
                       └─────────────────┘    └─────────────────┘
                              │                        │
                              ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │  Redis/Memory   │    │  Supabase       │
                       │  Store          │    │  Database       │
                       └─────────────────┘    └─────────────────┘
```

### Components

1. **Next.js Middleware** (`middleware.ts`) - Edge-level IP-based rate limiting
2. **Core Engine** (`lib/rate-limit/core.ts`) - Sliding window algorithm
3. **Security Manager** (`lib/rate-limit/security.ts`) - CAPTCHA and threat detection
4. **API Integration** (`lib/rate-limit/api-integration.ts`) - Easy-to-use functions
5. **Monitoring Dashboard** (`components/admin/RateLimitDashboard.tsx`) - Real-time analytics

## Quick Start

### 1. Environment Setup

```bash
# Required environment variables
VITE_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
REDIS_URL=redis://localhost:6379  # Optional - falls back to memory
```

### 2. Database Setup

Run the migration to create rate limiting tables:

```sql
-- File: supabase/migrations/20250629000001_rate_limiting_tables.sql
-- This creates the necessary tables for rate limiting
```

### 3. Basic Usage

#### In API Routes

```typescript
import { checkRateLimit } from '@/lib/rate-limit/api-integration';

export async function POST(request: Request) {
  // Check rate limit
  const rateLimitResult = await checkRateLimit(request);
  
  if (!rateLimitResult.success) {
    return rateLimitResult.response; // Returns 429 with headers
  }
  
  // Your API logic here
  return Response.json({ success: true });
}
```

#### With Decorator Pattern

```typescript
import { withRateLimit } from '@/lib/rate-limit/api-integration';

export const POST = withRateLimit()(async (request: Request) => {
  // Your API logic - rate limiting is handled automatically
  return Response.json({ success: true });
});
```

## Configuration

### Basic Configuration

```typescript
// lib/rate-limit/config.ts
export const rateLimitConfig = {
  global: {
    enabled: true,
    defaultRule: {
      name: 'default',
      windows: [
        { interval: 60000, limit: 100 }, // 100 requests per minute
        { interval: 3600000, limit: 1000 } // 1000 requests per hour
      ]
    }
  },
  endpoints: {
    '/api/auth/*': {
      name: 'auth',
      windows: [
        { interval: 60000, limit: 5 },    // 5 per minute
        { interval: 3600000, limit: 20 }  // 20 per hour
      ]
    }
  }
};
```

### User Tiers

```typescript
const userTiers = {
  free: { multiplier: 0.5 },    // 50% of base limits
  basic: { multiplier: 1.0 },   // 100% of base limits
  premium: { multiplier: 2.0 }, // 200% of base limits
  enterprise: { multiplier: 5.0 } // 500% of base limits
};
```

### Security Configuration

```typescript
const security = {
  blacklist: ['1.2.3.4', '5.6.7.8'],
  whitelist: ['127.0.0.1', '192.168.1.0/24'],
  blockedUserAgents: ['curl', 'wget', 'python-requests'],
  exponentialBackoff: {
    enabled: true,
    multiplier: 2,
    maxDelay: 300000 // 5 minutes
  },
  captcha: {
    enabled: true,
    threshold: 10, // violations before CAPTCHA
    types: ['math', 'text']
  }
};
```

## API Reference

### Core Functions

#### `checkRateLimit(request, options?)`

Main rate limiting function with comprehensive options.

```typescript
const result = await checkRateLimit(request, {
  customLimits: [{ interval: 60000, limit: 10 }],
  userTier: 'premium',
  enableCaptcha: true,
  skipWhitelist: false
});

// Result structure
interface RateLimitResult {
  success: boolean;
  headers: Record<string, string>;
  response?: Response;
  captchaRequired?: boolean;
  captchaChallenge?: CaptchaChallenge;
}
```

#### Specialized Functions

```typescript
// Authentication endpoints (stricter limits)
await checkAuthRateLimit(request);

// Contact form (prevent spam)
await checkContactRateLimit(request);

// General API with user tier
await checkApiRateLimit(request, userTier);

// Payment processing (very strict)
await checkPaymentRateLimit(request);

// File uploads (size-based limits)
await checkUploadRateLimit(request, fileSize);

// Search functionality (burst allowance)
await checkSearchRateLimit(request);

// Bulk operations (count-based)
await checkBulkOperationRateLimit(request, operationCount);

// Geographic restrictions
await checkGeoRateLimit(request, countryCode);
```

### Response Headers

The system sets standard rate limiting headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 85
X-RateLimit-Reset: 1640995260
X-RateLimit-Window: 60
Retry-After: 45
X-RateLimit-Status: ok|limited|blocked|whitelisted|error
```

## Security Features

### CAPTCHA System

```typescript
import { securityManager } from '@/lib/rate-limit/security';

// Generate challenge
const challenge = await securityManager.generateCaptchaChallenge(
  'user-identifier',
  CaptchaType.MATH
);

// Verify solution
const result = await securityManager.verifyCaptchaSolution(
  challenge.id,
  userAnswer
);
```

### Bot Detection

```typescript
// Automatic bot detection
const botCheck = securityManager.detectBotPatterns({
  userAgent: request.headers.get('user-agent'),
  headers: Object.fromEntries(request.headers.entries())
});

if (botCheck.isBot && botCheck.confidence > 0.8) {
  // Block or challenge
}
```

### Threat Analysis

```typescript
// Analyze request patterns
const threats = securityManager.analyzeRequestPattern(identifier, requests);

// Generate security report
const report = securityManager.generateSecurityReport(identifier);
```

## Monitoring

### Dashboard Component

```tsx
import { RateLimitDashboard } from '@/components/admin/RateLimitDashboard';

export default function AdminPage() {
  return (
    <div>
      <h1>Rate Limiting Dashboard</h1>
      <RateLimitDashboard />
    </div>
  );
}
```

### Analytics API

```typescript
// Get rate limiting analytics
const response = await fetch('/api/rate-limit/analytics?period=24h');
const analytics = await response.json();
```

### Real-time Monitoring

```typescript
// Monitor active limits
const activeLimits = await fetch('/api/rate-limit/status').then(r => r.json());

// Get violation alerts
const violations = analytics.violations.filter(v => 
  v.timestamp > Date.now() - 3600000 // Last hour
);
```

## Testing

### Running Tests

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run specific test suites
npm test __tests__/rate-limit/core.test.ts
npm test __tests__/rate-limit/security.test.ts
npm test __tests__/rate-limit/api-integration.test.ts
npm test __tests__/rate-limit/middleware.test.ts

# Run with coverage
npm test -- --coverage
```

### Test Configuration

Tests use Jest with comprehensive mocking:

```typescript
// __tests__/setup.ts configures:
// - Next.js environment mocks
// - Supabase client mocks
// - Redis connection mocks
// - Timer mocking for time-based tests
```

### Integration Testing

```bash
# Test with real Redis (optional)
REDIS_URL=redis://localhost:6379 npm test

# Test with real Supabase (optional)
VITE_SUPABASE_URL=your_url SUPABASE_SERVICE_ROLE_KEY=your_key npm test
```

## Deployment

### Vercel Deployment

1. **Environment Variables**: Set in Vercel dashboard
   - `VITE_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `REDIS_URL` (optional)

2. **Edge Functions**: Automatically deployed with middleware

3. **Supabase Setup**: Deploy Edge Functions
   ```bash
   supabase functions deploy rate-limiter
   ```

### Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Redis instance provisioned (optional)
- [ ] Monitoring dashboard accessible
- [ ] Rate limiting rules tested
- [ ] Security features enabled
- [ ] Performance benchmarks met

### Scaling Considerations

- **Redis**: Use Redis cluster for high availability
- **Edge Functions**: Automatic scaling with Supabase
- **Database**: Monitor connection pool usage
- **Monitoring**: Set up alerts for high violation rates

## Troubleshooting

### Common Issues

#### 1. Rate Limiting Not Working

```typescript
// Check configuration
console.log(rateLimitConfig);

// Verify middleware is running
console.log('Middleware executed for:', request.url);

// Check store connectivity
const testResult = await store.get('test-key');
```

#### 2. Redis Connection Issues

```typescript
// Fallback to memory store
if (redisError) {
  console.warn('Redis unavailable, using memory store');
  // System automatically falls back
}
```

#### 3. High False Positives

```typescript
// Adjust sensitivity
rateLimitConfig.security.botDetection.sensitivity = 0.7; // Lower = less sensitive

// Review whitelist
rateLimitConfig.security.whitelist.push('your-ip-range');
```

#### 4. Performance Issues

```typescript
// Enable Redis for better performance
process.env.REDIS_URL = 'redis://your-redis-instance';

// Optimize cleanup intervals
rateLimitConfig.storage.cleanupInterval = 300000; // 5 minutes
```

### Debug Mode

```typescript
// Enable detailed logging
process.env.RATE_LIMIT_DEBUG = 'true';

// Check rate limit status
const status = await fetch('/api/rate-limit/debug/status');
const debugInfo = await status.json();
```

### Monitoring Queries

```sql
-- Check recent violations
SELECT * FROM rate_limit_violations 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Top violating IPs
SELECT identifier, COUNT(*) as violations
FROM rate_limit_violations 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY identifier 
ORDER BY violations DESC 
LIMIT 10;
```

## Best Practices

### Configuration

1. **Start Conservative**: Begin with stricter limits and relax as needed
2. **Monitor Actively**: Use dashboard to understand traffic patterns
3. **Test Thoroughly**: Verify limits don't impact legitimate users
4. **Document Changes**: Keep configuration changes documented

### Security

1. **Layer Defense**: Use multiple rate limiting strategies
2. **Monitor Patterns**: Watch for distributed attacks
3. **Update Regularly**: Keep bot detection patterns current
4. **Whitelist Carefully**: Only whitelist trusted sources

### Performance

1. **Use Redis**: For production deployments
2. **Optimize Rules**: Avoid overly complex configurations
3. **Cache Results**: Where appropriate
4. **Monitor Latency**: Ensure rate limiting doesn't slow responses

---

## Support

For issues specific to Fear City Cycles rate limiting:

1. Check this documentation
2. Review test files for examples
3. Check monitoring dashboard for insights
4. Verify configuration matches your needs

For general rate limiting concepts, refer to industry standards like:
- RFC 6585 (HTTP Status Code 429)
- OWASP Rate Limiting Guidelines
- Redis Rate Limiting Patterns