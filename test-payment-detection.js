/**
 * Test script to verify M-Pesa payment detection flow
 * This script helps diagnose payment detection issues
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'

// Test payment callback endpoint
async function testPaymentCallback() {
  console.log('🧪 Testing M-Pesa Payment Detection Flow...\n')
  
  // Test 1: Check if callback endpoint is accessible
  console.log('1. Testing callback endpoint accessibility...')
  try {
    const response = await fetch(`${BASE_URL}/api/mpesa/payment-callback?checkoutRequestId=test123`)
    const data = await response.json()
    console.log('✅ Callback endpoint is accessible')
    console.log('Response:', data)
  } catch (error) {
    console.log('❌ Callback endpoint error:', error.message)
  }
  
  console.log('\n' + '='.repeat(50) + '\n')
  
  // Test 2: Simulate a successful payment callback
  console.log('2. Simulating successful payment callback...')
  const mockSuccessCallback = {
    Body: {
      stkCallback: {
        MerchantRequestID: 'test-merchant-123',
        CheckoutRequestID: 'test-checkout-456',
        ResultCode: 0,
        ResultDesc: 'The service request is processed successfully.',
        CallbackMetadata: {
          Item: [
            { Name: 'Amount', Value: 200 },
            { Name: 'MpesaReceiptNumber', Value: 'TEST123456' },
            { Name: 'TransactionDate', Value: 20241011210500 },
            { Name: 'PhoneNumber', Value: 254700000000 }
          ]
        }
      }
    }
  }
  
  try {
    const response = await fetch(`${BASE_URL}/api/mpesa/payment-callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockSuccessCallback)
    })
    
    const data = await response.json()
    console.log('✅ Mock payment callback processed')
    console.log('Response:', data)
    
    // Test 3: Check if payment status can be retrieved
    console.log('\n3. Testing payment status retrieval...')
    const statusResponse = await fetch(`${BASE_URL}/api/mpesa/payment-callback?checkoutRequestId=test-checkout-456`)
    const statusData = await statusResponse.json()
    console.log('Payment status check:', statusData)
    
    if (statusData.success && statusData.found && statusData.data.status === 'success') {
      console.log('✅ Payment detection working correctly!')
    } else {
      console.log('❌ Payment detection issue found')
    }
    
  } catch (error) {
    console.log('❌ Mock callback error:', error.message)
  }
  
  console.log('\n' + '='.repeat(50) + '\n')
  
  // Test 4: Simulate failed payment
  console.log('4. Simulating failed payment callback...')
  const mockFailedCallback = {
    Body: {
      stkCallback: {
        MerchantRequestID: 'test-merchant-789',
        CheckoutRequestID: 'test-checkout-failed',
        ResultCode: 1032,
        ResultDesc: 'Request cancelled by user'
      }
    }
  }
  
  try {
    const response = await fetch(`${BASE_URL}/api/mpesa/payment-callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockFailedCallback)
    })
    
    const data = await response.json()
    console.log('✅ Mock failed payment callback processed')
    
    // Check failed payment status
    const failedStatusResponse = await fetch(`${BASE_URL}/api/mpesa/payment-callback?checkoutRequestId=test-checkout-failed`)
    const failedStatusData = await failedStatusResponse.json()
    console.log('Failed payment status:', failedStatusData)
    
  } catch (error) {
    console.log('❌ Failed callback error:', error.message)
  }
  
  console.log('\n' + '='.repeat(50) + '\n')
  console.log('🏁 Payment detection test completed!')
  console.log('\n📋 TROUBLESHOOTING TIPS:')
  console.log('1. Ensure your Next.js server is running on the correct port')
  console.log('2. Check that NEXT_PUBLIC_BASE_URL environment variable is set correctly')
  console.log('3. Verify M-Pesa callback URL is configured to point to your server')
  console.log('4. Check browser console for any JavaScript errors on the cart page')
  console.log('5. Ensure localStorage is working (not in incognito mode)')
}

// Run the test
testPaymentCallback().catch(console.error)
