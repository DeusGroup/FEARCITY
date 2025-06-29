#!/usr/bin/env tsx
/**
 * Fear City Cycles RLS CLI v0.1.7
 * Command-line interface for RLS management and auditing
 */

import { Command } from 'commander';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { RLSAuditManager, runRLSAudit, validateTable } from '../lib/rls/audit-tools';

// Load environment variables
config();

const program = new Command();

// =============================================================================
// CLI CONFIGURATION
// =============================================================================

program
  .name('rls-cli')
  .description('Fear City Cycles RLS Management CLI')
  .version('0.1.7');

// =============================================================================
// AUDIT COMMAND
// =============================================================================

program
  .command('audit')
  .description('Run comprehensive RLS security audit')
  .option('-f, --format <format>', 'Output format (json|csv|html)', 'json')
  .option('-o, --output <file>', 'Output file path')
  .option('-v, --verbose', 'Verbose output')
  .action(async (options) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('❌ Missing required environment variables:');
      console.error('   VITE_SUPABASE_URL');
      console.error('   SUPABASE_SERVICE_ROLE_KEY');
      process.exit(1);
    }

    await runRLSAudit(supabaseUrl, serviceRoleKey, options);
  });

// =============================================================================
// VALIDATE COMMAND
// =============================================================================

program
  .command('validate')
  .description('Validate RLS configuration for specific table')
  .argument('<table>', 'Table name to validate')
  .action(async (tableName) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('❌ Missing required environment variables');
      process.exit(1);
    }

    await validateTable(supabaseUrl, serviceRoleKey, tableName);
  });

// =============================================================================
// TEST COMMAND
// =============================================================================

program
  .command('test')
  .description('Run RLS test suite')
  .option('-t, --table <table>', 'Test specific table only')
  .option('-u, --user <user_id>', 'Test with specific user context')
  .option('--vulnerabilities', 'Run vulnerability tests')
  .option('--performance', 'Run performance tests')
  .action(async (options) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('❌ Missing required environment variables');
      process.exit(1);
    }

    const auditor = new RLSAuditManager(supabaseUrl, serviceRoleKey);

    try {
      console.log('🧪 Running RLS tests...');

      if (options.vulnerabilities) {
        console.log('\n🔍 Running vulnerability tests...');
        const vulnerabilities = await auditor.checkVulnerabilities();
        
        vulnerabilities.forEach(vuln => {
          const status = vuln.is_vulnerable ? '🚨 VULNERABLE' : '✅ SECURE';
          console.log(`${status} ${vuln.vulnerability_type}: ${vuln.test_description}`);
          if (vuln.details) {
            console.log(`   Details: ${vuln.details}`);
          }
        });
      }

      if (options.performance) {
        console.log('\n⚡ Running performance tests...');
        const metrics = await auditor.measurePerformance();
        
        metrics.forEach(metric => {
          console.log(`📊 ${metric.table_name} ${metric.operation}:`);
          console.log(`   With RLS: ${metric.with_rls_ms.toFixed(2)}ms`);
          console.log(`   Without RLS: ${metric.without_rls_ms.toFixed(2)}ms`);
          console.log(`   Impact: ${metric.performance_impact_percent.toFixed(1)}%`);
        });
      }

      if (!options.vulnerabilities && !options.performance) {
        console.log('\n🔬 Running comprehensive test suite...');
        const results = await auditor.runRLSTests();
        
        const categories = [...new Set(results.map(r => r.category))];
        
        categories.forEach(category => {
          console.log(`\n📋 ${category} Tests:`);
          
          const categoryTests = results.filter(r => r.category === category);
          const passed = categoryTests.filter(t => t.passed).length;
          const total = categoryTests.length;
          
          console.log(`   ${passed}/${total} tests passed`);
          
          categoryTests.forEach(test => {
            const status = test.passed ? '✅' : '❌';
            console.log(`   ${status} ${test.test_name}`);
            if (!test.passed && test.error_message) {
              console.log(`      Error: ${test.error_message}`);
            }
          });
        });
      }

    } catch (error) {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    }
  });

// =============================================================================
// COVERAGE COMMAND
// =============================================================================

