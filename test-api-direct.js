/**
 * Direct API Test
 * Test the M-Pesa API directly to identify issues
 */

async function testApiDirect() {
  console.log('🧪 Testing M-Pesa API Directly');
  console.log('==============================\n');

  try {
    console.log('1. Testing STK Push...');
    const response = await fetch('http://localhost:3002/api/mpesa', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: '0708374149',
        amount: 100,
        accountReference: 'TEST-DIRECT',
        transactionDesc: 'Direct API test'
      })
    });
    
    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response:', data);
      
      if (data.success && data.checkoutRequestId) {
        console.log('\n2. Testing Status Query...');
        
        // Wait 3 seconds then check status
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const statusResponse = await fetch(`http://localhost:3002/api/mpesa?checkoutRequestId=${data.checkoutRequestId}`);
        const statusData = await statusResponse.json();
        
        console.log('Status Response:', statusData);
      }
    } else {
      const errorText = await response.text();
      console.log('Error Response:', errorText);
    }
    
  } catch (error) {
    console.error('API Test Error:', error.message);
  }
}

testApiDirect();
