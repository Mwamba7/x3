/**
 * Debug M-Pesa Internal Server Error
 * This script tests various scenarios that might cause internal server errors
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
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
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          process.env[key.trim()] = value.trim();
        }
      });
    }
  } catch (error) {
    console.log('Error loading .env file:', error.message);
  }
}

loadEnvFile();

async function debugServerError() {
  console.log('🔍 Debugging M-Pesa Internal Server Error');
  console.log('==========================================\n');

  // Check environment variables
  console.log('1. Environment Variables Check:');
  const requiredVars = [
    'MPESA_CONSUMER_KEY',
    'MPESA_CONSUMER_SECRET',
    'MPESA_BUSINESS_SHORT_CODE',
    'MPESA_PASSKEY',
    'NEXT_PUBLIC_BASE_URL'
  ];

  let allConfigured = true;
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: ${value.substring(0, 10)}...`);
    } else {
      console.log(`❌ ${varName}: NOT SET`);
      allConfigured = false;
    }
  });

  if (!allConfigured) {
    console.log('\n❌ Missing environment variables could cause internal server error!');
    return;
  }

  console.log('\n2. Testing Different Request Scenarios:');
  
  const testCases = [
    {
      name: 'Valid Request',
      data: {
        phoneNumber: '254708374149',
        amount: 100,
        accountReference: 'TEST-ORDER',
        transactionDesc: 'Test payment'
      }
    },
    {
      name: 'Invalid Phone Number',
      data: {
        phoneNumber: '123456789',
        amount: 100,
        accountReference: 'TEST-ORDER',
        transactionDesc: 'Test payment'
      }
    },
    {
      name: 'Missing Amount',
      data: {
        phoneNumber: '254708374149',
        accountReference: 'TEST-ORDER',
        transactionDesc: 'Test payment'
      }
    },
    {
      name: 'Zero Amount',
      data: {
        phoneNumber: '254708374149',
        amount: 0,
        accountReference: 'TEST-ORDER',
        transactionDesc: 'Test payment'
      }
    },
    {
      name: 'Invalid JSON (will cause parsing error)',
      data: 'invalid json string'
    }
  ];

  for (const testCase of testCases) {
    console.log(`\nTesting: ${testCase.name}`);
    
    try {
      const response = await fetch('http://localhost:3003/api/mpesa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: typeof testCase.data === 'string' ? testCase.data : JSON.stringify(testCase.data)
      });
      
      const data = await response.json();
      
      console.log(`  Status: ${response.status}`);
      console.log(`  Success: ${data.success}`);
      console.log(`  Message: ${data.message}`);
      
      if (response.status === 500) {
        console.log(`  ⚠️  Internal Server Error detected!`);
      }
      
    } catch (error) {
      console.log(`  ❌ Network Error: ${error.message}`);
    }
  }

  console.log('\n3. Common Causes of Internal Server Error:');
  console.log('- Missing environment variables');
  console.log('- Invalid M-Pesa credentials');
  console.log('- Network issues with Safaricom API');
  console.log('- Invalid request format');
  console.log('- Server configuration issues');
}

debugServerError();
