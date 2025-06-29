/**
 * API Integration Layer for Rate Limiting v0.1.6
 * Easy-to-use functions for integrating rate limiting into API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRateLimiter, RateLimitResult } from './core';
import { rateLimitConfig, getRuleForPath, isWhitelisted } from './config';
import { securityManager, CaptchaType } from './security';

export interface RateLimitOptions {
  identifier?: string;
  rule?: string;
  userTier?: string;
  skipSuccessfulRequests?: boolean;
  enableCaptcha?: boolean;
  customLimits?: Array<{ interval: number; limit: number }>;
}

export interface RateLimitApiResult {
  success: boolean;
  headers: Record<string, string>;
  response?: NextResponse;
  captchaRequired?: boolean;
  captchaChallenge?: any;
}

// Get client identifier from request
export function getClientIdentifier(request: NextRequest): string {
  // Try to get user ID if authenticated
  const userId = request.headers.get('x-user-id');
  if (userId) return `user:${userId}`;
  
  // Fall back to IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (cfConnectingIP) return `ip:${cfConnectingIP}`;
  if (realIP) return `ip:${realIP}`;
  if (forwarded) return `ip:${forwarded.split(',')[0].trim()}`;
  
  return `ip:unknown`;
}

// Main rate limiting function for API routes
export async function checkRateLimit(
  request: NextRequest,
  options: RateLimitOptions = {}
): Promise<RateLimitApiResult> {
  const rateLimiter = createRateLimiter();
  const pathname = new URL(request.url).pathname;
  
  // Get identifier
  const identifier = options.identifier || getClientIdentifier(request);
  const ipOnly = identifier.replace('ip:', '').replace('user:', '');
  
  // Check whitelist
  if (isWhitelisted(ipOnly)) {
    return {
      success: true,
      headers: {
        'X-RateLimit-Status': 'whitelisted',
      },
    };
  }

  // Get rate limiting rule
  const rule = options.rule 
    ? rateLimitConfig.endpoints[options.rule] || rateLimitConfig.global.defaultRule
    : getRuleForPath(pathname);

  // Override with custom limits if provided
  if (options.customLimits) {
    rule.windows = options.customLimits;
  }

  try {
    // Check rate limit
    const result = await rateLimiter.checkLimit(identifier, rule, options.userTier);
    
    // Build response headers
    const headers: Record<string, string> = {
      'X-RateLimit-Limit': result.limit.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': result.resetTime.toString(),
    };

    if (result.retryAfter) {
      headers['Retry-After'] = result.retryAfter.toString();
    }

    if (result.reason) {
      headers['X-RateLimit-Reason'] = result.reason;
    }

    // If rate limit exceeded
    if (!result.success) {
      // Check if CAPTCHA should be shown
      if (options.enableCaptcha && await securityManager.shouldChallengeCaptcha(identifier)) {
        const captchaChallenge = await securityManager.generateCaptchaChallenge(
          identifier,
          CaptchaType.MATH
        );
        
        return {
          success: false,
          headers: {
            ...headers,
            'X-RateLimit-Captcha-Required': 'true',
            'X-RateLimit-Captcha-Challenge-ID': captchaChallenge.id,
          },
          captchaRequired: true,
          captchaChallenge,
          response: NextResponse.json({
            error: 'Rate limit exceeded',
            captchaRequired: true,
            challenge: {
              id: captchaChallenge.id,
              question: captchaChallenge.challenge,
            },
          }, { 
            status: 429,
            headers,
          }),
        };
      }

      // Regular rate limit response
      return {
        success: false,
        headers,
        response: NextResponse.json({
          error: 'Too Many Requests',
          message: result.reason || 'Rate limit exceeded',
          retryAfter: result.retryAfter,
        }, { 
          status: 429,
          headers,
        }),
      };
    }

    // Success
    return {
      success: true,
      headers,
    };

  } catch (error) {
    console.error('Rate limiting error:', error);
    
    // Fail open for availability
    return {
      success: true,
      headers: {
        'X-RateLimit-Status': 'error',
        'X-RateLimit-Fallback': 'true',
      },
    };
  }
}

// Verify CAPTCHA solution
export async function verifyCaptcha(
  challengeId: string,
  solution: string
): Promise<{
  valid: boolean;
  error?: string;
}> {
  return securityManager.verifyCaptchaSolution(challengeId, solution);
}

// Decorator for API route handlers
export function withRateLimit(options: RateLimitOptions = {}) {
  return function decorator(handler: Function) {
    return async function rateLimitedHandler(request: NextRequest, context?: any) {
      // Check rate limit
      const rateLimitResult = await checkRateLimit(request, options);
      
      // If rate limited, return the rate limit response
      if (!rateLimitResult.success && rateLimitResult.response) {
        return rateLimitResult.response;
      }
      
      // Call original handler
      const response = await handler(request, context);
      
      // Add rate limit headers to response
      if (response instanceof NextResponse) {
        Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      }
      
      return response;
    };
  };
}

// HOC for React Server Components
export function withRateLimitCheck(
  Component: any,
  options: RateLimitOptions = {}
) {
  return async function RateLimitedComponent(props: any) {
    // This would be used in server components where you have access to request
    // Implementation depends on how you want to handle rate limiting in RSC
    // Note: JSX not supported in .ts files, would need to be .tsx
    return Component(props);
  };
}

// Utility functions for common patterns

// Authentication endpoint rate limiting
export async function checkAuthRateLimit(request: NextRequest) {
  return checkRateLimit(request, {
    rule: '/api/auth/*',
    enableCaptcha: true,
  });
}

// Contact form rate limiting
export async function checkContactRateLimit(request: NextRequest) {
  return checkRateLimit(request, {
    rule: '/api/contact',
    enableCaptcha: true,
  });
}

// API endpoint rate limiting with user tiers
export async function checkApiRateLimit(
  request: NextRequest,
  userTier: 'free' | 'premium' | 'admin' = 'free'
) {
  return checkRateLimit(request, {
    userTier,
    enableCaptcha: userTier === 'free',
  });
}

// Admin endpoint rate limiting
export async function checkAdminRateLimit(request: NextRequest) {
  return checkRateLimit(request, {
    rule: '/api/admin/*',
    userTier: 'admin',
  });
}

// Bulk operation rate limiting
export async function checkBulkOperationRateLimit(
  request: NextRequest,
  operationCount: number
) {
  return checkRateLimit(request, {
    customLimits: [
      { interval: 60 * 1000, limit: Math.max(1, Math.floor(100 / operationCount)) },
      { interval: 60 * 60 * 1000, limit: Math.max(10, Math.floor(1000 / operationCount)) },
    ],
  });
}

// Search rate limiting with burst allowance
export async function checkSearchRateLimit(request: NextRequest) {
  return checkRateLimit(request, {
    customLimits: [
      { interval: 1000, limit: 2 }, // 2 per second
      { interval: 60 * 1000, limit: 30 }, // 30 per minute
      { interval: 60 * 60 * 1000, limit: 200 }, // 200 per hour
    ],
    enableCaptcha: true,
  });
}

// Payment/checkout rate limiting (very strict)
export async function checkPaymentRateLimit(request: NextRequest) {
  return checkRateLimit(request, {
    customLimits: [
      { interval: 60 * 1000, limit: 2 }, // 2 per minute
      { interval: 60 * 60 * 1000, limit: 10 }, // 10 per hour
      { interval: 24 * 60 * 60 * 1000, limit: 50 }, // 50 per day
    ],
    enableCaptcha: true,
  });
}

// File upload rate limiting
export async function checkUploadRateLimit(
  request: NextRequest,
  fileSize: number,
  maxSizePerHour: number = 100 * 1024 * 1024 // 100MB default
) {
  // Calculate limits based on file size
  const hourlyLimit = Math.max(1, Math.floor(maxSizePerHour / fileSize));
  const minuteLimit = Math.max(1, Math.floor(hourlyLimit / 60));
  
  return checkRateLimit(request, {
    customLimits: [
      { interval: 60 * 1000, limit: minuteLimit },
      { interval: 60 * 60 * 1000, limit: hourlyLimit },
    ],
  });
}

// Geographic rate limiting (if you have geo info)
export async function checkGeoRateLimit(
  request: NextRequest,
  country: string,
  strictCountries: string[] = ['CN', 'RU', 'KP']
) {
  const isStrictCountry = strictCountries.includes(country.toUpperCase());
  
  return checkRateLimit(request, {
    customLimits: isStrictCountry ? [
      { interval: 60 * 1000, limit: 10 }, // Stricter limits
      { interval: 60 * 60 * 1000, limit: 50 },
    ] : undefined,
    enableCaptcha: isStrictCountry,
  });
}

// Example API route implementation
/*
// app/api/contact/route.ts
import { NextRequest } from 'next/server';
import { checkContactRateLimit } from '@/lib/rate-limit/api-integration';

export async function POST(request: NextRequest) {
  // Check rate limit
  const rateLimitResult = await checkContactRateLimit(request);
  
  if (!rateLimitResult.success) {
    return rateLimitResult.response;
  }
  
  // Process contact form
  // ... your business logic here
  
  return NextResponse.json({ success: true }, {
    headers: rateLimitResult.headers
  });
}
*/

// Example with decorator
/*
// app/api/products/route.ts
import { withRateLimit } from '@/lib/rate-limit/api-integration';

export const GET = withRateLimit({
  rule: '/api/products/*',
  userTier: 'free'
})(async function(request: NextRequest) {
  // Your API logic here
  return NextResponse.json({ products: [] });
});
*/