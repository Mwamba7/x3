import { NextResponse } from 'next/server'
import { storePaymentResult } from '../../../../lib/payment-storage'

export async function POST(request) {
  try {
    console.log('📞 M-Pesa callback received')
    
    const callbackData = await request.json()
    console.log('📊 Callback data:', JSON.stringify(callbackData, null, 2))

    // Extract the callback body
    const { Body } = callbackData
    
    if (!Body || !Body.stkCallback) {
      console.error('❌ Invalid callback structure')
      return NextResponse.json({
        ResultCode: 1,
        ResultDesc: 'Invalid callback structure'
      })
    }

    const { stkCallback } = Body
    const { 
      MerchantRequestID, 
      CheckoutRequestID, 
      ResultCode, 
      ResultDesc,
      CallbackMetadata 
    } = stkCallback

    console.log('🔍 Processing callback:', {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc
    })

    // Create payment result object
    const paymentResult = {
      merchantRequestId: MerchantRequestID,
      checkoutRequestId: CheckoutRequestID,
      resultCode: ResultCode,
      resultDesc: ResultDesc,
      timestamp: new Date().toISOString(),
      success: ResultCode === 0
    }

    // If payment was successful, extract metadata
    if (ResultCode === 0 && CallbackMetadata && CallbackMetadata.Item) {
      const metadata = {}
      
      CallbackMetadata.Item.forEach(item => {
        switch (item.Name) {
          case 'Amount':
            metadata.amount = item.Value
            break
          case 'MpesaReceiptNumber':
            metadata.mpesaReceiptNumber = item.Value
            break
          case 'TransactionDate':
            metadata.transactionDate = item.Value
            break
          case 'PhoneNumber':
            metadata.phoneNumber = item.Value
            break
        }
      })

      paymentResult.metadata = metadata
      console.log('✅ Payment successful:', metadata)
    } else {
      console.log('❌ Payment failed:', ResultDesc)
    }

    // Store the result using the new storage system
    await storePaymentResult(CheckoutRequestID, paymentResult)
    
    console.log('💾 Payment result stored for CheckoutRequestID:', CheckoutRequestID)

    // Respond to M-Pesa
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: 'Success'
    })

  } catch (error) {
    console.error('💥 Callback processing error:', error)
    
    return NextResponse.json({
      ResultCode: 1,
      ResultDesc: 'Internal server error'
    })
  }
}

// Export function to get payment result (for status checking)
export function getPaymentResult(checkoutRequestId) {
  return paymentResults.get(checkoutRequestId)
}

// Export function to clear old results (cleanup)
export function clearPaymentResult(checkoutRequestId) {
  return paymentResults.delete(checkoutRequestId)
}

// GET endpoint for testing callback functionality
export async function GET() {
  const { getAllPaymentResults, getMemoryStorageStats } = await import('../../../../lib/payment-storage')
  const allResults = await getAllPaymentResults()
  const memoryStats = getMemoryStorageStats()
  
  return NextResponse.json({
    message: 'M-Pesa callback endpoint is active',
    totalResults: allResults.length,
    memoryResults: memoryStats.size,
    recentResults: allResults.slice(-5).map(([key, value]) => ({
      checkoutRequestId: key,
      success: value.success,
      timestamp: value.timestamp,
      amount: value.metadata?.amount
    })),
    timestamp: new Date().toISOString()
  })
}
