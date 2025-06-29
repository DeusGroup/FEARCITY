/**
 * Rate Limiting Analytics API Route v0.1.6
 * Provides data for the monitoring dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkAdminRateLimit } from '@/lib/rate-limit/api-integration';
import { securityManager } from '@/lib/rate-limit/security';

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface AnalyticsQuery {
  timeRange: '1h' | '24h' | '7d';
  endpoint?: string;
  identifier?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check admin rate limits
    const rateLimitResult = await checkAdminRateLimit(request);
    if (!rateLimitResult.success) {
      return rateLimitResult.response;
    }

    const body: AnalyticsQuery = await request.json();
    const { timeRange = '1h', endpoint, identifier } = body;

    // Calculate time window
    const now = new Date();
    const timeWindows = {
      '1h': new Date(now.getTime() - 60 * 60 * 1000),
      '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    };
    const since = timeWindows[timeRange];

    // Build base queries
    let logsQuery = supabase
      .from('rate_limit_logs')
      .select('*')
      .gte('created_at', since.toISOString());

    let blocksQuery = supabase
      .from('rate_limit_blocks')
      .select('*')
      .gte('created_at', since.toISOString());

    // Add filters if specified
    if (endpoint) {
      logsQuery = logsQuery.eq('endpoint', endpoint);
    }
    if (identifier) {
      logsQuery = logsQuery.eq('identifier', identifier);
      blocksQuery = blocksQuery.eq('identifier', identifier);
    }

    // Execute queries in parallel
    const [
      logsResult,
      blocksResult,
      endpointsResult,
      recentActivityResult
    ] = await Promise.all([
      logsQuery,
      blocksQuery,
      getTopEndpoints(since, endpoint),
      getRecentActivity(since, timeRange),
    ]);

    if (logsResult.error) {
      throw new Error(`Logs query failed: ${logsResult.error.message}`);
    }
    if (blocksResult.error) {
      throw new Error(`Blocks query failed: ${blocksResult.error.message}`);
    }

    const logs = logsResult.data || [];
    const blocks = blocksResult.data || [];

    // Calculate statistics
    const totalRequests = logs.length;
    const blockedRequests = logs.filter(log => !log.allowed).length;
    const blockRate = totalRequests > 0 ? ((blockedRequests / totalRequests) * 100).toFixed(2) : '0.00';

    // Get top endpoints with request counts
    const topEndpoints = endpointsResult.data || [];

    // Get recent activity for charts
    const recentActivity = recentActivityResult.data || [];

    // Calculate threat level
    const threatLevel = calculateThreatLevel(blockedRequests, totalRequests, blocks.length);

    // Get active blocks count
    const activeBlocks = await getActiveBlocksCount();

    // Get violations by IP
    const violationsByIP = await getViolationsByIP(since);

    // Get security threats from security manager
    const securityReport = securityManager.generateSecurityReport(identifier);

    // Response data
    const stats = {
      totalRequests,
      blockedRequests,
      blockRate,
      topEndpoints,
      timeRange,
      recentActivity,
      threatLevel,
      activeBlocks,
      violationsByIP,
    };

    const response = NextResponse.json({
      success: true,
      stats,
      threats: securityReport.threats,
      recommendations: securityReport.recommendations,
      riskScore: securityReport.riskScore,
    });

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;

  } catch (error) {
    console.error('Analytics API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch analytics data',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// Helper function to get top endpoints
async function getTopEndpoints(since: Date, endpointFilter?: string) {
  let query = supabase
    .from('rate_limit_logs')
    .select('endpoint, allowed, requests')
    .gte('created_at', since.toISOString());

  if (endpointFilter) {
    query = query.eq('endpoint', endpointFilter);
  }

  const { data, error } = await query;
  
  if (error) {
    return { data: [], error };
  }

  // Aggregate by endpoint
  const endpointStats = (data || []).reduce((acc: any, log: any) => {
    const endpoint = log.endpoint;
    if (!acc[endpoint]) {
      acc[endpoint] = {
        endpoint,
        requests: 0,
        blocked: 0,
      };
    }
    
    acc[endpoint].requests += log.requests || 1;
    if (!log.allowed) {
      acc[endpoint].blocked += log.requests || 1;
    }
    
    return acc;
  }, {});

  // Convert to array and sort by total requests
  const topEndpoints = Object.values(endpointStats)
    .sort((a: any, b: any) => b.requests - a.requests)
    .slice(0, 10);

  return { data: topEndpoints, error: null };
}

// Helper function to get recent activity for charts
async function getRecentActivity(since: Date, timeRange: string) {
  // Determine bucket size based on time range
  const bucketMinutes = {
    '1h': 5,    // 5-minute buckets
    '24h': 60,  // 1-hour buckets
    '7d': 360,  // 6-hour buckets
  }[timeRange] || 60;

  try {
    const { data, error } = await supabase.rpc('get_rate_limit_activity', {
      since_time: since.toISOString(),
      bucket_minutes: bucketMinutes
    });

    if (error) {
      console.error('Recent activity query error:', error);
      return { data: [], error };
    }

    return { data: data || [], error: null };
  } catch (err) {
    // Fallback to simple aggregation if RPC function doesn't exist
    const { data, error } = await supabase
      .from('rate_limit_logs')
      .select('created_at, allowed, requests')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      return { data: [], error };
    }

    // Manual bucketing
    const buckets: Record<string, { timestamp: number; requests: number; blocked: number }> = {};
    const bucketSizeMs = bucketMinutes * 60 * 1000;

    (data || []).forEach((log: any) => {
      const timestamp = new Date(log.created_at).getTime();
      const bucketStart = Math.floor(timestamp / bucketSizeMs) * bucketSizeMs;
      const bucketKey = bucketStart.toString();

      if (!buckets[bucketKey]) {
        buckets[bucketKey] = {
          timestamp: bucketStart,
          requests: 0,
          blocked: 0,
        };
      }

      const requestCount = log.requests || 1;
      buckets[bucketKey].requests += requestCount;
      
      if (!log.allowed) {
        buckets[bucketKey].blocked += requestCount;
      }
    });

    const activity = Object.values(buckets).sort((a, b) => a.timestamp - b.timestamp);
    return { data: activity, error: null };
  }
}

// Helper function to calculate threat level
function calculateThreatLevel(
  blockedRequests: number,
  totalRequests: number,
  activeBlocks: number
): 'low' | 'medium' | 'high' | 'critical' {
  const blockRate = totalRequests > 0 ? (blockedRequests / totalRequests) * 100 : 0;
  
  if (blockRate > 50 || activeBlocks > 20) {
    return 'critical';
  } else if (blockRate > 20 || activeBlocks > 10) {
    return 'high';
  } else if (blockRate > 5 || activeBlocks > 5) {
    return 'medium';
  } else {
    return 'low';
  }
}

// Helper function to get active blocks count
async function getActiveBlocksCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('rate_limit_blocks')
      .select('*', { count: 'exact', head: true })
      .gt('expires_at', new Date().toISOString());

    if (error) {
      console.error('Active blocks count error:', error);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.error('Active blocks count error:', err);
    return 0;
  }
}

// Helper function to get violations by IP
async function getViolationsByIP(since: Date): Promise<Array<{
  ip: string;
  violations: number;
  lastSeen: number;
}>> {
  try {
    const { data, error } = await supabase
      .from('rate_limit_logs')
      .select('identifier, created_at, allowed')
      .gte('created_at', since.toISOString())
      .eq('allowed', false)
      .like('identifier', 'ip:%');

    if (error) {
      console.error('Violations by IP error:', error);
      return [];
    }

    // Aggregate violations by IP
    const ipViolations: Record<string, { violations: number; lastSeen: number }> = {};

    (data || []).forEach((log: any) => {
      const ip = log.identifier.replace('ip:', '');
      const timestamp = new Date(log.created_at).getTime();

      if (!ipViolations[ip]) {
        ipViolations[ip] = {
          violations: 0,
          lastSeen: timestamp,
        };
      }

      ipViolations[ip].violations += 1;
      ipViolations[ip].lastSeen = Math.max(ipViolations[ip].lastSeen, timestamp);
    });

    // Convert to array and sort by violations
    return Object.entries(ipViolations)
      .map(([ip, stats]) => ({
        ip,
        violations: stats.violations,
        lastSeen: stats.lastSeen,
      }))
      .sort((a, b) => b.violations - a.violations)
      .slice(0, 20);

  } catch (err) {
    console.error('Violations by IP error:', err);
    return [];
  }
}

// Handle GET requests for simple analytics
export async function GET(request: NextRequest) {
  try {
    // Check admin rate limits
    const rateLimitResult = await checkAdminRateLimit(request);
    if (!rateLimitResult.success) {
      return rateLimitResult.response;
    }

    const url = new URL(request.url);
    const timeRange = (url.searchParams.get('range') as '1h' | '24h' | '7d') || '1h';

    // Use the POST handler with default parameters
    const mockRequest = new NextRequest(request.url, {
      method: 'POST',
      headers: request.headers,
      body: JSON.stringify({ timeRange }),
    });

    return POST(mockRequest);

  } catch (error) {
    console.error('Analytics GET error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch analytics data',
    }, { status: 500 });
  }
}