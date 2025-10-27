import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const callbackData = await request.json()
    
    // Log the callback for debugging
    console.log('M-Pesa Callback received:', JSON.stringify(callbackData, null, 2))
    
    // Extract payment details
    const stkCallback = callbackData.Body?.stkCallback
    
    if (stkCallback) {
      const resultCode = stkCallback.ResultCode
      const resultDesc = stkCallback.ResultDesc
      const checkoutRequestId = stkCallback.CheckoutRequestID
      
      if (resultCode === 0) {
        // Payment successful
        const callbackMetadata = stkCallback.CallbackMetadata?.Item || []
        const paymentDetails = {
          checkoutRequestId: checkoutRequestId,
          resultCode: resultCode,
          resultDesc: resultDesc
        }
        
        callbackMetadata.forEach(item => {
          switch (item.Name) {
            case 'Amount':
              paymentDetails.amount = item.Value
              break
            case 'MpesaReceiptNumber':
              paymentDetails.receiptNumber = item.Value
              break
            case 'TransactionDate':
              paymentDetails.transactionDate = item.Value
              break
            case 'PhoneNumber':
              paymentDetails.phoneNumber = item.Value
              break
          }
        })
        
        console.log('✅ Payment successful:', paymentDetails)
        
        // Here you could save to database or trigger other actions
        // For now, we'll just log it
        
      } else {
        // Payment failed
        console.log('❌ Payment failed:', {
          checkoutRequestId,
          resultCode,
          resultDesc
        })
      }
    }
    
    // Always return success to M-Pesa to avoid retries
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: 'Success'
    })
    
  } catch (error) {
    console.error('Callback processing error:', error)
    
    // Still return success to avoid M-Pesa retries
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: 'Success'
    })
  }
}
