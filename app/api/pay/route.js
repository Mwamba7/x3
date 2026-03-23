import { NextResponse } from 'next/server'

// Direct Paystack payment initialization (no redirect)
export async function POST(request) {
  try {
    console.log('💳 Direct Paystack payment initialization...')
    
    const { email, amount, phone, reference, metadata } = await request.json()

    // Validate input
    if (!email || !amount) {
      return NextResponse.json({
        success: false,
        error: 'Email and amount are required'
      }, { status: 400 })
    }

    // Paystack configuration
    const PAYSTACK_CONFIG = {
      secretKey: process.env.PAYSTACK_SECRET_KEY || 'sk_test_ad3ac47205d9d8631f936f4ffb733c987fd824a2',
      publicKey: process.env.PAYSTACK_PUBLIC_KEY || 'pk_test_afd9d8007310d8b197061be88fb8db9e0c8c736b',
      baseUrl: 'https://api.paystack.co',
      callbackUrl: process.env.PAYSTACK_CALLBACK_URL || 'https://chainless-unalgebraical-mistie.ngrok-free.dev',
      webhookUrl: process.env.PAYSTACK_WEBHOOK_URL || 'https://chainless-unalgebraical-mistie.ngrok-free.dev'
    }

    // Validate configuration
    if (!PAYSTACK_CONFIG.secretKey) {
      console.error('❌ Paystack secret key not configured')
      return NextResponse.json({
        success: false,
        error: 'Paystack service not properly configured'
      }, { status: 500 })
    }

    // Convert amount to kobo (Paystack uses smallest currency unit)
    const amountInKobo = Math.round(amount * 100)
    
    // Create unique reference
    const transactionRef = reference || `TXN${Date.now()}`
    
    // Prepare payment request
    const paymentRequest = {
      email: email,
      amount: amountInKobo,
      reference: transactionRef,
      callback_url: `${PAYSTACK_CONFIG.callbackUrl}/payment/callback`,
      metadata: {
        phone: phone,
        custom_fields: [
          {
            display_name: "Phone Number",
            variable_name: "phone",
            value: phone
          }
        ],
        ...metadata
      },
      channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
      currency: 'KES'
    }

    console.log('📤 Paystack request:', {
      ...paymentRequest,
      secretKey: '[HIDDEN]'
    })

    // Initialize payment with Paystack
    const response = await fetch(`${PAYSTACK_CONFIG.baseUrl}/transaction/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_CONFIG.secretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentRequest)
    })

    const data = await response.json()
    
    console.log('📊 Paystack Response Status:', response.status)
    console.log('📊 Paystack Response Data:', data)

    if (response.ok && data.status) {
      console.log('✅ Paystack payment initialized successfully')
      
      return NextResponse.json({
        success: true,
        message: 'Payment initialized successfully. Redirecting to payment page...',
        authorization_url: data.data.authorization_url,
        access_code: data.data.access_code,
        reference: data.data.reference,
        checkoutRequestId: data.data.reference, // For compatibility with existing frontend
        phone: phone,
        amount: amount,
        email: email
      })
    } else {
      console.error('❌ Paystack initialization failed:', {
        status: data.status,
        message: data.message,
        error: data.error
      })
      
      return NextResponse.json({
        success: false,
        error: data.message || 'Payment initialization failed',
        details: {
          status: data.status,
          error: data.error
        }
      }, { status: 400 })
    }

  } catch (error) {
    console.error('💥 Paystack initialization error:', error)
    return NextResponse.json({
      success: false,
      error: 'Payment service temporarily unavailable',
      details: error.message
    }, { status: 500 })
  }
}
