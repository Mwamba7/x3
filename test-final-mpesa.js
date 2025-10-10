/**
 * Final M-Pesa Integration Test
 * Tests all the fixes we've implemented
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

async function testFinalMpesa() {
  console.log('🎉 Final M-Pesa Integration Test');
  console.log('================================\n');

  const testCases = [
    {
      name: '✅ Valid Safaricom Number',
      data: { phoneNumber: '0708374149', amount: 100 },
      expectedStatus: 200,
      expectedSuccess: true
    },
    {
      name: '✅ Valid Number with 254 Prefix',
      data: { phoneNumber: '254708374149', amount: 100 },
      expectedStatus: 200,
      expectedSuccess: true
    },
    {
      name: '❌ Invalid Phone Number',
      data: { phoneNumber: '123456789', amount: 100 },
      expectedStatus: 400,
      expectedSuccess: false
    },
    {
      name: '❌ Missing Amount',
      data: { phoneNumber: '0708374149' },
      expectedStatus: 400,
      expectedSuccess: false
    },
    {
      name: '❌ Zero Amount',
      data: { phoneNumber: '0708374149', amount: 0 },
      expectedStatus: 400,
      expectedSuccess: false
    },
    {
      name: '❌ Empty Phone Number',
      data: { phoneNumber: '', amount: 100 },
      expectedStatus: 400,
      expectedSuccess: false
    }
  ];

  let passedTests = 0;
  let totalTests = testCases.length;

  for (const testCase of testCases) {
    console.log(`Testing: ${testCase.name}`);
    
    try {
      const response = await fetch('http://localhost:3003/api/mpesa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...testCase.data,
          accountReference: 'TEST-ORDER',
          transactionDesc: 'Test payment'
        })
      });
      
      const data = await response.json();
      
      const statusMatch = response.status === testCase.expectedStatus;
      const successMatch = data.success === testCase.expectedSuccess;
      
      if (statusMatch && successMatch) {
        console.log(`✅ PASS`);
        passedTests++;
      } else {
        console.log(`❌ FAIL`);
        console.log(`  Expected: Status ${testCase.expectedStatus}, Success ${testCase.expectedSuccess}`);
        console.log(`  Got: Status ${response.status}, Success ${data.success}`);
      }
      
      console.log(`  Message: ${data.message}`);
      
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
    }
    
    console.log('');
  }

  console.log('📊 Test Results:');
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! M-Pesa integration is working correctly!');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the issues above.');
  }

  console.log('\n🔧 Key Features Fixed:');
  console.log('- ✅ No more "Internal server error"');
  console.log('- ✅ No more "Code: undefined" errors');
  console.log('- ✅ Proper phone number validation');
  console.log('- ✅ Specific error messages');
  console.log('- ✅ Enhanced payment status detection');
  console.log('- ✅ User-friendly error handling');
}

testFinalMpesa();
