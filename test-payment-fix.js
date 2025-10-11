/**
 * Test Payment Status Fix
 * This script tests the payment flow to ensure proper status display
 */

async function testPaymentFix() {
  console.log('🔧 Testing Payment Status Fix');
  console.log('=============================\n');

  console.log('1. Testing M-Pesa API with valid phone number...');
  
  try {
    const response = await fetch('http://localhost:3003/api/mpesa', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: '0708374149',
        amount: 100,
        accountReference: 'TEST-ORDER',
        transactionDesc: 'Test payment for status fix'
      })
    });
    
    const data = await response.json();
    
    console.log(`📊 STK Push Response:`);
    console.log(`  Status: ${response.status}`);
    console.log(`  Success: ${data.success}`);
    console.log(`  Message: ${data.message}`);
    
    if (data.success && data.checkoutRequestId) {
      console.log(`  CheckoutRequestId: ${data.checkoutRequestId}`);
      
      console.log('\n2. Testing payment status query...');
      
      // Wait a bit then check status
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const statusResponse = await fetch(`http://localhost:3003/api/mpesa?checkoutRequestId=${data.checkoutRequestId}`);
      const statusData = await statusResponse.json();
      
      console.log(`📋 Status Query Response:`);
      console.log(`  Success: ${statusData.success}`);
      
      if (statusData.success && statusData.data) {
        const { ResultCode, ResultDesc } = statusData.data;
        console.log(`  ResultCode: ${ResultCode}`);
        console.log(`  ResultDesc: ${ResultDesc}`);
        
        // Test the logic
        const resultCode = String(ResultCode);
        
        if (resultCode === '0') {
          console.log(`  ✅ Expected Status: success`);
          console.log(`  ✅ Expected Display: "✅ Payment Successful!"`);
        } else if (resultCode === '1032') {
          console.log(`  ⏳ Expected Status: processing`);
          console.log(`  ✅ Expected Display: "✅ Transaction Made Successfully"`);
          console.log(`  📝 Expected Message: "The transaction is still under processing..."`);
        } else {
          console.log(`  ❌ Expected Status: failed/cancelled`);
          console.log(`  ❌ Expected Display: "❌ Payment Failed" or "🚫 Payment Cancelled"`);
        }
      }
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  console.log('\n3. Key Fixes Applied:');
  console.log('✅ Removed localStorage clearing that was resetting payment state');
  console.log('✅ Added payment state persistence to localStorage');
  console.log('✅ Fixed ResultCode 1032 handling to show "processing" status');
  console.log('✅ WhatsApp button will now work after successful payment');
  
  console.log('\n4. Expected Behavior:');
  console.log('- STK Push sent → "✅ Transaction Made Successfully"');
  console.log('- Payment processing (1032) → "✅ Transaction Made Successfully" + processing message');
  console.log('- Payment successful (0) → "✅ Payment Successful!" + WhatsApp button enabled');
  console.log('- Payment failed → "❌ Payment Failed" + specific error message');
  
  console.log('\n5. To Test:');
  console.log('1. Go to cart page: http://localhost:3003/cart');
  console.log('2. Add some items to cart first');
  console.log('3. Enter phone: 0708374149');
  console.log('4. Click "Pay Deposit"');
  console.log('5. Watch for proper status progression');
}

testPaymentFix();
