/**
 * M-Pesa Integration Test Script
 * Run this script to test your M-Pesa integration
 * 
 * Usage: node test-mpesa.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const lines = envContent.split('\n');
      
      lines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#') && trimmedLine.includes('=')) {
          const [key, ...valueParts] = trimmedLine.split('=');
          const value = valueParts.join('=').replace(/^["']|["']$/g, ''); // Remove quotes
          process.env[key.trim()] = value.trim();
        }
      });
      
      console.log('✅ Loaded environment variables from .env file');
    } else {
      console.log('❌ .env file not found');
    }
  } catch (error) {
    console.log('❌ Error loading .env file:', error.message);
  }
}

// Load environment variables
loadEnvFile();

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3001', // Change this to your app URL (using 3001 since 3000 is in use)
  testPhone: '254708374149', // Safaricom test number
  testAmount: 100 // Test amount in KES
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test 1: Check if callback endpoint is active
async function testCallbackEndpoint() {
  log('\n🔍 Testing M-Pesa callback endpoint...', 'blue');
  
  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/mpesa/callback`);
    const data = await response.json();
    
    if (response.ok && data.message) {
      log('✅ Callback endpoint is active', 'green');
      return true;
    } else {
      log('❌ Callback endpoint not responding correctly', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Error testing callback endpoint: ${error.message}`, 'red');
    return false;
  }
}

// Test 2: Test STK Push
async function testSTKPush() {
  log('\n📱 Testing STK Push...', 'blue');
  
  const payload = {
    phoneNumber: TEST_CONFIG.testPhone,
    amount: TEST_CONFIG.testAmount,
    accountReference: 'TEST-ORDER',
    transactionDesc: 'Test payment'
  };
  
  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/mpesa`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      log('✅ STK Push initiated successfully', 'green');
      log(`   Checkout Request ID: ${data.checkoutRequestId}`, 'blue');
      return data.checkoutRequestId;
    } else {
      log('❌ STK Push failed', 'red');
      log(`   Error: ${data.message}`, 'red');
      return null;
    }
  } catch (error) {
    log(`❌ Error testing STK Push: ${error.message}`, 'red');
    return null;
  }
}

// Test 3: Test STK Query
async function testSTKQuery(checkoutRequestId) {
  if (!checkoutRequestId) {
    log('⏭️  Skipping STK Query test (no checkout request ID)', 'yellow');
    return;
  }
  
  log('\n🔍 Testing STK Query...', 'blue');
  
  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/mpesa?checkoutRequestId=${checkoutRequestId}`);
    const data = await response.json();
    
    if (response.ok && data.success) {
      log('✅ STK Query successful', 'green');
      log(`   Result: ${JSON.stringify(data.data, null, 2)}`, 'blue');
    } else {
      log('❌ STK Query failed', 'red');
      log(`   Error: ${data.message}`, 'red');
    }
  } catch (error) {
    log(`❌ Error testing STK Query: ${error.message}`, 'red');
  }
}

// Test 4: Check environment variables
function testEnvironmentConfig() {
  log('\n⚙️  Checking environment configuration...', 'blue');
  
  const requiredVars = [
    'MPESA_CONSUMER_KEY',
    'MPESA_CONSUMER_SECRET', 
    'MPESA_BUSINESS_SHORT_CODE',
    'MPESA_PASSKEY',
    'NEXT_PUBLIC_BASE_URL'
  ];
  
  let allConfigured = true;
  
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      log(`✅ ${varName} is configured`, 'green');
    } else {
      log(`❌ ${varName} is missing`, 'red');
      allConfigured = false;
    }
  });
  
  if (allConfigured) {
    log('✅ All required environment variables are configured', 'green');
  } else {
    log('❌ Some environment variables are missing. Check your .env file', 'red');
  }
  
  return allConfigured;
}

// Main test function
async function runTests() {
  log('🧪 M-Pesa Integration Test Suite', 'blue');
  log('=====================================', 'blue');
  
  // Test environment configuration
  const envConfigured = testEnvironmentConfig();
  
  if (!envConfigured) {
    log('\n⚠️  Please configure your environment variables before running integration tests', 'yellow');
    log('   See MPESA_SETUP_GUIDE.md for instructions', 'yellow');
    return;
  }
  
  // Test callback endpoint
  const callbackActive = await testCallbackEndpoint();
  
  if (!callbackActive) {
    log('\n⚠️  Make sure your development server is running:', 'yellow');
    log('   npm run dev', 'yellow');
    return;
  }
  
  // Test STK Push
  const checkoutRequestId = await testSTKPush();
  
  // Wait a bit before testing query
  if (checkoutRequestId) {
    log('\n⏳ Waiting 3 seconds before testing STK Query...', 'yellow');
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  // Test STK Query
  await testSTKQuery(checkoutRequestId);
  
  // Final summary
  log('\n📋 Test Summary:', 'blue');
  log('================', 'blue');
  log('✅ Environment configured', envConfigured ? 'green' : 'red');
  log('✅ Callback endpoint active', callbackActive ? 'green' : 'red');
  log('✅ STK Push working', checkoutRequestId ? 'green' : 'red');
  
  if (checkoutRequestId) {
    log('\n🎉 M-Pesa integration is working!', 'green');
    log('   You can now test payments in your application', 'green');
  } else {
    log('\n⚠️  M-Pesa integration needs attention', 'yellow');
    log('   Check the errors above and your configuration', 'yellow');
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(error => {
    log(`❌ Test suite failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { runTests, testCallbackEndpoint, testSTKPush, testSTKQuery };
