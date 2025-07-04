// Simple Node.js test to verify frontend API integration
// This simulates what happens when the browser loads main.html

const fetch = require('node-fetch'); // You might need: npm install node-fetch
const fs = require('fs');

// Test 1: Verify API is accessible
async function testAPIConnection() {
    console.log('🔍 Testing API Connection...');
    
    try {
        const response = await fetch('http://localhost:3001/api/products');
        const data = await response.json();
        
        if (data.success && data.data && data.data.length > 0) {
            console.log(`✅ API Connection successful! Found ${data.data.length} products`);
            return true;
        } else {
            console.log('❌ API returned unexpected data structure');
            return false;
        }
    } catch (error) {
        console.log('❌ API Connection failed:', error.message);
        return false;
    }
}

// Test 2: Verify main.html has empty product grids
function testHTMLStructure() {
    console.log('\n🔍 Testing HTML Structure...');
    
    try {
        const mainHTML = fs.readFileSync('main.html', 'utf8');
        
        // Check for empty product grids
        const hasEmptyBikesGrid = mainHTML.includes('<!-- Motorcycles will be loaded dynamically from API -->');
        const hasEmptyGearGrid = mainHTML.includes('<!-- Gear products will be loaded dynamically from API -->');
        
        // Check that hardcoded products are removed
        const hasHardcodedProducts = mainHTML.includes('product-card') && 
                                   mainHTML.includes('<img src="https://qmjauzmtznndsysnaxzo');
        
        if (hasEmptyBikesGrid && hasEmptyGearGrid && !hasHardcodedProducts) {
            console.log('✅ HTML structure is correct for dynamic loading');
            return true;
        } else {
            console.log('❌ HTML structure issues:');
            if (!hasEmptyBikesGrid) console.log('  - Missing empty bikes grid');
            if (!hasEmptyGearGrid) console.log('  - Missing empty gear grid');
            if (hasHardcodedProducts) console.log('  - Still contains hardcoded products');
            return false;
        }
    } catch (error) {
        console.log('❌ Error reading main.html:', error.message);
        return false;
    }
}

// Test 3: Verify JavaScript files exist
function testJavaScriptFiles() {
    console.log('\n🔍 Testing JavaScript Files...');
    
    const files = [
        'assets/js/api.js',
        'assets/js/main.js'
    ];
    
    let allExist = true;
    
    files.forEach(file => {
        if (fs.existsSync(file)) {
            console.log(`✅ ${file} exists`);
        } else {
            console.log(`❌ ${file} is missing`);
            allExist = false;
        }
    });
    
    return allExist;
}

// Test 4: Check API integration code in main.js
function testMainJSIntegration() {
    console.log('\n🔍 Testing main.js API Integration...');
    
    try {
        const mainJS = fs.readFileSync('assets/js/main.js', 'utf8');
        
        const hasLoadProducts = mainJS.includes('async function loadProducts()');
        const hasAPICall = mainJS.includes('fearCityAPI.fetchProducts()');
        const hasUpdateDisplay = mainJS.includes('updateProductDisplay()');
        const hasCreateProductCard = mainJS.includes('createProductCard(product)');
        
        if (hasLoadProducts && hasAPICall && hasUpdateDisplay && hasCreateProductCard) {
            console.log('✅ main.js has proper API integration code');
            return true;
        } else {
            console.log('❌ main.js missing integration code:');
            if (!hasLoadProducts) console.log('  - Missing loadProducts function');
            if (!hasAPICall) console.log('  - Missing API call');
            if (!hasUpdateDisplay) console.log('  - Missing updateProductDisplay');
            if (!hasCreateProductCard) console.log('  - Missing createProductCard');
            return false;
        }
    } catch (error) {
        console.log('❌ Error reading main.js:', error.message);
        return false;
    }
}

// Test 5: Check FearCityAPI class in api.js
function testAPIClass() {
    console.log('\n🔍 Testing api.js FearCityAPI Class...');
    
    try {
        const apiJS = fs.readFileSync('assets/js/api.js', 'utf8');
        
        const hasAPIClass = apiJS.includes('class FearCityAPI');
        const hasFetchProducts = apiJS.includes('async fetchProducts(');
        const hasBaseURL = apiJS.includes('getBaseURL()');
        const hasErrorHandling = apiJS.includes('handleErrorResponse');
        
        if (hasAPIClass && hasFetchProducts && hasBaseURL && hasErrorHandling) {
            console.log('✅ api.js has complete FearCityAPI class');
            return true;
        } else {
            console.log('❌ api.js missing components:');
            if (!hasAPIClass) console.log('  - Missing FearCityAPI class');
            if (!hasFetchProducts) console.log('  - Missing fetchProducts method');
            if (!hasBaseURL) console.log('  - Missing getBaseURL method');
            if (!hasErrorHandling) console.log('  - Missing error handling');
            return false;
        }
    } catch (error) {
        console.log('❌ Error reading api.js:', error.message);
        return false;
    }
}

// Run all tests
async function runAllTests() {
    console.log('🧪 Fear City Cycles - API Integration Test Suite\n');
    console.log('='.repeat(50));
    
    const tests = [
        await testAPIConnection(),
        testHTMLStructure(),
        testJavaScriptFiles(),
        testMainJSIntegration(),
        testAPIClass()
    ];
    
    const passed = tests.filter(t => t).length;
    const total = tests.length;
    
    console.log('\n' + '='.repeat(50));
    console.log(`📊 Test Results: ${passed}/${total} tests passed`);
    
    if (passed === total) {
        console.log('🎉 All tests passed! API integration is ready.');
        console.log('\n🌐 Next steps:');
        console.log('1. Visit http://localhost:8000/main.html in your browser');
        console.log('2. Open developer tools (F12)');
        console.log('3. Check console for "Loaded X products from API"');
        console.log('4. Verify products appear on the page');
    } else {
        console.log('❌ Some tests failed. Please fix the issues above.');
    }
}

// Run the tests
runAllTests().catch(console.error);