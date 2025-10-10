/**
 * Test M-Pesa Access Token Generation
 */

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
const ENVIRONMENT = process.env.MPESA_ENVIRONMENT || 'sandbox';

console.log('🔑 Testing M-Pesa Access Token Generation');
console.log('==========================================');
console.log(`Environment: ${ENVIRONMENT}`);
console.log(`Consumer Key: ${CONSUMER_KEY ? CONSUMER_KEY.substring(0, 10) + '...' : 'NOT SET'}`);
console.log(`Consumer Secret: ${CONSUMER_SECRET ? CONSUMER_SECRET.substring(0, 10) + '...' : 'NOT SET'}`);

const API_URLS = {
  sandbox: 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
  production: 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
};

async function testAccessToken() {
  if (!CONSUMER_KEY || !CONSUMER_SECRET) {
    console.log('❌ Missing credentials');
    return;
  }

  const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
  const url = API_URLS[ENVIRONMENT];
  
  console.log(`\n🌐 Testing ${ENVIRONMENT} endpoint: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    console.log(`\n📊 Response Status: ${response.status}`);
    console.log('📋 Response Data:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.access_token) {
      console.log('\n✅ Access token generated successfully!');
      console.log(`Token: ${data.access_token.substring(0, 20)}...`);
      console.log(`Expires in: ${data.expires_in} seconds`);
    } else {
      console.log('\n❌ Failed to generate access token');
      if (data.errorCode) {
        console.log(`Error Code: ${data.errorCode}`);
        console.log(`Error Message: ${data.errorMessage}`);
      }
    }
    
  } catch (error) {
    console.log('\n❌ Network Error:', error.message);
  }
}

testAccessToken();
