/**
 * Test Payment Success Flow
 * This script simulates a successful payment to verify WhatsApp button activation
 */

async function testPaymentSuccess() {
  console.log('🧪 Testing Payment Success Flow');
  console.log('===============================\n');

  console.log('1. Testing STK Push Request...');
  
  try {
    // Step 1: Send STK Push
    const stkResponse = await fetch('http://localhost:3003/api/mpesa', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: '0708374149',
        amount: 100,
        accountReference: 'SUCCESS-TEST',
        transactionDesc: 'Test successful payment flow'
      })
    });
    
    const stkData = await stkResponse.json();
    
    console.log(`📊 STK Push Response:`);
    console.log(`  Status: ${stkResponse.status}`);
    console.log(`  Success: ${stkData.success}`);
    console.log(`  Message: ${stkData.message}`);
    
    if (stkData.success && stkData.checkoutRequestId) {
      console.log(`  CheckoutRequestId: ${stkData.checkoutRequestId}`);
      
      console.log('\n2. Testing Payment Status Check...');
      
      // Step 2: Check payment status multiple times to simulate polling
      for (let i = 1; i <= 5; i++) {
        console.log(`\nAttempt ${i}:`);
        
        const statusResponse = await fetch(`http://localhost:3003/api/mpesa?checkoutRequestId=${stkData.checkoutRequestId}`);
        const statusData = await statusResponse.json();
        
        console.log(`  Status Query Success: ${statusData.success}`);
        
        if (statusData.success && statusData.data) {
          const { ResultCode, ResultDesc } = statusData.data;
          console.log(`  ResultCode: ${ResultCode}`);
          console.log(`  ResultDesc: ${ResultDesc}`);
          
          // Simulate the frontend logic
          const resultCode = String(ResultCode);
          
          if (resultCode === '0') {
            console.log(`  🎉 PAYMENT SUCCESSFUL!`);
            console.log(`  Expected State:`);
            console.log(`    - paymentStatus: 'success'`);
            console.log(`    - depositPaid: true`);
            console.log(`    - WhatsApp button: ENABLED`);
            console.log(`    - Notification: "✅ Payment Successful!"`);
            break;
          } else if (resultCode === '1032') {
            console.log(`  ⏳ Still processing...`);
            console.log(`  Expected State:`);
            console.log(`    - paymentStatus: 'processing'`);
            console.log(`    - depositPaid: false`);
            console.log(`    - WhatsApp button: DISABLED`);
            console.log(`    - Notification: "✅ Transaction Made Successfully"`);
          } else if (resultCode) {
            console.log(`  ❌ Payment failed with code: ${resultCode}`);
            console.log(`  Expected State:`);
            console.log(`    - paymentStatus: 'failed'`);
            console.log(`    - depositPaid: false`);
            console.log(`    - WhatsApp button: DISABLED`);
            console.log(`    - Notification: "❌ Payment Failed"`);
            break;
          } else {
            console.log(`  ⏳ No result code yet, continuing...`);
          }
        } else {
          console.log(`  ⏳ No data received, continuing...`);
        }
        
        // Wait 2 seconds before next attempt
        if (i < 5) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    } else {
      console.log(`❌ STK Push failed: ${stkData.message}`);
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  console.log('\n3. WhatsApp Button Logic Check:');
  console.log('');
  console.log('The WhatsApp button should be enabled when:');
  console.log('✅ mpesaPayment.depositPaid === true');
  console.log('✅ mpesaPayment.paymentStatus === "success"');
  console.log('');
  console.log('Button states:');
  console.log('🔒 DISABLED: "🔒 Pay Deposit First to Checkout"');
  console.log('✅ ENABLED:  "✅ Complete Order via WhatsApp"');
  console.log('');

  console.log('4. Notification Status Check:');
  console.log('');
  console.log('Payment status notifications:');
  console.log('⏳ pending:    "⏳ Processing Payment..."');
  console.log('✅ processing: "✅ Transaction Made Successfully"');
  console.log('✅ success:    "✅ Payment Successful!"');
  console.log('❌ failed:     "❌ Payment Failed"');
  console.log('🚫 cancelled:  "🚫 Payment Cancelled"');
  console.log('⏱️ timeout:    "⏱️ Payment Timeout"');
  console.log('');

  console.log('5. Expected Success Flow:');
  console.log('1. User clicks "Pay Deposit"');
  console.log('2. Shows "✅ Transaction Made Successfully" (processing)');
  console.log('3. After 10 seconds: "⏳ Processing Payment..." (pending)');
  console.log('4. User completes M-Pesa PIN');
  console.log('5. Shows "✅ Payment Successful!" (success)');
  console.log('6. WhatsApp button changes to "✅ Complete Order via WhatsApp"');
  console.log('7. Order summary shows "✅ Deposit Paid (20%)"');
  console.log('');

  console.log('🎯 If WhatsApp button is not enabling:');
  console.log('- Check browser console for payment state logs');
  console.log('- Verify localStorage has correct payment state');
  console.log('- Ensure both depositPaid=true AND paymentStatus="success"');
  console.log('- Check if page refresh preserves payment state');
}

testPaymentSuccess();
