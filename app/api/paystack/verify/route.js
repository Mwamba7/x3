import { NextResponse } from 'next/server'

// Paystack configuration
const PAYSTACK_CONFIG = {
  secretKey: process.env.PAYSTACK_SECRET_KEY,
  baseUrl: 'https://api.paystack.co'
}

export async function POST(request) {
  try {
    console.log('🔍 Paystack payment verification...')
    
    const { reference } = await request.json()

    // Validate input
    if (!reference) {
      return NextResponse.json({
        success: false,
        error: 'Transaction reference is required'
      }, { status: 400 })
    }

    // Validate configuration
    if (!PAYSTACK_CONFIG.secretKey) {
      console.error('❌ Paystack secret key not configured')
      return NextResponse.json({
        success: false,
        error: 'Paystack service not properly configured'
      }, { status: 500 })
    }

    console.log('🔍 Verifying transaction:', reference)

    // Verify transaction with Paystack
    const response = await fetch(`${PAYSTACK_CONFIG.baseUrl}/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_CONFIG.secretKey}`,
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()
    
    console.log('📊 Verification Response Status:', response.status)
    console.log('📊 Verification Response Data:', data)

    if (response.ok && data.status) {
      const transaction = data.data
      
      console.log('✅ Transaction verification successful')
      
      // Determine payment status
      let paymentStatus = 'pending'
      let statusMessage = 'Payment is being processed'
      
      if (transaction.status === 'success') {
        paymentStatus = 'paid'
        statusMessage = 'Payment completed successfully'
      } else if (transaction.status === 'failed') {
        paymentStatus = 'failed'
        statusMessage = 'Payment failed'
      } else if (transaction.status === 'abandoned') {
        paymentStatus = 'failed'
        statusMessage = 'Payment was abandoned'
      }
      
      return NextResponse.json({
        success: true,
        status: paymentStatus,
        message: statusMessage,
        transaction: {
          reference: transaction.reference,
          amount: transaction.amount / 100, // Convert back from kobo
          currency: transaction.currency,
          status: transaction.status,
          paidAt: transaction.paid_at,
          customer: transaction.customer,
          metadata: transaction.metadata
        }
      })
      
    } else {
      console.error('❌ Transaction verification failed:', {
        status: data.status,
        message: data.message
      })
      
      return NextResponse.json({
        success: false,
        error: data.message || 'Transaction verification failed',
        details: {
          status: data.status
        }
      }, { status: 400 })
    }

  } catch (error) {
    console.error('💥 Transaction verification error:', error)
    return NextResponse.json({
      success: false,
      error: 'Payment verification service temporarily unavailable',
      details: error.message
    }, { status: 500 })
  }
}
