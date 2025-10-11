/**
 * M-Pesa Integration Diagnostic Tool
 * This script checks each component of the M-Pesa integration
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

async function diagnoseMpesa() {
  console.log('🔍 M-Pesa Integration Diagnostic');
  console.log('================================\n');

  // 1. Check environment variables
  console.log('1. Environment Variables Check:');
  const requiredVars = [
    'MPESA_CONSUMER_KEY',
    'MPESA_CONSUMER_SECRET', 
    'MPESA_BUSINESS_SHORT_CODE',
    'MPESA_PASSKEY',
    'NEXT_PUBLIC_BASE_URL',
    'MPESA_ENVIRONMENT'
  ];

  let allConfigured = true;
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: ${value.substring(0, 15)}...`);
    } else {
      console.log(`❌ ${varName}: NOT SET`);
      allConfigured = false;
    }
  });

  if (!allConfigured) {
    console.log('\n❌ Missing environment variables! Please check your .env file.');
    return;
  }

  // 2. Test access token generation
  console.log('\n2. Testing Access Token Generation:');
  try {
    const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
    const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
    const ENVIRONMENT = process.env.MPESA_ENVIRONMENT || 'sandbox';
    
    const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
    
    const oauthUrl = ENVIRONMENT === 'sandbox' 
      ? 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
      : 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
    
    console.log(`🔑 Requesting token from: ${oauthUrl}`);
    console.log(`🔐 Using environment: ${ENVIRONMENT}`);
    
    const response = await fetch(oauthUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (response.ok && data.access_token) {
      console.log(`✅ Access token generated successfully`);
      console.log(`📋 Token: ${data.access_token.substring(0, 20)}...`);
      console.log(`⏰ Expires in: ${data.expires_in} seconds`);
    } else {
      console.log(`❌ Access token generation failed:`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Response:`, data);
    }
    
  } catch (error) {
    console.log(`❌ Access token generation error: ${error.message}`);
  }

  // 3. Test API endpoint
  console.log('\n3. Testing API Endpoint:');
  try {
    const response = await fetch('http://localhost:3003/api/mpesa', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: '254708374149',
        amount: 1,
        accountReference: 'DIAGNOSTIC-TEST',
        transactionDesc: 'Diagnostic test payment'
      })
    });
    
    const data = await response.json();
    
    console.log(`📊 API Response:`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Success: ${data.success}`);
    console.log(`   Message: ${data.message}`);
    
    if (!data.success) {
      console.log(`   Error details:`, data);
    }
    
  } catch (error) {
    console.log(`❌ API endpoint error: ${error.message}`);
  }

  // 4. Common issues and solutions
  console.log('\n4. Common Issues & Solutions:');
  console.log('');
  console.log('❌ "M-Pesa service temporarily unavailable":');
  console.log('   → Check internet connection');
  console.log('   → Verify credentials are correct');
  console.log('   → Ensure using sandbox environment for testing');
  console.log('');
  console.log('❌ "Invalid Access Token":');
  console.log('   → Check CONSUMER_KEY and CONSUMER_SECRET');
  console.log('   → Verify credentials match environment (sandbox/production)');
  console.log('');
  console.log('❌ "Bad Request":');
  console.log('   → Check phone number format (254xxxxxxxxx)');
  console.log('   → Verify amount is valid (minimum 1 KES)');
  console.log('   → Check BUSINESS_SHORT_CODE and PASSKEY');
  console.log('');
  console.log('❌ "Internal Server Error":');
  console.log('   → Check server logs for detailed error');
  console.log('   → Verify all environment variables are set');
  console.log('   → Check NEXT_PUBLIC_BASE_URL is correct');

  console.log('\n5. Next Steps:');
  console.log('✅ If access token works: Check STK Push parameters');
  console.log('✅ If access token fails: Verify credentials with Safaricom');
  console.log('✅ If API fails: Check server logs and environment setup');
}

diagnoseMpesa();
