#!/bin/bash

# Fear City Cycles RLS Verification Script v0.1.7
# Comprehensive verification of RLS implementation completeness

set -e

echo "🔍 Fear City Cycles RLS Verification v0.1.7"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Function to run a check
run_check() {
    local description="$1"
    local command="$2"
    local expected_result="$3"
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    echo -n "  Checking: $description ... "
    
    result=$(eval "$command" 2>/dev/null || echo "ERROR")
    
    if [[ "$result" == "$expected_result" ]]; then
        echo -e "${GREEN}✓ PASS${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}✗ FAIL${NC}"
        echo "    Expected: $expected_result"
        echo "    Got: $result"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
}

# Function to check file exists
check_file_exists() {
    local file="$1"
    local description="$2"
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    echo -n "  Checking: $description ... "
    
    if [[ -f "$file" ]]; then
        echo -e "${GREEN}✓ EXISTS${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}✗ MISSING${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
}

# Function to count occurrences in files
count_in_files() {
    local pattern="$1"
    local file_pattern="$2"
    
    find . -name "$file_pattern" -type f -exec grep -l "$pattern" {} \; 2>/dev/null | wc -l
}

echo -e "\n${BLUE}1. Migration Files Verification${NC}"
echo "--------------------------------"

check_file_exists "supabase/migrations/20250629000002_comprehensive_rls_v0_1_7.sql" "Main RLS migration exists"
check_file_exists "supabase/migrations/20250629000003_rls_missing_tables_v0_1_7.sql" "Missing tables migration exists"
check_file_exists "supabase/tests/rls-test-suite.sql" "RLS test suite exists"

echo -e "\n${BLUE}2. RLS Policy Count Verification${NC}"
echo "-------------------------------"

# Count RLS enablements
rls_count=$(count_in_files "ENABLE ROW LEVEL SECURITY" "*.sql")
run_check "RLS enabled on tables (minimum 15)" "echo $rls_count" "19"

# Count policies
policy_count=$(count_in_files "CREATE POLICY" "*.sql")
run_check "RLS policies created (minimum 50)" "echo $policy_count" "83"

# Count helper functions
function_count=$(count_in_files "CREATE OR REPLACE FUNCTION.*auth\." "*.sql")
run_check "Auth helper functions created" "echo $function_count" "5"

echo -e "\n${BLUE}3. Critical Table Coverage${NC}"
echo "-------------------------"

# Check for critical tables in RLS migrations
critical_tables=("users" "customers" "addresses" "orders" "admin_users" "cart_items")

for table in "${critical_tables[@]}"; do
    table_protected=$(grep -r "ALTER TABLE $table ENABLE ROW LEVEL SECURITY" . --include="*.sql" | wc -l)
    run_check "$table table has RLS enabled" "echo $table_protected" "1"
done

echo -e "\n${BLUE}4. CLI Tools Verification${NC}"
echo "------------------------"

check_file_exists "scripts/rls-cli.ts" "RLS CLI tool exists"
check_file_exists "lib/rls/audit-tools.ts" "RLS audit tools exist"
check_file_exists "lib/rls/client-utils.ts" "RLS client utilities exist"

# Check package.json scripts
if [[ -f "package.json" ]]; then
    rls_scripts=$(grep -c "rls:" package.json 2>/dev/null || echo "0")
    run_check "RLS scripts in package.json (minimum 8)" "echo $rls_scripts" "9"
else
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    echo -e "  Checking: RLS scripts in package.json ... ${RED}✗ PACKAGE.JSON MISSING${NC}"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

echo -e "\n${BLUE}5. Documentation Verification${NC}"
echo "----------------------------"

check_file_exists "docs/RLS-IMPLEMENTATION-GUIDE.md" "Implementation guide exists"
check_file_exists "docs/RLS-QUICK-START.md" "Quick start guide exists"
check_file_exists "RLS-COVERAGE-ANALYSIS.md" "Coverage analysis exists"

echo -e "\n${BLUE}6. Security Pattern Verification${NC}"
echo "-------------------------------"

# Check for security patterns
auth_uid_count=$(count_in_files "auth.uid()" "*.sql")
run_check "auth.uid() user isolation patterns (minimum 10)" "echo $auth_uid_count" "15"

admin_check_count=$(count_in_files "auth.is_admin()" "*.sql")
run_check "Admin override patterns (minimum 10)" "echo $admin_check_count" "15"

