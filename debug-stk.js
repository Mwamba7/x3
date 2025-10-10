/**
 * Debug STK Push Issue
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

const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const BUSINESS_SHORT_CODE = process.env.MPESA_BUSINESS_SHORT_CODE;
const PASSKEY = process.env.MPESA_PASSKEY;
const ENVIRONMENT = process.env.MPESA_ENVIRONMENT || 'sandbox';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

const API_URLS = {
  sandbox: {
    oauth: 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    stkpush: 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
  },
  production: {
    oauth: 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    stkpush: 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
  }
};

async function generateAccessToken() {
  const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
  
  try {
    const response = await fetch(API_URLS[ENVIRONMENT].oauth, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.errorMessage || data.error_description || 'Unknown error'}`);
    }
    
    if (!data.access_token) {
      throw new Error('Failed to get access token: ' + (data.errorMessage || 'Unknown error'));
    }
    
    return data.access_token;
  } catch (error) {
    throw new Error('Failed to generate access token: ' + error.message);
  }
}

function generatePassword() {
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
  const password = Buffer.from(`${BUSINESS_SHORT_CODE}${PASSKEY}${timestamp}`).toString('base64');
  return { password, timestamp };
}

function formatPhoneNumber(phone) {
  let cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('254')) {
    return cleaned;
  } else if (cleaned.startsWith('0')) {
    return '254' + cleaned.slice(1);
  } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
    return '254' + cleaned;
  }
  
  return cleaned;
}

async function testSTKPush() {
  console.log('🔍 Debugging STK Push Issue');
  console.log('============================');
  
  try {
    // Step 1: Generate access token
    console.log('Step 1: Generating access token...');
    const accessToken = await generateAccessToken();
    console.log(`✅ Access token: ${accessToken.substring(0, 20)}...`);
    
    // Step 2: Generate password and timestamp
    console.log('\nStep 2: Generating password and timestamp...');
    const { password, timestamp } = generatePassword();
    console.log(`✅ Timestamp: ${timestamp}`);
    console.log(`✅ Password: ${password.substring(0, 20)}...`);
    
    // Step 3: Format phone number
    const phoneNumber = '254708374149';
    const formattedPhone = formatPhoneNumber(phoneNumber);
    console.log(`✅ Formatted phone: ${formattedPhone}`);
    
    // Step 4: Prepare STK Push data
    const amount = 100;
    const callbackUrl = `${BASE_URL}/api/mpesa/callback`;
    
    const stkPushData = {
      BusinessShortCode: BUSINESS_SHORT_CODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: BUSINESS_SHORT_CODE,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: 'TEST-ORDER',
      TransactionDesc: 'Test payment'
    };
    
    console.log('\nStep 3: STK Push data prepared:');
    console.log(JSON.stringify(stkPushData, null, 2));
    
    // Step 5: Make STK Push request
    console.log('\nStep 4: Making STK Push request...');
    console.log(`URL: ${API_URLS[ENVIRONMENT].stkpush}`);
    
    const response = await fetch(API_URLS[ENVIRONMENT].stkpush, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(stkPushData)
    });
    
    const data = await response.json();
    
    console.log(`\n📊 Response Status: ${response.status}`);
    console.log('📋 Response Data:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.ResponseCode === '0') {
      console.log('\n✅ STK Push successful!');
    } else {
      console.log('\n❌ STK Push failed');
    }
    
  } catch (error) {
    console.log('\n❌ Error:', error.message);
  }
}

testSTKPush();
