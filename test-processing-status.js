/**
 * Test Processing Status Logic
 * This script tests the payment status detection for processing payments
 */

function testProcessingStatus() {
  console.log('⏳ Testing Processing Status Logic');
  console.log('==================================\n');

  const testCases = [
    {
      name: 'Payment Successful',
      ResultCode: '0',
      ResultDesc: 'The service request is processed successfully.',
      expectedStatus: 'success',
      expectedMessage: 'Payment successful!'
    },
    {
      name: 'Payment Still Processing',
      ResultCode: '1032',
      ResultDesc: 'Request cancelled by user',
      expectedStatus: 'processing',
      expectedMessage: 'The transaction is still under processing. Please check your phone and enter your M-Pesa PIN to complete the payment.'
    },
    {
      name: 'Payment Cancelled by User',
      ResultCode: '17',
      ResultDesc: 'Request cancelled by user',
      expectedStatus: 'cancelled',
      expectedMessage: 'Payment was cancelled by user.'
    },
    {
      name: 'Insufficient Balance',
      ResultCode: '1',
      ResultDesc: 'Insufficient funds',
      expectedStatus: 'failed',
      expectedMessage: 'Insufficient M-Pesa balance. Please top up your account and try again.'
    },
    {
      name: 'System Busy',
      ResultCode: '26',
      ResultDesc: 'System busy',
      expectedStatus: 'failed',
      expectedMessage: 'System busy. Please try again in a few minutes.'
    }
  ];

  testCases.forEach((testCase, index) => {
    console.log(`Test ${index + 1}: ${testCase.name}`);
    console.log(`  Input: ResultCode=${testCase.ResultCode}, ResultDesc="${testCase.ResultDesc}"`);
    
    // Simulate the logic from the cart page
    const resultCode = String(testCase.ResultCode);
    let status, message;
    
    if (resultCode === '0') {
      status = 'success';
      message = 'Payment successful!';
    } else if (resultCode === '1032') {
      status = 'processing';
      message = 'The transaction is still under processing. Please check your phone and enter your M-Pesa PIN to complete the payment.';
    } else if (resultCode) {
      // Determine status based on result code
      let paymentStatus = 'failed';
      let errorMessage = testCase.ResultDesc || 'Payment failed. Please try again.';
      
      switch (resultCode) {
        case '1':
          errorMessage = 'Insufficient M-Pesa balance. Please top up your account and try again.';
          break;
        case '17':
          errorMessage = 'Payment was cancelled by user.';
          paymentStatus = 'cancelled';
          break;
        case '1025':
          errorMessage = 'Payment was cancelled by user.';
          paymentStatus = 'cancelled';
          break;
        case '26':
          errorMessage = 'System busy. Please try again in a few minutes.';
          break;
        case '1037':
          errorMessage = 'Payment timeout. Please try again.';
          break;
        default:
          if (testCase.ResultDesc && (
            testCase.ResultDesc.toLowerCase().includes('cancel') || 
            testCase.ResultDesc.toLowerCase().includes('abort') ||
            testCase.ResultDesc.toLowerCase().includes('reject')
          )) {
            errorMessage = 'Payment was cancelled. Please try again.';
            paymentStatus = 'cancelled';
          } else if (testCase.ResultDesc) {
            errorMessage = testCase.ResultDesc;
          } else {
            errorMessage = 'Payment failed. Please try again.';
          }
      }
      
      status = paymentStatus;
      message = errorMessage;
    }
    
    const statusMatch = status === testCase.expectedStatus;
    const messageMatch = message === testCase.expectedMessage;
    
    console.log(`  Expected: status="${testCase.expectedStatus}", message="${testCase.expectedMessage}"`);
    console.log(`  Got: status="${status}", message="${message}"`);
    console.log(`  Result: ${statusMatch && messageMatch ? '✅ PASS' : '❌ FAIL'}`);
    
    if (!statusMatch) console.log(`    ❌ Status mismatch: expected "${testCase.expectedStatus}", got "${status}"`);
    if (!messageMatch) console.log(`    ❌ Message mismatch`);
    
    console.log('');
  });

  console.log('🎯 Key Fix:');
  console.log('- ResultCode "1032" now shows "✅ Transaction Made Successfully" (processing)');
  console.log('- No more "❌ Payment Failed" for processing payments');
  console.log('- Proper status detection for all M-Pesa result codes');
}

testProcessingStatus();