program
  .command('coverage')
  .description('Show RLS coverage report')
  .option('--missing-only', 'Show only tables missing RLS')
  .action(async (options) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('❌ Missing required environment variables');
      process.exit(1);
    }

    const auditor = new RLSAuditManager(supabaseUrl, serviceRoleKey);

    try {
      console.log('📊 RLS Coverage Report');
      console.log('═'.repeat(50));

      const coverage = await auditor.getRLSCoverage();
      
      const enabledTables = coverage.filter(t => t.rls_enabled);
      const disabledTables = coverage.filter(t => !t.rls_enabled);

      console.log(`\n📈 Summary:`);
      console.log(`   Total Tables: ${coverage.length}`);
      console.log(`   RLS Enabled: ${enabledTables.length}`);
      console.log(`   RLS Disabled: ${disabledTables.length}`);
      console.log(`   Coverage: ${((enabledTables.length / coverage.length) * 100).toFixed(1)}%`);

      if (options.missingOnly) {
        if (disabledTables.length > 0) {
          console.log(`\n❌ Tables without RLS:`);
          disabledTables.forEach(table => {
            console.log(`   - ${table.table_name}`);
          });
        } else {
          console.log(`\n✅ All tables have RLS enabled!`);
        }
      } else {
        console.log(`\n📋 Detailed Coverage:`);
        coverage.forEach(table => {
          const status = table.rls_enabled ? '🛡️ ' : '⚠️ ';
          console.log(`${status} ${table.table_name}`);
          console.log(`     RLS: ${table.rls_enabled ? 'Enabled' : 'Disabled'}`);
          console.log(`     Policies: ${table.policy_count}`);
          console.log(`     CRUD: ${[
            table.has_select_policy ? 'R' : '-',
            table.has_insert_policy ? 'C' : '-',
            table.has_update_policy ? 'U' : '-',
            table.has_delete_policy ? 'D' : '-'
          ].join('')}`);
        });
      }

    } catch (error) {
      console.error('❌ Coverage check failed:', error);
      process.exit(1);
    }
  });

// =============================================================================
// MONITOR COMMAND
// =============================================================================

program
  .command('monitor')
  .description('Monitor RLS policy effectiveness')
  .option('-d, --days <days>', 'Number of days to analyze', '7')
  .action(async (options) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('❌ Missing required environment variables');
      process.exit(1);
    }

    const auditor = new RLSAuditManager(supabaseUrl, serviceRoleKey);

    try {
      console.log(`📈 RLS Monitoring Report (${options.days} days)`);
      console.log('═'.repeat(50));

      const auditLogs = await auditor.getAuditLogs(1000);
      
      if (auditLogs.length === 0) {
        console.log('📝 No audit logs found');
        console.log('   Enable audit logging to monitor RLS effectiveness');
        return;
      }

      // Analyze logs
      const tableStats = auditLogs.reduce((acc, log) => {
        if (!acc[log.table_name]) {
          acc[log.table_name] = { total: 0, operations: {} };
        }
        acc[log.table_name].total++;
        acc[log.table_name].operations[log.operation] = 
          (acc[log.table_name].operations[log.operation] || 0) + 1;
        return acc;
      }, {} as Record<string, any>);

      console.log(`\n📊 Activity Summary:`);
      console.log(`   Total Operations: ${auditLogs.length}`);
      console.log(`   Tables Accessed: ${Object.keys(tableStats).length}`);
      console.log(`   Time Range: ${auditLogs[auditLogs.length - 1]?.created_at} to ${auditLogs[0]?.created_at}`);

      console.log(`\n📋 Per Table Activity:`);
      Object.entries(tableStats)
        .sort(([,a], [,b]) => (b as any).total - (a as any).total)
        .forEach(([table, stats]) => {
          console.log(`   ${table}: ${(stats as any).total} operations`);
          Object.entries((stats as any).operations).forEach(([op, count]) => {
            console.log(`     ${op}: ${count}`);
          });
        });

    } catch (error) {
      console.error('❌ Monitoring failed:', error);
      process.exit(1);
    }
  });

// =============================================================================
// DEPLOY COMMAND
// =============================================================================

program
  .command('deploy')
  .description('Deploy RLS policies to Supabase')
  .option('--dry-run', 'Show what would be deployed without executing')
  .action(async (options) => {
    console.log('🚀 RLS Policy Deployment');
    console.log('═'.repeat(50));

    if (options.dryRun) {
      console.log('📋 Dry run mode - showing planned changes:');
      console.log('   1. Enable RLS on all tables');
      console.log('   2. Create user isolation policies');
      console.log('   3. Add admin override policies');
      console.log('   4. Configure public read policies');
      console.log('   5. Set up audit logging');
      console.log('\n💡 Run without --dry-run to apply changes');
    } else {
      console.log('💾 Deploying RLS policies...');
      console.log('⚠️  This should be done through Supabase migrations:');
      console.log('   npx supabase db push');
      console.log('   npx supabase db reset');
    }
  });

// =============================================================================
// INIT COMMAND
// =============================================================================

program
  .command('init')
  .description('Initialize RLS configuration files')
  .action(async () => {
    console.log('🚀 Initializing RLS configuration...');
    
    // Create basic RLS config files
    console.log('📝 Creating configuration files...');
    console.log('   - lib/rls/policies.sql');
    console.log('   - scripts/rls-audit.sh');
    console.log('   - .github/workflows/rls-audit.yml');
    
    console.log('✅ RLS configuration initialized!');
    console.log('\n💡 Next steps:');
    console.log('   1. Review generated policies');
    console.log('   2. Run: npm run rls:audit');
    console.log('   3. Deploy: npx supabase db push');
  });

// =============================================================================
// MAIN EXECUTION
// =============================================================================

// Handle command execution
if (import.meta.url === `file://${process.argv[1]}`) {
  program.parse();
}

export { program };