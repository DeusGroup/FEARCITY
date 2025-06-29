/**
 * Fear City Cycles RLS Audit and Monitoring Tools v0.1.7
 * TypeScript utilities for monitoring and auditing Row-Level Security
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface RLSCoverageReport {
  table_name: string;
  rls_enabled: boolean;
  policy_count: number;
  has_select_policy: boolean;
  has_insert_policy: boolean;
  has_update_policy: boolean;
  has_delete_policy: boolean;
}

export interface RLSTestResult {
  category: string;
  test_name: string;
  passed: boolean;
  error_message: string;
  execution_time: string;
}

export interface RLSVulnerability {
  vulnerability_type: string;
  test_description: string;
  is_vulnerable: boolean;
  details: string;
}

export interface RLSPerformanceMetric {
  table_name: string;
  operation: string;
  with_rls_ms: number;
  without_rls_ms: number;
  performance_impact_percent: number;
}

export interface RLSAuditLog {
  id: string;
  table_name: string;
  operation: string;
  user_id: string;
  user_role: string;
  row_id: string;
  old_data: any;
  new_data: any;
  created_at: string;
}

export interface RLSSecurityReport {
  coverage: RLSCoverageReport[];
  test_results: RLSTestResult[];
  vulnerabilities: RLSVulnerability[];
  performance_metrics: RLSPerformanceMetric[];
  audit_summary: {
    total_tables: number;
    protected_tables: number;
    unprotected_tables: string[];
    missing_policies: string[];
    security_score: number;
  };
}

// =============================================================================
// RLS AUDIT MANAGER CLASS
// =============================================================================

export class RLSAuditManager {
  private supabase: SupabaseClient;
  private serviceRoleKey: string;

  constructor(supabaseUrl: string, serviceRoleKey: string) {
    this.serviceRoleKey = serviceRoleKey;
    this.supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  /**
   * Get comprehensive RLS coverage report
   */
  async getRLSCoverage(): Promise<RLSCoverageReport[]> {
    const { data, error } = await this.supabase
      .rpc('check_rls_coverage');

    if (error) {
      throw new Error(`Failed to get RLS coverage: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Run comprehensive RLS test suite
   */
  async runRLSTests(): Promise<RLSTestResult[]> {
    const { data, error } = await this.supabase
      .rpc('run_comprehensive_rls_tests');

    if (error) {
      throw new Error(`Failed to run RLS tests: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Test for RLS vulnerabilities
   */
  async checkVulnerabilities(): Promise<RLSVulnerability[]> {
    const { data, error } = await this.supabase
      .rpc('test_rls_vulnerabilities');

    if (error) {
      throw new Error(`Failed to check vulnerabilities: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Measure RLS performance impact
   */
  async measurePerformance(): Promise<RLSPerformanceMetric[]> {
    const { data, error } = await this.supabase
      .rpc('measure_rls_performance');

    if (error) {
      throw new Error(`Failed to measure performance: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get recent audit logs
   */
  async getAuditLogs(
    limit: number = 100,
    table_filter?: string,
    user_filter?: string
  ): Promise<RLSAuditLog[]> {
    let query = this.supabase
      .from('rls_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (table_filter) {
      query = query.eq('table_name', table_filter);
    }

    if (user_filter) {
      query = query.eq('user_id', user_filter);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get audit logs: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Generate comprehensive security report
   */
  async generateSecurityReport(): Promise<RLSSecurityReport> {
    try {
      const [coverage, testResults, vulnerabilities, performanceMetrics] = 
        await Promise.all([
          this.getRLSCoverage(),
          this.runRLSTests(),
          this.checkVulnerabilities(),
          this.measurePerformance()
        ]);

      // Calculate security metrics
      const totalTables = coverage.length;
      const protectedTables = coverage.filter(t => t.rls_enabled).length;
      const unprotectedTables = coverage
        .filter(t => !t.rls_enabled)
        .map(t => t.table_name);
      
      const missingPolicies = coverage
        .filter(t => t.rls_enabled && t.policy_count === 0)
        .map(t => t.table_name);

      // Calculate security score (0-100)
      const securityScore = this.calculateSecurityScore(
        coverage, 
        testResults, 
        vulnerabilities
      );

      return {
        coverage,
        test_results: testResults,
        vulnerabilities,
        performance_metrics: performanceMetrics,
        audit_summary: {
          total_tables: totalTables,
          protected_tables: protectedTables,
          unprotected_tables,
          missing_policies: missingPolicies,
          security_score: securityScore
        }
      };
    } catch (error) {
      throw new Error(`Failed to generate security report: ${error}`);
    }
  }

  /**
   * Calculate overall security score
   */
  private calculateSecurityScore(
    coverage: RLSCoverageReport[],
    testResults: RLSTestResult[],
    vulnerabilities: RLSVulnerability[]
  ): number {
    if (coverage.length === 0) return 0;

    // RLS coverage score (40% of total)
    const protectedTablesRatio = coverage.filter(t => t.rls_enabled).length / coverage.length;
    const coverageScore = protectedTablesRatio * 40;

    // Policy completeness score (30% of total)
    const tablesWithPolicies = coverage.filter(t => t.policy_count > 0).length;
    const policyScore = (tablesWithPolicies / coverage.length) * 30;

    // Test results score (20% of total)
    const passedTests = testResults.filter(t => t.passed).length;
    const testScore = testResults.length > 0 ? (passedTests / testResults.length) * 20 : 0;

    // Vulnerability penalty (10% of total)
    const vulnerableCount = vulnerabilities.filter(v => v.is_vulnerable).length;
    const vulnerabilityPenalty = vulnerabilities.length > 0 ? 
      (vulnerableCount / vulnerabilities.length) * 10 : 0;

    const totalScore = coverageScore + policyScore + testScore - vulnerabilityPenalty;
    return Math.max(0, Math.min(100, Math.round(totalScore)));
  }

  /**
   * Validate RLS configuration for specific table
   */
  async validateTableRLS(tableName: string): Promise<{
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const coverage = await this.getRLSCoverage();
    const tableInfo = coverage.find(t => t.table_name === tableName);

    if (!tableInfo) {
      return {
        isValid: false,
        issues: [`Table '${tableName}' not found`],
        recommendations: ['Verify table name is correct']
      };
    }

    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check RLS is enabled
    if (!tableInfo.rls_enabled) {
      issues.push('RLS is not enabled');
      recommendations.push('Enable RLS: ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;');
    }

    // Check for policies
    if (tableInfo.policy_count === 0) {
      issues.push('No RLS policies defined');
      recommendations.push('Create appropriate policies for different operations');
    }

    // Check for basic CRUD policies
    if (!tableInfo.has_select_policy) {
      issues.push('Missing SELECT policy');
      recommendations.push('Add SELECT policy to control read access');
    }

    if (!tableInfo.has_insert_policy) {
      issues.push('Missing INSERT policy');
      recommendations.push('Add INSERT policy to control create access');
    }

    if (!tableInfo.has_update_policy) {
      issues.push('Missing UPDATE policy');
      recommendations.push('Add UPDATE policy to control modify access');
    }

    if (!tableInfo.has_delete_policy) {
      issues.push('Missing DELETE policy');
      recommendations.push('Add DELETE policy to control remove access');
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    };
  }

  /**
   * Monitor RLS policy effectiveness
   */
  async monitorPolicyEffectiveness(days: number = 7): Promise<{
    totalQueries: number;
    blockedQueries: number;
    blockRate: number;
    topBlockedTables: Array<{ table: string; blocks: number }>;
    suspiciousActivity: Array<{
      user_id: string;
      blocked_attempts: number;
      tables_accessed: string[];
    }>;
  }> {
    // This would require additional logging tables to track query attempts
    // For now, return mock data structure
    return {
      totalQueries: 0,
      blockedQueries: 0,
      blockRate: 0,
      topBlockedTables: [],
      suspiciousActivity: []
    };
  }

  /**
   * Export security report to different formats
   */
  async exportReport(
    format: 'json' | 'csv' | 'html' = 'json'
  ): Promise<string> {
    const report = await this.generateSecurityReport();

    switch (format) {
      case 'json':
        return JSON.stringify(report, null, 2);
      
      case 'csv':
        return this.convertToCSV(report);
      
      case 'html':
        return this.convertToHTML(report);
      
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Convert report to CSV format
   */
  private convertToCSV(report: RLSSecurityReport): string {
    const headers = [
      'Table Name',
      'RLS Enabled',
      'Policy Count',
      'Has Select',
      'Has Insert',
      'Has Update',
      'Has Delete'
    ];

    const rows = report.coverage.map(item => [
      item.table_name,
      item.rls_enabled,
      item.policy_count,
      item.has_select_policy,
      item.has_insert_policy,
      item.has_update_policy,
      item.has_delete_policy
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  /**
   * Convert report to HTML format
   */
  private convertToHTML(report: RLSSecurityReport): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Fear City Cycles RLS Security Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .score { font-size: 24px; font-weight: bold; color: ${report.audit_summary.security_score > 80 ? 'green' : report.audit_summary.security_score > 60 ? 'orange' : 'red'}; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .pass { color: green; }
        .fail { color: red; }
        .vulnerable { background-color: #ffebee; }
    </style>
</head>
<body>
    <h1>Fear City Cycles RLS Security Report</h1>
    <div class="score">Security Score: ${report.audit_summary.security_score}/100</div>
    
    <h2>Summary</h2>
    <ul>
        <li>Total Tables: ${report.audit_summary.total_tables}</li>
        <li>Protected Tables: ${report.audit_summary.protected_tables}</li>
        <li>Unprotected Tables: ${report.audit_summary.unprotected_tables.join(', ') || 'None'}</li>
        <li>Missing Policies: ${report.audit_summary.missing_policies.join(', ') || 'None'}</li>
    </ul>

    <h2>RLS Coverage</h2>
    <table>
        <tr>
            <th>Table</th>
            <th>RLS Enabled</th>
            <th>Policies</th>
            <th>SELECT</th>
            <th>INSERT</th>
            <th>UPDATE</th>
            <th>DELETE</th>
        </tr>
        ${report.coverage.map(item => `
        <tr>
            <td>${item.table_name}</td>
            <td>${item.rls_enabled ? '✓' : '✗'}</td>
            <td>${item.policy_count}</td>
            <td>${item.has_select_policy ? '✓' : '✗'}</td>
            <td>${item.has_insert_policy ? '✓' : '✗'}</td>
            <td>${item.has_update_policy ? '✓' : '✗'}</td>
            <td>${item.has_delete_policy ? '✓' : '✗'}</td>
        </tr>
        `).join('')}
    </table>

    <h2>Test Results</h2>
    <table>
        <tr>
            <th>Category</th>
            <th>Test</th>
            <th>Result</th>
            <th>Error</th>
        </tr>
        ${report.test_results.map(test => `
        <tr>
            <td>${test.category}</td>
            <td>${test.test_name}</td>
            <td class="${test.passed ? 'pass' : 'fail'}">${test.passed ? 'PASS' : 'FAIL'}</td>
            <td>${test.error_message || ''}</td>
        </tr>
        `).join('')}
    </table>

    <h2>Vulnerabilities</h2>
    <table>
        <tr>
            <th>Type</th>
            <th>Description</th>
            <th>Vulnerable</th>
            <th>Details</th>
        </tr>
        ${report.vulnerabilities.map(vuln => `
        <tr class="${vuln.is_vulnerable ? 'vulnerable' : ''}">
            <td>${vuln.vulnerability_type}</td>
            <td>${vuln.test_description}</td>
            <td>${vuln.is_vulnerable ? 'YES' : 'NO'}</td>
            <td>${vuln.details}</td>
        </tr>
        `).join('')}
    </table>

    <p><em>Generated on ${new Date().toISOString()}</em></p>
</body>
</html>`;
  }
}

// =============================================================================
// CLI UTILITY FUNCTIONS
// =============================================================================

/**
 * CLI command to run RLS audit
 */
export async function runRLSAudit(
  supabaseUrl: string,
  serviceRoleKey: string,
  options: {
    format?: 'json' | 'csv' | 'html';
    output?: string;
    verbose?: boolean;
  } = {}
): Promise<void> {
  const auditor = new RLSAuditManager(supabaseUrl, serviceRoleKey);
  
  try {
    if (options.verbose) {
      console.log('🔍 Running RLS security audit...');
    }

    const report = await auditor.generateSecurityReport();
    
    if (options.verbose) {
      console.log(`📊 Security Score: ${report.audit_summary.security_score}/100`);
      console.log(`🛡️  Protected Tables: ${report.audit_summary.protected_tables}/${report.audit_summary.total_tables}`);
      
      if (report.audit_summary.unprotected_tables.length > 0) {
        console.log(`⚠️  Unprotected Tables: ${report.audit_summary.unprotected_tables.join(', ')}`);
      }

      const failedTests = report.test_results.filter(t => !t.passed);
      if (failedTests.length > 0) {
        console.log(`❌ Failed Tests: ${failedTests.length}`);
      }

      const vulnerabilities = report.vulnerabilities.filter(v => v.is_vulnerable);
      if (vulnerabilities.length > 0) {
        console.log(`🚨 Vulnerabilities Found: ${vulnerabilities.length}`);
      }
    }

    const output = await auditor.exportReport(options.format);
    
    if (options.output) {
      const fs = await import('fs');
      fs.writeFileSync(options.output, output);
      console.log(`📝 Report saved to: ${options.output}`);
    } else {
      console.log(output);
    }

  } catch (error) {
    console.error('❌ RLS audit failed:', error);
    process.exit(1);
  }
}

/**
 * Quick RLS validation for a specific table
 */
export async function validateTable(
  supabaseUrl: string,
  serviceRoleKey: string,
  tableName: string
): Promise<void> {
  const auditor = new RLSAuditManager(supabaseUrl, serviceRoleKey);
  
  try {
    console.log(`🔍 Validating RLS for table: ${tableName}`);
    
    const validation = await auditor.validateTableRLS(tableName);
    
    if (validation.isValid) {
      console.log('✅ Table RLS configuration is valid');
    } else {
      console.log('❌ Table RLS configuration has issues:');
      validation.issues.forEach(issue => {
        console.log(`  - ${issue}`);
      });
      
      console.log('\n💡 Recommendations:');
      validation.recommendations.forEach(rec => {
        console.log(`  - ${rec}`);
      });
    }
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default RLSAuditManager;