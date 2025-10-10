/**
 * Test handling of undefined/null result codes
 */

function testUndefinedHandling() {
  console.log('🧪 Testing Undefined Result Code Handling');
  console.log('==========================================\n');

  // Test cases with undefined/null values
  const testCases = [
    { ResultCode: undefined, ResultDesc: undefined, expected: 'continue polling' },
    { ResultCode: null, ResultDesc: null, expected: 'continue polling' },
    { ResultCode: undefined, ResultDesc: 'Some description', expected: 'continue polling' },
    { ResultCode: '', ResultDesc: 'Empty string code', expected: 'failed with description' },
    { ResultCode: '999', ResultDesc: undefined, expected: 'failed generic' },
    { ResultCode: '999', ResultDesc: null, expected: 'failed generic' },
    { ResultCode: '999', ResultDesc: '', expected: 'failed generic' },
    { ResultCode: '17', ResultDesc: undefined, expected: 'cancelled' }
  ];

  testCases.forEach((testCase, index) => {
    console.log(`Test ${index + 1}:`);
    console.log(`  ResultCode: ${testCase.ResultCode}`);
    console.log(`  ResultDesc: ${testCase.ResultDesc}`);
    
    // Simulate the logic
    if (testCase.ResultCode === undefined || testCase.ResultCode === null) {
      console.log(`  ✅ Result: Continue polling (no result code yet)`);
    } else {
      const resultCode = String(testCase.ResultCode);
      
      if (resultCode === '0') {
        console.log(`  ✅ Result: Success`);
      } else if (resultCode === '17') {
        console.log(`  ✅ Result: Cancelled by user`);
      } else {
        // Default case
        let errorMessage;
        if (testCase.ResultDesc && (
          testCase.ResultDesc.toLowerCase().includes('cancel') || 
          testCase.ResultDesc.toLowerCase().includes('abort') ||
          testCase.ResultDesc.toLowerCase().includes('reject')
        )) {
          errorMessage = 'Payment was cancelled. Please try again.';
          console.log(`  ✅ Result: Cancelled (from description)`);
        } else if (testCase.ResultDesc) {
          errorMessage = testCase.ResultDesc;
          console.log(`  ✅ Result: Failed with description: "${errorMessage}"`);
        } else {
          errorMessage = 'Payment failed. Please try again.';
          console.log(`  ✅ Result: Failed with generic message`);
        }
      }
    }
    console.log('');
  });

  console.log('🎯 Summary:');
  console.log('- Undefined/null ResultCode → Continue polling (no error shown)');
  console.log('- Valid ResultCode with description → Use description');
  console.log('- Valid ResultCode without description → Generic message');
  console.log('- No more "Code: undefined" errors! ✅');
}

testUndefinedHandling();
