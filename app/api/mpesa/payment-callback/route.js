import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// In-memory storage for payment results (for development)
// In production, you should use a proper database or Redis
const paymentResults = new Map()

export async function POST(request) {
  try {
    const callbackData = await request.json()
    
    console.log('🔔 M-Pesa Callback received at:', new Date().toISOString())
    console.log('📦 Callback Data:', JSON.stringify(callbackData, null, 2))

    // Extract callback data
    const { Body } = callbackData
    if (!Body || !Body.stkCallback) {
      console.error('❌ Invalid callback structure - missing Body or stkCallback')
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid callback structure',
        received: callbackData 
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

    console.log('🔍 Processing payment callback:')
    console.log('  - Checkout Request ID:', CheckoutRequestID)
    console.log('  - Result Code:', ResultCode)
    console.log('  - Result Description:', ResultDesc)

    // Create payment result object
    const paymentResult = {
      merchantRequestId: MerchantRequestID,
      checkoutRequestId: CheckoutRequestID,
      resultCode: ResultCode,
      resultDesc: ResultDesc,
      timestamp: new Date().toISOString(),
      status: ResultCode === 0 ? 'success' : 'failed',
      processed: true
    }

    // Extract additional data if payment was successful
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
    }

    // Store payment result in memory (for immediate polling)
    paymentResults.set(CheckoutRequestID, paymentResult)
    console.log('💾 Payment result stored in memory for checkout ID:', CheckoutRequestID)
    
    // Also store with a TTL for faster cleanup
    setTimeout(() => {
      if (paymentResults.has(CheckoutRequestID)) {
        console.log('🧹 Auto-cleaning old payment result:', CheckoutRequestID)
        paymentResults.delete(CheckoutRequestID)
      }
    }, 10 * 60 * 1000) // Clean after 10 minutes

    // Try to extract cart ID from account reference if available
    let cartId = null
    if (paymentResult.status === 'success') {
      console.log('✅ Payment successful for checkout request:', CheckoutRequestID)
      console.log('💰 Payment metadata:', paymentResult.metadata)
    } else {
      console.log('❌ Payment failed for checkout request:', CheckoutRequestID)
      console.log('📝 Failure reason:', ResultDesc)
    }

    // TODO: Update database with payment status
    // This is where you would update your orders/carts table
    /*
    try {
      if (cartId) {
        await prisma.cart.update({
          where: { id: cartId },
          data: {
            status: paymentResult.status === 'success' ? 'deposit_paid' : 'active',
            depositPaid: paymentResult.status === 'success',
            paymentDetails: JSON.stringify(paymentResult)
          }
        })
      }
    } catch (dbError) {
      console.error('Database update error:', dbError)
    }
    */

    console.log('✅ Payment result processing completed:', paymentResult.status)

    // Respond to M-Pesa (they expect a 200 response)
    return NextResponse.json({ 
      success: true, 
      message: 'Callback processed successfully',
      checkoutRequestId: CheckoutRequestID,
      status: paymentResult.status
    })

  } catch (error) {
    console.error('Error processing M-Pesa callback:', error)
    
    // Still return 200 to M-Pesa to avoid retries
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      message: 'Callback received but processing failed'
    })
  }
}

// Endpoint to check payment status (for frontend polling)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const checkoutRequestId = searchParams.get('checkoutRequestId')

    console.log('🔍 Payment status check requested for:', checkoutRequestId)

    if (!checkoutRequestId) {
      console.log('❌ Missing checkoutRequestId parameter')
      return NextResponse.json(
        { success: false, error: 'Missing checkoutRequestId parameter' },
        { status: 400 }
      )
    }

    // Check if we have a payment result
    const paymentResult = paymentResults.get(checkoutRequestId)

    if (paymentResult) {
      console.log('✅ Payment result found:', paymentResult.status)
      return NextResponse.json({
        success: true,
        found: true,
        data: paymentResult,
        timestamp: new Date().toISOString()
      })
    } else {
      console.log('⏳ Payment result not yet received for:', checkoutRequestId)
      console.log('📊 Current stored results:', Array.from(paymentResults.keys()))
      return NextResponse.json({
        success: true,
        found: false,
        message: 'Payment result not yet received',
        checkoutRequestId,
        timestamp: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('Error checking payment status:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Clean up old payment results (optional - for memory management)
setInterval(() => {
  const now = Date.now()
  const maxAge = 30 * 60 * 1000 // 30 minutes
  
  for (const [key, result] of paymentResults.entries()) {
    const resultTime = new Date(result.timestamp).getTime()
    if (now - resultTime > maxAge) {
      paymentResults.delete(key)
    }
  }
}, 5 * 60 * 1000) // Clean every 5 minutes
