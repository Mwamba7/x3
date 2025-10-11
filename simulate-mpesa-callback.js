/**
 * SIMULATE M-PESA CALLBACK FOR LOCAL TESTING
 * This simulates what M-Pesa would send to your server
 */

console.log('📱 SIMULATING M-PESA CALLBACK FOR LOCAL TESTING')
console.log('===============================================\n')

const BASE_URL = 'http://localhost:3001'

// Function to simulate successful payment callback
async function simulateSuccessfulPayment(checkoutRequestId) {
  console.log('✅ Simulating SUCCESSFUL M-Pesa payment...')
  console.log('Checkout Request ID:', checkoutRequestId)
  
  const mockSuccessCallback = {
    Body: {
      stkCallback: {
        MerchantRequestID: 'merchant-' + Date.now(),
        CheckoutRequestID: checkoutRequestId,
        ResultCode: 0, // 0 = Success
        ResultDesc: 'The service request is processed successfully.',
        CallbackMetadata: {
          Item: [
            { Name: 'Amount', Value: 200 },
            { Name: 'MpesaReceiptNumber', Value: 'SIM' + Date.now() },
            { Name: 'TransactionDate', Value: parseInt(new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3)) },
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
    console.log('📨 Callback sent successfully:', data)
    
    // Verify the payment was stored
    const statusCheck = await fetch(`${BASE_URL}/api/mpesa/payment-callback?checkoutRequestId=${checkoutRequestId}`)
    const statusData = await statusCheck.json()
    
    if (statusData.success && statusData.found && statusData.data.status === 'success') {
      console.log('✅ Payment confirmation stored successfully!')
      console.log('💰 Payment details:', statusData.data.metadata)
      return true
    } else {
      console.log('❌ Payment confirmation failed')
      return false
    }
    
  } catch (error) {
    console.log('❌ Error simulating callback:', error.message)
    return false
  }
}

// Function to simulate failed payment callback
async function simulateFailedPayment(checkoutRequestId) {
  console.log('❌ Simulating FAILED M-Pesa payment...')
  console.log('Checkout Request ID:', checkoutRequestId)
  
  const mockFailedCallback = {
    Body: {
      stkCallback: {
        MerchantRequestID: 'merchant-' + Date.now(),
        CheckoutRequestID: checkoutRequestId,
        ResultCode: 1032, // User cancelled
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
    console.log('📨 Failed callback sent:', data)
    return true
    
  } catch (error) {
    console.log('❌ Error simulating failed callback:', error.message)
    return false
  }
}

// Interactive testing
async function interactiveTest() {
  console.log('🧪 INTERACTIVE CALLBACK TESTING')
  console.log('================================\n')
  
  console.log('HOW TO USE:')
  console.log('1. Go to http://localhost:3001/cart')
  console.log('2. Add items and click "Pay Deposit"')
  console.log('3. Copy the checkout request ID from browser console')
  console.log('4. Run this script with the ID\n')
  
  // Example usage
  const exampleCheckoutId = 'example-checkout-' + Date.now()
  
  console.log('📋 EXAMPLE USAGE:')
  console.log(`node simulate-mpesa-callback.js ${exampleCheckoutId}`)
  console.log('')
  
  // If checkout ID provided as argument
  const checkoutId = process.argv[2]
  if (checkoutId) {
    console.log(`🎯 Testing with Checkout ID: ${checkoutId}`)
    
    // Ask user what to simulate
    console.log('\nWhat would you like to simulate?')
    console.log('1. Successful payment')
    console.log('2. Failed payment')
    
    // For demo, simulate success
    const success = await simulateSuccessfulPayment(checkoutId)
    
    if (success) {
      console.log('\n🎉 SUCCESS! Go back to your cart page and see:')
      console.log('✅ Cart should be locked')
      console.log('✅ WhatsApp checkout should be enabled')
      console.log('✅ Success message should appear')
    }
  } else {
    console.log('💡 To test with a real checkout ID:')
    console.log('node simulate-mpesa-callback.js YOUR_CHECKOUT_REQUEST_ID')
  }
}

// Run interactive test
interactiveTest().catch(console.error)
