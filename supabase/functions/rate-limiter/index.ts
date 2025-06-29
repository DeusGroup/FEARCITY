/**
 * Supabase Edge Function: Advanced Rate Limiter v0.1.6
 * Serverless rate limiting with distributed storage and analytics
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

// Rate limiting configuration for Edge Function
interface RateLimitConfig {
  windows: Array<{
    interval: number; // milliseconds
    limit: number;
  }>;
  blockDuration?: number; // milliseconds
  violations?: {
    threshold: number;
    multiplier: number;
    maxBlock: number;
  };
}

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  reason?: string;
  metadata?: any;
}

// Edge Function configuration
const config = {
  endpoints: {
    '/api/auth/login': {
      windows: [
        { interval: 60 * 1000, limit: 5 }, // 5 attempts per minute
        { interval: 15 * 60 * 1000, limit: 10 }, // 10 attempts per 15 minutes
      ],
      blockDuration: 15 * 60 * 1000, // 15 minutes
      violations: {
        threshold: 3,
        multiplier: 2,
        maxBlock: 60 * 60 * 1000, // 1 hour max
      },
    },
    '/api/contact': {
      windows: [
        { interval: 60 * 1000, limit: 2 },
        { interval: 60 * 60 * 1000, limit: 10 },
      ],
    },
    '/api/newsletter': {
      windows: [
        { interval: 60 * 1000, limit: 1 },
        { interval: 24 * 60 * 60 * 1000, limit: 3 },
      ],
    },
    default: {
      windows: [
        { interval: 60 * 1000, limit: 100 },
        { interval: 60 * 60 * 1000, limit: 1000 },
      ],
    },
  },
  security: {
    blacklist: new Set<string>(),
    whitelist: new Set(['127.0.0.1', '::1']),
    blockedUserAgents: [
      'curl', 'wget', 'python-requests', 'scrapy', 
      'bot', 'spider', 'crawler'
    ],
  },
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Get client IP from request
function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwarded) return forwarded.split(',')[0].trim();
  
  return 'unknown';
}

// Get rate limit configuration for endpoint
function getEndpointConfig(path: string): RateLimitConfig {
  // Find matching endpoint pattern
  for (const [pattern, config] of Object.entries(config.endpoints)) {
    if (pattern === 'default') continue;
    
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    if (regex.test(path)) {
      return config as RateLimitConfig;
    }
  }
  
  return config.endpoints.default as RateLimitConfig;
}

// Security checks
function performSecurityChecks(request: Request, ip: string): Response | null {
  const userAgent = request.headers.get('user-agent') || '';
  
  // Check blacklist
  if (config.security.blacklist.has(ip)) {
    return new Response('Access Denied', {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Reason': 'IP blacklisted',
      },
    });
  }
  
  // Check whitelist
  if (config.security.whitelist.has(ip)) {
    return null; // Allow whitelisted IPs
  }
  
  // Check blocked user agents
  const ua = userAgent.toLowerCase();
  if (config.security.blockedUserAgents.some(blocked => ua.includes(blocked))) {
    return new Response('Access Denied', {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Reason': 'User agent blocked',
      },
    });
  }
  
  return null;
}

// Store rate limit data in Supabase
async function storeRateLimitData(
  identifier: string,
  endpoint: string,
  requests: number,
  windowStart: number,
  allowed: boolean
): Promise<void> {
  try {
    await supabase
      .from('rate_limit_logs')
      .insert({
        identifier,
        endpoint,
        requests,
        window_start: new Date(windowStart),
        allowed,
        created_at: new Date(),
      });
  } catch (error) {
    console.error('Failed to store rate limit data:', error);
  }
}

// Get current rate limit status from database
async function getRateLimitStatus(
  identifier: string,
  endpoint: string,
  window: number
): Promise<{ count: number; windowStart: number }> {
  const now = Date.now();
  const windowStart = Math.floor(now / window) * window;
  
  try {
    const { data, error } = await supabase
      .from('rate_limit_logs')
      .select('requests')
      .eq('identifier', identifier)
      .eq('endpoint', endpoint)
      .gte('window_start', new Date(windowStart))
      .single();
    
    if (error || !data) {
      return { count: 0, windowStart };
    }
    
    return { count: data.requests || 0, windowStart };
  } catch (error) {
    console.error('Failed to get rate limit status:', error);
    return { count: 0, windowStart };
  }
}

// Check if identifier is currently blocked
async function isBlocked(identifier: string): Promise<{
  blocked: boolean;
  blockExpiry?: number;
  reason?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('rate_limit_blocks')
      .select('*')
      .eq('identifier', identifier)
      .gt('expires_at', new Date())
      .single();
    
    if (error || !data) {
      return { blocked: false };
    }
    
    return {
      blocked: true,
      blockExpiry: new Date(data.expires_at).getTime(),
      reason: data.reason,
    };
  } catch (error) {
    console.error('Failed to check block status:', error);
    return { blocked: false };
  }
}

// Block an identifier
async function blockIdentifier(
  identifier: string,
  duration: number,
  reason: string
): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + duration);
    
    await supabase
      .from('rate_limit_blocks')
      .upsert({
        identifier,
        expires_at: expiresAt,
        reason,
        created_at: new Date(),
      });
  } catch (error) {
    console.error('Failed to block identifier:', error);
  }
}

// Main rate limiting logic
async function checkRateLimit(
  identifier: string,
  endpoint: string,
  endpointConfig: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now();
  
  // Check if already blocked
  const blockStatus = await isBlocked(identifier);
  if (blockStatus.blocked) {
    return {
      allowed: false,
      limit: 0,
      remaining: 0,
      resetTime: blockStatus.blockExpiry!,
      retryAfter: Math.ceil((blockStatus.blockExpiry! - now) / 1000),
      reason: blockStatus.reason,
    };
  }
  
  // Check each time window
  for (const window of endpointConfig.windows) {
    const status = await getRateLimitStatus(identifier, endpoint, window.interval);
    const currentCount = status.count + 1; // Include this request
    
    if (currentCount > window.limit) {
      // Rate limit exceeded
      const resetTime = status.windowStart + window.interval;
      const retryAfter = Math.ceil((resetTime - now) / 1000);
      
      // Store violation
      await storeRateLimitData(identifier, endpoint, currentCount, status.windowStart, false);
      
      // Check for blocking based on violations
      if (endpointConfig.violations) {
        const violations = await getViolationCount(identifier, endpointConfig.violations.threshold);
        
        if (violations >= endpointConfig.violations.threshold) {
          const blockDuration = Math.min(
            (endpointConfig.blockDuration || 60000) * 
            Math.pow(endpointConfig.violations.multiplier, violations - endpointConfig.violations.threshold),
            endpointConfig.violations.maxBlock
          );
          
          await blockIdentifier(
            identifier, 
            blockDuration, 
            `Exceeded rate limit ${violations} times`
          );
          
          return {
            allowed: false,
            limit: window.limit,
            remaining: 0,
            resetTime: now + blockDuration,
            retryAfter: Math.ceil(blockDuration / 1000),
            reason: `Blocked due to repeated violations`,
          };
        }
      }
      
      return {
        allowed: false,
        limit: window.limit,
        remaining: 0,
        resetTime,
        retryAfter,
        reason: `Rate limit exceeded: ${currentCount}/${window.limit}`,
      };
    }
    
    // Store successful request
    await storeRateLimitData(identifier, endpoint, currentCount, status.windowStart, true);
    
    return {
      allowed: true,
      limit: window.limit,
      remaining: window.limit - currentCount,
      resetTime: status.windowStart + window.interval,
    };
  }
  
  // Default allow
  return {
    allowed: true,
    limit: 1000,
    remaining: 999,
    resetTime: now + 60000,
  };
}

// Get violation count for identifier
async function getViolationCount(identifier: string, windowHours: number): Promise<number> {
  try {
    const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);
    
    const { count, error } = await supabase
      .from('rate_limit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('identifier', identifier)
      .eq('allowed', false)
      .gte('created_at', since);
    
    if (error) {
      console.error('Failed to get violation count:', error);
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    console.error('Failed to get violation count:', error);
    return 0;
  }
}

// Analytics and monitoring
async function getAnalytics(timeRange: string = '1h'): Promise<any> {
  const ranges = {
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
  };
  
  const since = new Date(Date.now() - (ranges[timeRange as keyof typeof ranges] || ranges['1h']));
  
  try {
    const [totalRequests, blockedRequests, topEndpoints] = await Promise.all([
      supabase
        .from('rate_limit_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', since),
      
      supabase
        .from('rate_limit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('allowed', false)
        .gte('created_at', since),
      
      supabase
        .from('rate_limit_logs')
        .select('endpoint, requests')
        .gte('created_at', since)
        .order('requests', { ascending: false })
        .limit(10),
    ]);
    
    return {
      totalRequests: totalRequests.count || 0,
      blockedRequests: blockedRequests.count || 0,
      blockRate: ((blockedRequests.count || 0) / Math.max(totalRequests.count || 1, 1) * 100).toFixed(2),
      topEndpoints: topEndpoints.data || [],
      timeRange,
    };
  } catch (error) {
    console.error('Failed to get analytics:', error);
    return {
      totalRequests: 0,
      blockedRequests: 0,
      blockRate: '0.00',
      topEndpoints: [],
      timeRange,
    };
  }
}

// Main Edge Function handler
serve(async (req: Request) => {
  const url = new URL(req.url);
  const method = req.method;
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  };
  
  // Handle preflight requests
  if (method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    // Analytics endpoint
    if (url.pathname === '/analytics' && method === 'GET') {
      const timeRange = url.searchParams.get('range') || '1h';
      const analytics = await getAnalytics(timeRange);
      
      return new Response(JSON.stringify(analytics), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    }
    
    // Rate limiting check endpoint
    if (method === 'POST') {
      const body = await req.json();
      const { identifier, endpoint, userAgent } = body;
      
      if (!identifier || !endpoint) {
        return new Response(JSON.stringify({ error: 'Missing identifier or endpoint' }), {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        });
      }
      
      // Create mock request for security checks
      const mockRequest = new Request('https://example.com', {
        headers: { 'user-agent': userAgent || '' },
      });
      
      // Perform security checks
      const securityResponse = performSecurityChecks(mockRequest, identifier);
      if (securityResponse) {
        return new Response(securityResponse.body, {
          status: securityResponse.status,
          headers: {
            ...corsHeaders,
            ...Object.fromEntries(securityResponse.headers.entries()),
          },
        });
      }
      
      // Get endpoint configuration
      const endpointConfig = getEndpointConfig(endpoint);
      
      // Check rate limit
      const result = await checkRateLimit(identifier, endpoint, endpointConfig);
      
      const responseHeaders = {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.resetTime.toString(),
      };
      
      if (result.retryAfter) {
        responseHeaders['Retry-After'] = result.retryAfter.toString();
      }
      
      if (result.reason) {
        responseHeaders['X-RateLimit-Reason'] = result.reason;
      }
      
      return new Response(JSON.stringify(result), {
        status: result.allowed ? 200 : 429,
        headers: responseHeaders,
      });
    }
    
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
    
  } catch (error) {
    console.error('Edge function error:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      allowed: true, // Fail open for availability
      limit: 1000,
      remaining: 999,
      resetTime: Date.now() + 60000,
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
});