import { NextResponse } from 'next/server'

/**
 * M-Pesa Callback Handler
 * Handles payment notifications from Safaricom Daraja API
 */

// In-memory storage for demo (use database in production)
const paymentResults = new Map()

// M-Pesa callback handler
export async function POST(request) {
  try {
    console.log('📞 M-Pesa callback received')
    
    const body = await request.json()
    console.log('📋 Callback payload:', JSON.stringify(body, null, 2))
    
    // Extract the callback data
    const { Body } = body
    
    if (Body && Body.stkCallback) {
      const { 
        MerchantRequestID, 
        CheckoutRequestID, 
        ResultCode, 
        ResultDesc,
        CallbackMetadata 
      } = Body.stkCallback
      
      console.log('📊 Transaction Status:', {
        MerchantRequestID,
        CheckoutRequestID,
        ResultCode,
        ResultDesc
      })
      
      // Store result for frontend polling
      const callbackResult = {
        MerchantRequestID,
        CheckoutRequestID,
        ResultCode,
        ResultDesc,
        timestamp: new Date().toISOString(),
        processed: true
      }
      
      // Process based on result code
      if (ResultCode === 0) {
        // Payment successful
        console.log('✅ Payment successful!')
        
        // Extract payment details from metadata
        if (CallbackMetadata && CallbackMetadata.Item) {
          const metadata = {}
          CallbackMetadata.Item.forEach(item => {
            metadata[item.Name] = item.Value
          })
          
          console.log('💰 Payment details:', {
            Amount: metadata.Amount,
            MpesaReceiptNumber: metadata.MpesaReceiptNumber,
            TransactionDate: metadata.TransactionDate,
            PhoneNumber: metadata.PhoneNumber
          })
          
          // Add payment details to result
          callbackResult.paymentDetails = {
            amount: metadata.Amount,
            mpesaReceiptNumber: metadata.MpesaReceiptNumber,
            transactionDate: metadata.TransactionDate,
            phoneNumber: metadata.PhoneNumber,
            balance: metadata.Balance
          }
        }
        
        callbackResult.status = 'success'
        
        // Here you would typically:
        // 1. Update your database with payment confirmation
        // 2. Send confirmation email/SMS to customer
        // 3. Update order status
        // 4. Trigger any post-payment workflows
        
      } else {
        // Payment failed or cancelled
        console.log('❌ Payment failed:', ResultDesc)
        callbackResult.status = 'failed'
        
        // Common failure codes:
        // 1032: Request cancelled by user
        // 1037: Timeout (user didn't enter PIN)
        // 2001: Wrong PIN entered too many times
        // 1001: Insufficient funds
        // 1019: Transaction failed
        
        // Handle failed payment
        // 1. Update database with failure status
        // 2. Notify customer of failure
        // 3. Log for analysis
      }
      
      // Store the result (use database in production)
      paymentResults.set(CheckoutRequestID, callbackResult)
      
      // Clean up old results (keep for 1 hour)
      setTimeout(() => {
        paymentResults.delete(CheckoutRequestID)
      }, 3600000)
      
    } else {
      console.log('⚠️ Invalid callback format received')
    }
    
    // Always return success to M-Pesa to stop retries
    return NextResponse.json({ 
      ResultCode: 0, 
      ResultDesc: 'Callback processed successfully' 
    })
    
  } catch (error) {
    console.error('❌ Callback processing error:', error)
    
    // Still return success to avoid M-Pesa retries
    return NextResponse.json({ 
      ResultCode: 0, 
      ResultDesc: 'Callback received' 
    })
  }
}

// GET endpoint to check callback results (for frontend polling)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const checkoutRequestId = searchParams.get('checkoutRequestId')
    
    if (!checkoutRequestId) {
      return NextResponse.json({
        success: false,
        error: 'MISSING_PARAMETER',
        message: 'CheckoutRequestID is required'
      }, { status: 400 })
    }
    
    const result = paymentResults.get(checkoutRequestId)
    
    if (result) {
      return NextResponse.json({
        success: true,
        data: result,
        found: true
      })
    } else {
      return NextResponse.json({
        success: true,
        data: null,
        found: false,
        message: 'No callback received yet'
      })
    }
    
  } catch (error) {
    console.error('❌ Callback check error:', error)
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to check callback status'
    }, { status: 500 })
  }
}
