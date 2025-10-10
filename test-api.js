/**
 * Test the M-Pesa API endpoint directly
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

async function testMpesaAPI() {
  console.log('🧪 Testing M-Pesa API Endpoint');
  console.log('==============================');
  
  const testData = {
    phoneNumber: '254708374149',
    amount: 100,
    accountReference: 'TEST-ORDER',
    transactionDesc: 'Test payment'
  };
  
  console.log('Test data:', JSON.stringify(testData, null, 2));
  
  try {
    const response = await fetch('http://localhost:3003/api/mpesa', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    console.log(`\n📊 Response Status: ${response.status}`);
    
    const data = await response.json();
    console.log('📋 Response Data:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log('\n✅ API endpoint is working correctly!');
    } else {
      console.log('\n❌ API endpoint failed');
      console.log('Error:', data.message || 'Unknown error');
    }
    
  } catch (error) {
    console.log('\n❌ Network Error:', error.message);
  }
}

testMpesaAPI();
