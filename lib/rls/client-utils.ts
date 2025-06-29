/**
 * Fear City Cycles RLS Client Utilities v0.1.7
 * Helper functions for working with RLS-protected Supabase client
 */

import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

// =============================================================================
// TYPES
// =============================================================================

export interface RLSContext {
  user: User | null;
  role: 'anon' | 'authenticated' | 'admin' | 'service_role';
  tenant?: string;
}

export interface RLSClientOptions {
  supabaseUrl: string;
  anonKey: string;
  serviceRoleKey?: string;
  enableDebug?: boolean;
}

// =============================================================================
// RLS-AWARE SUPABASE CLIENT
// =============================================================================

export class RLSSupabaseClient {
  private anonClient: SupabaseClient;
  private serviceClient?: SupabaseClient;
  private debug: boolean;

  constructor(options: RLSClientOptions) {
    this.debug = options.enableDebug || false;
    
    // Create anonymous/authenticated client
    this.anonClient = createClient(options.supabaseUrl, options.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });

    // Create service role client if key provided
    if (options.serviceRoleKey) {
      this.serviceClient = createClient(
        options.supabaseUrl, 
        options.serviceRoleKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );
    }

    this.log('RLS Supabase client initialized');
  }

  /**
   * Get the appropriate client based on context
   */
  getClient(useServiceRole: boolean = false): SupabaseClient {
    if (useServiceRole && this.serviceClient) {
      this.log('Using service role client (RLS bypass)');
      return this.serviceClient;
    }
    
    this.log('Using authenticated client (RLS enforced)');
    return this.anonClient;
  }

  /**
   * Get current RLS context
   */
  async getRLSContext(): Promise<RLSContext> {
    const { data: { user } } = await this.anonClient.auth.getUser();
    
    const context: RLSContext = {
      user,
      role: user ? 'authenticated' : 'anon',
    };

    if (user) {
      // Check for admin role
      const isAdmin = this.isAdmin(user);
      if (isAdmin) {
        context.role = 'admin';
      }

      // Extract tenant from metadata
      context.tenant = this.getUserTenant(user);
    }

    this.log('RLS Context:', context);
    return context;
  }

  /**
   * Check if user has admin role
   */
  isAdmin(user: User): boolean {
    const appMetadata = user.app_metadata || {};
    const userMetadata = user.user_metadata || {};
    
    return (
      appMetadata.role === 'admin' ||
      appMetadata.role === 'super_admin' ||
      userMetadata.role === 'admin'
    );
  }

  /**
   * Get user's tenant/organization
   */
  getUserTenant(user: User): string | undefined {
    const appMetadata = user.app_metadata || {};
    const userMetadata = user.user_metadata || {};
    
    return appMetadata.tenant_id || userMetadata.tenant_id;
  }

  /**
   * Execute query with RLS context verification
   */
  async executeWithRLS<T>(
    operation: (client: SupabaseClient) => Promise<T>,
    options: {
      requireAuth?: boolean;
      requireAdmin?: boolean;
      bypassRLS?: boolean;
    } = {}
  ): Promise<T> {
    const context = await this.getRLSContext();

    // Check authentication requirements
    if (options.requireAuth && !context.user) {
      throw new Error('Authentication required');
    }

    if (options.requireAdmin && context.role !== 'admin') {
      throw new Error('Admin privileges required');
    }

    // Select appropriate client
    const client = this.getClient(options.bypassRLS);
    
    this.log('Executing operation with RLS context:', {
      role: context.role,
      bypassRLS: options.bypassRLS,
    });

    return await operation(client);
  }

  /**
   * Safe query wrapper that handles RLS errors gracefully
   */
  async safeQuery<T>(
    query: (client: SupabaseClient) => Promise<{ data: T | null; error: any }>,
    fallbackValue: T | null = null
  ): Promise<{ data: T | null; error: any; rlsBlocked?: boolean }> {
    try {
      const result = await query(this.anonClient);
      
      if (result.error) {
        // Check if error is RLS-related
        const isRLSError = this.isRLSError(result.error);
        this.log('Query error:', result.error, { rlsBlocked: isRLSError });
        
        return {
          ...result,
          rlsBlocked: isRLSError,
        };
      }

      return result;
    } catch (error) {
      const isRLSError = this.isRLSError(error);
      this.log('Query exception:', error, { rlsBlocked: isRLSError });
      
      return {
        data: fallbackValue,
        error,
        rlsBlocked: isRLSError,
      };
    }
  }

  /**
   * Check if error is RLS-related
   */
  private isRLSError(error: any): boolean {
    if (!error) return false;
    
    const message = error.message || error.toString();
    return (
      message.includes('permission denied') ||
      message.includes('row-level security') ||
      message.includes('policy') ||
      error.code === '42501' // Insufficient privilege
    );
  }

  /**
   * Validate table access for current user
   */
  async validateTableAccess(
    tableName: string,
    operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' = 'SELECT'
  ): Promise<{
    hasAccess: boolean;
    error?: string;
    context: RLSContext;
  }> {
    const context = await this.getRLSContext();
    
    try {
      let testQuery;
      
      switch (operation) {
        case 'SELECT':
          testQuery = this.anonClient
            .from(tableName)
            .select('*', { count: 'exact', head: true });
          break;
        case 'INSERT':
          // Use a dry-run approach for testing insert access
          testQuery = this.anonClient
            .from(tableName)
            .insert({}, { returning: 'minimal' });
          break;
        default:
          throw new Error(`Validation for ${operation} not implemented`);
      }

      const result = await testQuery;
      
      return {
        hasAccess: !result.error,
        error: result.error?.message,
        context,
      };
    } catch (error: any) {
      return {
        hasAccess: false,
        error: error.message,
        context,
      };
    }
  }

  /**
   * Get user's accessible records count for a table
   */
  async getAccessibleCount(tableName: string): Promise<{
    count: number;
    error?: string;
  }> {
    const { count, error } = await this.anonClient
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    return {
      count: count || 0,
      error: error?.message,
    };
  }

  /**
   * Debug logging
   */
  private log(message: string, ...args: any[]) {
    if (this.debug) {
      console.log(`[RLS Client] ${message}`, ...args);
    }
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create RLS-aware Supabase client
 */
export function createRLSClient(options: RLSClientOptions): RLSSupabaseClient {
  return new RLSSupabaseClient(options);
}

/**
 * Query builder with RLS context
 */
export class RLSQueryBuilder {
  private client: RLSSupabaseClient;
  private tableName: string;

  constructor(client: RLSSupabaseClient, tableName: string) {
    this.client = client;
    this.tableName = tableName;
  }

  /**
   * Select with automatic RLS context
   */
  async select(
    columns: string = '*',
    options: { requireAuth?: boolean; requireAdmin?: boolean } = {}
  ) {
    return this.client.executeWithRLS(
      (client) => client.from(this.tableName).select(columns),
      options
    );
  }

  /**
   * Insert with RLS validation
   */
  async insert(
    data: any,
    options: { requireAuth?: boolean; requireAdmin?: boolean } = {}
  ) {
    return this.client.executeWithRLS(
      (client) => client.from(this.tableName).insert(data),
      { requireAuth: true, ...options }
    );
  }

  /**
   * Update with RLS validation
   */
  async update(
    data: any,
    filter: any,
    options: { requireAuth?: boolean; requireAdmin?: boolean } = {}
  ) {
    return this.client.executeWithRLS(
      (client) => client.from(this.tableName).update(data).match(filter),
      { requireAuth: true, ...options }
    );
  }

  /**
   * Delete with RLS validation
   */
  async delete(
    filter: any,
    options: { requireAuth?: boolean; requireAdmin?: boolean } = {}
  ) {
    return this.client.executeWithRLS(
      (client) => client.from(this.tableName).delete().match(filter),
      { requireAuth: true, ...options }
    );
  }
}

/**
 * React hook for RLS context
 */
export function useRLSContext(client: RLSSupabaseClient) {
  const [context, setContext] = React.useState<RLSContext | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;

    const loadContext = async () => {
      try {
        const ctx = await client.getRLSContext();
        if (mounted) {
          setContext(ctx);
        }
      } catch (error) {
        console.error('Failed to load RLS context:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadContext();

    return () => {
      mounted = false;
    };
  }, [client]);

  return { context, loading };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if user can access specific resource
 */
export async function checkResourceAccess(
  client: RLSSupabaseClient,
  tableName: string,
  resourceId: string,
  operation: 'read' | 'write' | 'delete' = 'read'
): Promise<boolean> {
  try {
    const result = await client.safeQuery(
      (supabaseClient) => 
        supabaseClient
          .from(tableName)
          .select('id')
          .eq('id', resourceId)
          .single()
    );

    return !result.error && result.data !== null;
  } catch {
    return false;
  }
}

/**
 * Get user's role from current session
 */
export async function getCurrentUserRole(
  client: RLSSupabaseClient
): Promise<'anon' | 'authenticated' | 'admin'> {
  const context = await client.getRLSContext();
  return context.role;
}

/**
 * Validate RLS policy effectiveness
 */
export async function validateRLSPolicies(
  client: RLSSupabaseClient,
  tables: string[]
): Promise<{
  table: string;
  hasAccess: boolean;
  recordCount: number;
  error?: string;
}[]> {
  const results = [];

  for (const table of tables) {
    try {
      const validation = await client.validateTableAccess(table);
      const countResult = await client.getAccessibleCount(table);

      results.push({
        table,
        hasAccess: validation.hasAccess,
        recordCount: countResult.count,
        error: validation.error || countResult.error,
      });
    } catch (error: any) {
      results.push({
        table,
        hasAccess: false,
        recordCount: 0,
        error: error.message,
      });
    }
  }

  return results;
}

// =============================================================================
// EXPORTS
// =============================================================================

export default RLSSupabaseClient;