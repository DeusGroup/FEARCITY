// Simple verification script for API integration
const fs = require('fs');

console.log('🧪 Fear City Cycles - Integration Verification\n');

// Test 1: Check HTML Structure
function checkHTMLStructure() {
    console.log('1. Checking HTML structure...');
    
    try {
        const mainHTML = fs.readFileSync('main.html', 'utf8');
        
        const hasEmptyBikesGrid = mainHTML.includes('<!-- Motorcycles will be loaded dynamically from API -->');
        const hasEmptyGearGrid = mainHTML.includes('<!-- Gear products will be loaded dynamically from API -->');
        const hasScriptTags = mainHTML.includes('assets/js/api.js') && mainHTML.includes('assets/js/main.js');
        
        if (hasEmptyBikesGrid && hasEmptyGearGrid && hasScriptTags) {
            console.log('   ✅ HTML structure is correct');
            return true;
        } else {
            console.log('   ❌ HTML structure issues detected');
            return false;
        }
    } catch (error) {
        console.log('   ❌ Error reading main.html:', error.message);
        return false;
    }
}

// Test 2: Check JavaScript Files
function checkJavaScriptFiles() {
    console.log('2. Checking JavaScript files...');
    
    const apiExists = fs.existsSync('assets/js/api.js');
    const mainExists = fs.existsSync('assets/js/main.js');
    
    if (apiExists && mainExists) {
        console.log('   ✅ JavaScript files exist');
        return true;
    } else {
        console.log('   ❌ Missing JavaScript files');
        return false;
    }
}

// Test 3: Check API Integration Code
function checkAPIIntegration() {
    console.log('3. Checking API integration code...');
    
    try {
        const apiJS = fs.readFileSync('assets/js/api.js', 'utf8');
        const mainJS = fs.readFileSync('assets/js/main.js', 'utf8');
        
        const hasAPIClass = apiJS.includes('class FearCityAPI');
        const hasFetchProducts = apiJS.includes('async fetchProducts(');
        const hasLoadProducts = mainJS.includes('async function loadProducts()');
        const hasAPICall = mainJS.includes('fearCityAPI.fetchProducts()');
        
        if (hasAPIClass && hasFetchProducts && hasLoadProducts && hasAPICall) {
            console.log('   ✅ API integration code is present');
            return true;
        } else {
            console.log('   ❌ API integration code is incomplete');
            return false;
        }
    } catch (error) {
        console.log('   ❌ Error reading JavaScript files:', error.message);
        return false;
    }
}

// Test 4: Check Mock Backend
function checkMockBackend() {
    console.log('4. Checking mock backend...');
    
    const mockExists = fs.existsSync('mock-backend.js');
    const testExists = fs.existsSync('test-api-integration.html');
    
    if (mockExists && testExists) {
        console.log('   ✅ Test files exist');
        return true;
    } else {
        console.log('   ❌ Missing test files');
        return false;
    }
}

// Run all checks
const results = [
    checkHTMLStructure(),
    checkJavaScriptFiles(),
    checkAPIIntegration(),
    checkMockBackend()
];

const passed = results.filter(r => r).length;

console.log('\n' + '='.repeat(50));
console.log(`📊 Verification: ${passed}/4 checks passed`);

if (passed === 4) {
    console.log('\n🎉 Integration setup is complete!');
    console.log('\n📋 To test the integration:');
    console.log('1. Make sure servers are running:');
    console.log('   - Mock Backend: node mock-backend.js');
    console.log('   - Frontend: python3 -m http.server 8000');
    console.log('2. Visit: http://localhost:8000/main.html');
    console.log('3. Check browser console for "Loaded X products from API"');
    console.log('4. Verify products appear on the page');
    console.log('\n🔬 For detailed testing:');
    console.log('   Visit: http://localhost:8000/test-api-integration.html');
} else {
    console.log('\n❌ Integration setup is incomplete. Fix the issues above.');
}

console.log('\n🚀 Current servers status:');
console.log('   Backend API: http://localhost:3001/api/products');
console.log('   Frontend: http://localhost:8000/main.html');
console.log('   Test Page: http://localhost:8000/test-api-integration.html');