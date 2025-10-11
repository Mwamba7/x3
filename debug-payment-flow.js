/**
 * Comprehensive Payment Flow Debugger
 * Run this script to diagnose M-Pesa payment detection issues
 * 
 * Usage: node debug-payment-flow.js
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

console.log('🔧 M-Pesa Payment Flow Debugger')
console.log('================================\n')

async function debugPaymentFlow() {
  console.log('🌐 Testing server connectivity...')
  
  // Step 1: Test server connectivity
  try {
    const healthCheck = await fetch(`${BASE_URL}/api/mpesa/payment-callback?test=health`)
    console.log('✅ Server is reachable')
  } catch (error) {
    console.log('❌ Server connectivity issue:', error.message)
    console.log('💡 Make sure your Next.js server is running!')
    return
  }
  
  console.log('\n📋 Step 1: Testing Payment Initiation...')
  
  // Step 2: Test payment initiation endpoint
  try {
    const initiateResponse = await fetch(`${BASE_URL}/api/mpesa/initiate-deposit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: '254700000000',
        cartTotal: 1000,
        cartId: 'debug-cart-123'
      })
    })
    
    const initiateData = await initiateResponse.json()
    console.log('Payment initiation response:', initiateData)
    
    if (initiateData.success) {
      console.log('✅ Payment initiation endpoint working')
      
      // Step 3: Simulate payment callback
      console.log('\n📋 Step 2: Simulating Payment Callback...')
      
      const mockCallback = {
        Body: {
          stkCallback: {
            MerchantRequestID: initiateData.merchantRequestId || 'debug-merchant-123',
            CheckoutRequestID: initiateData.checkoutRequestId || 'debug-checkout-456',
            ResultCode: 0,
            ResultDesc: 'The service request is processed successfully.',
            CallbackMetadata: {
              Item: [
                { Name: 'Amount', Value: 200 },
                { Name: 'MpesaReceiptNumber', Value: 'DEBUG123456' },
                { Name: 'TransactionDate', Value: 20241011210749 },
                { Name: 'PhoneNumber', Value: 254700000000 }
              ]
            }
          }
        }
      }
      
      const callbackResponse = await fetch(`${BASE_URL}/api/mpesa/payment-callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockCallback)
      })
      
      const callbackData = await callbackResponse.json()
      console.log('Callback response:', callbackData)
      
      if (callbackData.success) {
        console.log('✅ Payment callback processed successfully')
        
        // Step 4: Test status polling
        console.log('\n📋 Step 3: Testing Status Polling...')
        
        const checkoutRequestId = initiateData.checkoutRequestId || 'debug-checkout-456'
        
        // Wait a moment for processing
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const statusResponse = await fetch(`${BASE_URL}/api/mpesa/payment-callback?checkoutRequestId=${checkoutRequestId}`)
        const statusData = await statusResponse.json()
        
        console.log('Status check response:', statusData)
        
        if (statusData.success && statusData.found && statusData.data.status === 'success') {
          console.log('✅ Payment status polling working correctly!')
          console.log('🎉 PAYMENT DETECTION IS WORKING!')
          
          // Step 5: Test frontend integration
          console.log('\n📋 Step 4: Frontend Integration Check...')
          console.log('🔍 Check the following in your browser:')
          console.log('1. Open browser developer tools (F12)')
          console.log('2. Go to your cart page (/cart)')
          console.log('3. Check Console tab for any JavaScript errors')
          console.log('4. Check Network tab when making a payment')
          console.log('5. Check Application > Local Storage for saved payment state')
          
        } else {
          console.log('❌ Payment status not found or incorrect')
          console.log('🔍 Debugging info:')
          console.log('- Expected checkout ID:', checkoutRequestId)
          console.log('- Status response:', statusData)
        }
        
      } else {
        console.log('❌ Payment callback failed:', callbackData.error)
      }
      
    } else {
      console.log('❌ Payment initiation failed:', initiateData.error)
      console.log('💡 Check your M-Pesa environment variables:')
      console.log('- MPESA_CONSUMER_KEY')
      console.log('- MPESA_CONSUMER_SECRET')
      console.log('- MPESA_BUSINESS_SHORT_CODE')
      console.log('- MPESA_PASSKEY')
      console.log('- NEXT_PUBLIC_BASE_URL')
    }
    
  } catch (error) {
    console.log('❌ Payment initiation error:', error.message)
  }
  
  console.log('\n' + '='.repeat(50))
  console.log('🏁 Debug Complete!')
  console.log('\n📝 COMMON ISSUES & SOLUTIONS:')
  console.log('1. "Payment not detected" → Check server logs for callback reception')
  console.log('2. "Cart not locking" → Verify localStorage is working (not incognito)')
  console.log('3. "Polling timeout" → Check network connectivity and callback URL')
  console.log('4. "STK Push failed" → Verify M-Pesa credentials and phone number format')
  console.log('5. "Server errors" → Check environment variables and server logs')
  
  console.log('\n🔧 TROUBLESHOOTING STEPS:')
  console.log('1. Check browser console for JavaScript errors')
  console.log('2. Verify M-Pesa callback URL points to your server')
  console.log('3. Test with M-Pesa sandbox credentials first')
  console.log('4. Ensure your server is publicly accessible for callbacks')
  console.log('5. Check that localStorage is enabled in browser')
}

// Run the debug flow
debugPaymentFlow().catch(console.error)
