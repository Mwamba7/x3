/**
 * Test M-Pesa Payment State Detection
 * This script simulates different M-Pesa result codes to test payment state detection
 */

// Simulate the payment status detection logic
function detectPaymentStatus(resultCode, resultDesc) {
  const code = String(resultCode);
  let paymentStatus = 'failed';
  let errorMessage = resultDesc || 'Payment failed. Please try again.';
  
  switch (code) {
    case '0':
      return { status: 'success', message: 'Payment successful!' };
      
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
      
    case '1032':
      errorMessage = 'Payment is still being processed. Please wait...';
      paymentStatus = 'processing';
      break;
      
    case '1037':
      errorMessage = 'Payment timeout. Please try again.';
      break;
      
    default:
      if (resultDesc && (
        resultDesc.toLowerCase().includes('cancel') || 
        resultDesc.toLowerCase().includes('abort') ||
        resultDesc.toLowerCase().includes('reject')
      )) {
        errorMessage = 'Payment was cancelled. Please try again.';
        paymentStatus = 'cancelled';
      }
  }
  
  return { status: paymentStatus, message: errorMessage };
}

// Test different scenarios
console.log('🧪 Testing M-Pesa Payment State Detection');
console.log('==========================================\n');

const testCases = [
  { code: '0', desc: 'Success', expected: 'success' },
  { code: '1', desc: 'Insufficient funds', expected: 'failed' },
  { code: '17', desc: 'Request cancelled by user', expected: 'cancelled' },
  { code: '1025', desc: 'User cancelled', expected: 'cancelled' },
  { code: '1032', desc: 'Request is being processed', expected: 'processing' },
  { code: '1037', desc: 'Timeout', expected: 'failed' },
  { code: '999', desc: 'User cancelled the transaction', expected: 'cancelled' },
  { code: '888', desc: 'Transaction was aborted', expected: 'cancelled' },
  { code: '777', desc: 'Unknown error occurred', expected: 'failed' }
];

testCases.forEach((testCase, index) => {
  const result = detectPaymentStatus(testCase.code, testCase.desc);
  const isCorrect = result.status === testCase.expected;
  
  console.log(`Test ${index + 1}: ${isCorrect ? '✅' : '❌'}`);
  console.log(`  Code: ${testCase.code}`);
  console.log(`  Description: ${testCase.desc}`);
  console.log(`  Expected: ${testCase.expected}`);
  console.log(`  Got: ${result.status}`);
  console.log(`  Message: ${result.message}`);
  console.log('');
});

console.log('🎯 Payment State Detection Summary:');
console.log('- ✅ Success (Code 0): Payment completed successfully');
console.log('- 🚫 Cancelled (Codes 17, 1025, or "cancel" in description): User cancelled payment');
console.log('- ⏳ Processing (Code 1032): Payment still being processed');
console.log('- ❌ Failed (Other codes): Payment failed for various reasons');
console.log('- ⏱️ Timeout: Payment verification timed out');
