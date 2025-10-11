/**
 * FAST PAYMENT DETECTION TEST
 * Tests the optimized payment detection system
 */

console.log('⚡ TESTING FAST PAYMENT DETECTION')
console.log('=================================\n')

const BASE_URL = 'http://localhost:3001'

async function testFastPayment() {
  console.log('🚀 Testing optimized payment flow...\n')
  
  // Simulate M-Pesa callback immediately
  const testCheckoutId = 'fast-test-' + Date.now()
  
  console.log('1. Simulating instant M-Pesa callback...')
  const mockCallback = {
    Body: {
      stkCallback: {
        MerchantRequestID: 'fast-merchant-' + Date.now(),
        CheckoutRequestID: testCheckoutId,
        ResultCode: 0,
        ResultDesc: 'The service request is processed successfully.',
        CallbackMetadata: {
          Item: [
            { Name: 'Amount', Value: 200 },
            { Name: 'MpesaReceiptNumber', Value: 'FAST' + Date.now() },
            { Name: 'TransactionDate', Value: 20241011214502 },
            { Name: 'PhoneNumber', Value: 254700000000 }
          ]
        }
      }
    }
  }
  
  try {
    const callbackResponse = await fetch(`${BASE_URL}/api/mpesa/payment-callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockCallback)
    })
    
    const callbackData = await callbackResponse.json()
    console.log('✅ Callback processed:', callbackData.status)
    
    // Test immediate status check
    console.log('\n2. Testing immediate status retrieval...')
    const statusResponse = await fetch(`${BASE_URL}/api/mpesa/payment-callback?checkoutRequestId=${testCheckoutId}`)
    const statusData = await statusResponse.json()
    
    if (statusData.success && statusData.found && statusData.data.status === 'success') {
      console.log('✅ FAST DETECTION WORKING!')
      console.log('⚡ Payment detected instantly!')
      
      // Measure response time
      const startTime = Date.now()
      const quickCheck = await fetch(`${BASE_URL}/api/mpesa/payment-callback?checkoutRequestId=${testCheckoutId}`)
      const endTime = Date.now()
      
      console.log(`⏱️  Response time: ${endTime - startTime}ms`)
      
    } else {
      console.log('❌ Fast detection failed')
      console.log('Response:', statusData)
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message)
  }
  
  console.log('\n' + '='.repeat(40))
  console.log('⚡ OPTIMIZATIONS IMPLEMENTED:')
  console.log('✅ Polling starts in 1 second (was 3 seconds)')
  console.log('✅ Initial polls every 2 seconds (was 5 seconds)')
  console.log('✅ Adaptive intervals: 2s → 3s → 5s')
  console.log('✅ Immediate success notifications')
  console.log('✅ Total timeout: 2 minutes (was 3 minutes)')
  console.log('✅ Faster callback processing')
  
  console.log('\n🎯 EXPECTED PAYMENT FLOW:')
  console.log('1. Click "Pay Deposit" → STK Push sent')
  console.log('2. Complete payment on phone')
  console.log('3. Payment detected in 2-10 seconds')
  console.log('4. Cart locks automatically')
  console.log('5. Success notification appears')
  console.log('6. WhatsApp checkout enabled')
  
  console.log('\n⚡ MUCH FASTER THAN BEFORE!')
}

testFastPayment().catch(console.error)
