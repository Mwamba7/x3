/**
 * Test Phone Number Validation
 */

async function testPhoneValidation() {
  console.log('📱 Testing Phone Number Validation');
  console.log('==================================\n');

  const testCases = [
    { phone: '254708374149', expected: 'valid', description: 'Valid Safaricom number' },
    { phone: '254718176584', expected: 'valid', description: 'Valid Safaricom number' },
    { phone: '254101234567', expected: 'valid', description: 'Valid Airtel number' },
    { phone: '0708374149', expected: 'valid', description: 'Valid format with 0 prefix' },
    { phone: '0718176584', expected: 'valid', description: 'Valid format with 0 prefix' },
    { phone: '0101234567', expected: 'valid', description: 'Valid Airtel with 0 prefix' },
    { phone: '708374149', expected: 'valid', description: 'Valid without prefix' },
    { phone: '718176584', expected: 'valid', description: 'Valid without prefix' },
    { phone: '101234567', expected: 'valid', description: 'Valid Airtel without prefix' },
    { phone: '123456789', expected: 'invalid', description: 'Invalid - wrong prefix' },
    { phone: '254123456789', expected: 'invalid', description: 'Invalid - wrong network code' },
    { phone: '25470837414', expected: 'invalid', description: 'Invalid - too short' },
    { phone: '2547083741499', expected: 'invalid', description: 'Invalid - too long' },
    { phone: 'abcd1234567', expected: 'invalid', description: 'Invalid - contains letters' },
    { phone: '', expected: 'invalid', description: 'Empty phone number' }
  ];

  for (const testCase of testCases) {
    console.log(`Testing: ${testCase.phone || '(empty)'}`);
    console.log(`Expected: ${testCase.expected} - ${testCase.description}`);
    
    try {
      const response = await fetch('http://localhost:3003/api/mpesa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: testCase.phone,
          amount: 100,
          accountReference: 'TEST-ORDER',
          transactionDesc: 'Test payment'
        })
      });
      
      const data = await response.json();
      
      if (testCase.expected === 'valid') {
        if (response.status === 200 && data.success) {
          console.log('✅ PASS - Valid number accepted');
        } else {
          console.log(`❌ FAIL - Valid number rejected: ${data.message}`);
        }
      } else {
        if (response.status === 400 && !data.success) {
          console.log('✅ PASS - Invalid number rejected');
        } else {
          console.log(`❌ FAIL - Invalid number accepted: Status ${response.status}`);
        }
      }
      
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
    }
    
    console.log('');
  }
}

testPhoneValidation();