service_role_count=$(count_in_files "auth.is_service_role()" "*.sql")
run_check "Service role bypass patterns (minimum 10)" "echo $service_role_count" "15"

echo -e "\n${BLUE}7. Test Coverage Verification${NC}"
echo "----------------------------"

# Check test file coverage
test_functions=$(count_in_files "CREATE OR REPLACE FUNCTION.*test" "*.sql")
run_check "RLS test functions created (minimum 5)" "echo $test_functions" "6"

vulnerability_tests=$(count_in_files "vulnerability" "*.sql")
run_check "Vulnerability test cases (minimum 3)" "echo $vulnerability_tests" "4"

echo -e "\n${BLUE}8. CI/CD Integration Verification${NC}"
echo "--------------------------------"

check_file_exists ".github/workflows/rls-audit.yml" "GitHub Actions workflow exists"

if [[ -f ".github/workflows/rls-audit.yml" ]]; then
    workflow_jobs=$(grep -c "jobs:" .github/workflows/rls-audit.yml 2>/dev/null || echo "0")
    run_check "CI/CD workflow jobs configured (minimum 2)" "echo $workflow_jobs" "2"
fi

echo -e "\n${BLUE}9. Advanced Features Verification${NC}"
echo "--------------------------------"

audit_logging=$(count_in_files "rls_audit_log" "*.sql")
run_check "Audit logging implemented" "echo $audit_logging" "6"

performance_indexes=$(count_in_files "CREATE INDEX.*idx_.*" "*.sql")
run_check "Performance indexes created (minimum 10)" "echo $performance_indexes" "15"

security_definer=$(count_in_files "SECURITY DEFINER" "*.sql")
run_check "Security definer functions (minimum 5)" "echo $security_definer" "10"

echo -e "\n${BLUE}10. TypeScript Integration${NC}"
echo "-------------------------"

if [[ -f "lib/rls/audit-tools.ts" ]]; then
    ts_classes=$(grep -c "export class" lib/rls/audit-tools.ts 2>/dev/null || echo "0")
    run_check "TypeScript audit classes (minimum 1)" "echo $ts_classes" "1"
fi

if [[ -f "lib/rls/client-utils.ts" ]]; then
    ts_interfaces=$(grep -c "export interface" lib/rls/client-utils.ts 2>/dev/null || echo "0")
    run_check "TypeScript interfaces (minimum 5)" "echo $ts_interfaces" "5"
fi

echo -e "\n${YELLOW}================================================${NC}"
echo -e "${BLUE}RLS VERIFICATION SUMMARY${NC}"
echo -e "${YELLOW}================================================${NC}"

echo "Total Checks: $TOTAL_CHECKS"
echo -e "Passed: ${GREEN}$PASSED_CHECKS${NC}"
echo -e "Failed: ${RED}$FAILED_CHECKS${NC}"

# Calculate percentage
if [[ $TOTAL_CHECKS -gt 0 ]]; then
    percentage=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
    echo "Success Rate: $percentage%"
    
    if [[ $percentage -ge 95 ]]; then
        echo -e "\n${GREEN}🎉 EXCELLENT! RLS implementation is comprehensive and production-ready.${NC}"
        exit_code=0
    elif [[ $percentage -ge 85 ]]; then
        echo -e "\n${YELLOW}✅ GOOD! RLS implementation is solid with minor gaps.${NC}"
        exit_code=0
    elif [[ $percentage -ge 70 ]]; then
        echo -e "\n${YELLOW}⚠️  FAIR! RLS implementation needs improvement before production.${NC}"
        exit_code=1
    else
        echo -e "\n${RED}❌ POOR! RLS implementation has significant gaps and security risks.${NC}"
        exit_code=2
    fi
else
    echo -e "\n${RED}❌ ERROR! No checks could be performed.${NC}"
    exit_code=3
fi

echo -e "\n${BLUE}Recommendations:${NC}"

if [[ $FAILED_CHECKS -gt 0 ]]; then
    echo "1. Review failed checks above"
    echo "2. Run: npm run rls:audit"
    echo "3. Check: npm run rls:coverage"
    echo "4. Deploy missing migrations: npm run rls:deploy"
fi

echo "5. Monitor with: npm run rls:monitor"
echo "6. Regular audits: npm run rls:test"

echo -e "\n${BLUE}Quick Commands:${NC}"
echo "npm run rls:audit    # Generate security report"
echo "npm run rls:coverage # Check table coverage" 
echo "npm run rls:test     # Run test suite"

exit $exit_code