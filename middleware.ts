/**
 * Next.js Middleware with Rate Limiting v0.1.6
 * Protects all routes with IP-based rate limiting and security features
 */

import { NextRequest, NextResponse } from 'next/server';
import { rateLimitConfig, getRuleForPath, isWhitelisted, isBlacklisted, isBlockedUserAgent } from './lib/rate-limit/config';

// Rate limiting data structures for edge runtime
interface RateLimitData {
  requests: number;
  resetTime: number;
  violations: number;
  blocked: boolean;
  blockExpiry?: number;
}

// In-memory store for edge runtime (automatically distributed across edge locations)
const rateLimitStore = new Map<string, RateLimitData>();

// Get client IP address
function getClientIP(request: NextRequest): string {
  // Check various headers for real IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwarded) return forwarded.split(',')[0].trim();
  
  return request.ip || 'unknown';
}

// Generate rate limit key
function generateRateLimitKey(ip: string, path: string, window: number): string {
  const windowStart = Math.floor(Date.now() / window) * window;
  return `${ip}:${path}:${windowStart}`;
}

// Check if request should be rate limited
function shouldRateLimit(request: NextRequest): boolean {
  const pathname = request.nextUrl.pathname;
  
  // Skip rate limiting for static assets in production
  if (pathname.startsWith('/_next/') || 
      pathname.startsWith('/favicon') ||
      pathname.includes('.') && !pathname.startsWith('/api/')) {
    return false;
  }
  
  return rateLimitConfig.global.enabled;
}

// Security checks
function performSecurityChecks(request: NextRequest, ip: string): NextResponse | null {
  const userAgent = request.headers.get('user-agent') || '';
  
  // Check blacklist
  if (isBlacklisted(ip)) {
    console.warn(`Blocked blacklisted IP: ${ip}`);
    return new NextResponse('Access Denied', { 
      status: 403,
      headers: {
        'X-RateLimit-Reason': 'IP blacklisted',
      },
    });
  }
  
  // Check blocked user agents
  if (isBlockedUserAgent(userAgent)) {
    console.warn(`Blocked user agent from ${ip}: ${userAgent}`);
    return new NextResponse('Access Denied', { 
      status: 403,
      headers: {
        'X-RateLimit-Reason': 'User agent blocked',
      },
    });
  }
  
  return null;
}

// Rate limiting logic for edge runtime
function checkRateLimit(ip: string, path: string): {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  reason?: string;
} {
  const rule = getRuleForPath(path);
  const now = Date.now();
  
  // Check each time window
  for (const window of rule.windows) {
    const key = generateRateLimitKey(ip, path, window.interval);
    const data = rateLimitStore.get(key);
    const windowStart = Math.floor(now / window.interval) * window.interval;
    const resetTime = windowStart + window.interval;
    
    if (!data || data.resetTime < now) {
      // Initialize new window
      rateLimitStore.set(key, {
        requests: 1,
        resetTime,
        violations: 0,
        blocked: false,
      });
      
      return {
        allowed: true,
        limit: window.limit,
        remaining: window.limit - 1,
        resetTime,
      };
    }
    
    // Check if blocked
    if (data.blocked && data.blockExpiry && data.blockExpiry > now) {
      return {
        allowed: false,
        limit: window.limit,
        remaining: 0,
        resetTime: data.blockExpiry,
        retryAfter: Math.ceil((data.blockExpiry - now) / 1000),
        reason: 'Temporarily blocked due to rate limit violations',
      };
    }
    
    // Increment request count
    data.requests++;
    
    if (data.requests > window.limit) {
      // Rate limit exceeded
      data.violations = (data.violations || 0) + 1;
      
      // Apply exponential backoff for repeat offenders
      if (rateLimitConfig.security.exponentialBackoff.enabled && data.violations >= 3) {
        const delay = Math.min(
          1000 * Math.pow(rateLimitConfig.security.exponentialBackoff.multiplier, data.violations - 3),
          rateLimitConfig.security.exponentialBackoff.maxDelay
        );
        
        data.blocked = true;
        data.blockExpiry = now + delay;
        
        console.warn(`IP ${ip} blocked for ${delay}ms after ${data.violations} violations`);
      }
      
      rateLimitStore.set(key, data);
      
      return {
        allowed: false,
        limit: window.limit,
        remaining: 0,
        resetTime,
        retryAfter: Math.ceil((resetTime - now) / 1000),
        reason: `Rate limit exceeded: ${data.requests}/${window.limit} requests`,
      };
    }
    
    rateLimitStore.set(key, data);
    
    return {
      allowed: true,
      limit: window.limit,
      remaining: window.limit - data.requests,
      resetTime,
    };
  }
  
  // Default allow if no windows defined
  return {
    allowed: true,
    limit: 1000,
    remaining: 999,
    resetTime: now + 60000,
  };
}

// Cleanup old entries (runs periodically)
function cleanupRateLimitStore(): void {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [key, data] of rateLimitStore.entries()) {
    if (data.resetTime < now && (!data.blockExpiry || data.blockExpiry < now)) {
      rateLimitStore.delete(key);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`Cleaned up ${cleanedCount} expired rate limit entries`);
  }
}

// Main middleware function
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const ip = getClientIP(request);
  
  // Skip rate limiting for certain paths
  if (!shouldRateLimit(request)) {
    return NextResponse.next();
  }
  
  // Skip if whitelisted
  if (isWhitelisted(ip)) {
    return NextResponse.next();
  }
  
  // Perform security checks
  const securityResponse = performSecurityChecks(request, ip);
  if (securityResponse) {
    return securityResponse;
  }
  
  // Check rate limits
  const rateLimitResult = checkRateLimit(ip, pathname);
  
  // Add rate limit headers to response
  const response = rateLimitResult.allowed 
    ? NextResponse.next()
    : new NextResponse('Too Many Requests', { status: 429 });
  
  // Set rate limit headers
  response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
  response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
  response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());
  
  if (rateLimitResult.retryAfter) {
    response.headers.set('Retry-After', rateLimitResult.retryAfter.toString());
  }
  
  if (rateLimitResult.reason) {
    response.headers.set('X-RateLimit-Reason', rateLimitResult.reason);
  }
  
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Log rate limit violations
  if (!rateLimitResult.allowed && rateLimitConfig.monitoring.enableLogging) {
    console.warn(`Rate limit violation from ${ip} on ${pathname}: ${rateLimitResult.reason}`);
  }
  
  // Periodic cleanup (run every ~100 requests)
  if (Math.random() < 0.01) {
    cleanupRateLimitStore();
  }
  
  return response;
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (static assets)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};