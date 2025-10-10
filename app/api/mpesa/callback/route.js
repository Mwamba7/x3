import { NextResponse } from 'next/server'

// M-Pesa callback endpoint
export async function POST(request) {
  try {
    const callbackData = await request.json()
    
    console.log('M-Pesa Callback received:', JSON.stringify(callbackData, null, 2))
    
    // Extract callback data
    const { Body } = callbackData
    const { stkCallback } = Body
    
    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata
    } = stkCallback
    
    // Process the callback based on result code
    if (ResultCode === 0) {
      // Payment successful
      console.log('Payment successful:', {
        MerchantRequestID,
        CheckoutRequestID,
        ResultDesc
      })
      
      // Extract payment details from CallbackMetadata
      if (CallbackMetadata && CallbackMetadata.Item) {
        const metadata = {}
        CallbackMetadata.Item.forEach(item => {
          metadata[item.Name] = item.Value
        })
        
        console.log('Payment metadata:', metadata)
        
        // Here you can:
        // 1. Save payment details to database
        // 2. Update order status
        // 3. Send confirmation email/SMS
        // 4. Trigger any post-payment processes
        
        // For now, we'll just log the successful payment
        console.log('Payment processed successfully:', {
          amount: metadata.Amount,
          mpesaReceiptNumber: metadata.MpesaReceiptNumber,
          transactionDate: metadata.TransactionDate,
          phoneNumber: metadata.PhoneNumber
        })
      }
      
    } else {
      // Payment failed or cancelled
      console.log('Payment failed or cancelled:', {
        MerchantRequestID,
        CheckoutRequestID,
        ResultCode,
        ResultDesc
      })
    }
    
    // Always return success to M-Pesa to acknowledge receipt
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: 'Success'
    })
    
  } catch (error) {
    console.error('Callback processing error:', error)
    
    // Still return success to M-Pesa to avoid retries
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: 'Success'
    })
  }
}

// Handle GET requests (for testing)
export async function GET() {
  return NextResponse.json({
    message: 'M-Pesa callback endpoint is active',
    timestamp: new Date().toISOString()
  })
}
