import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    console.log('🔍 Testing Paystack API call...')
    
    const { email, phone, amount, reference } = await request.json()
    
    // Paystack configuration
    const PAYSTACK_CONFIG = {
      secretKey: process.env.PAYSTACK_SECRET_KEY,
      publicKey: process.env.PAYSTACK_PUBLIC_KEY,
      baseUrl: 'https://api.paystack.co',
      callbackUrl: process.env.PAYSTACK_CALLBACK_URL,
      webhookUrl: process.env.PAYSTACK_WEBHOOK_URL
    }
    
    console.log('📊 Paystack Config:', {
      secretKey: PAYSTACK_CONFIG.secretKey ? 'SET' : 'NOT SET',
      publicKey: PAYSTACK_CONFIG.publicKey ? 'SET' : 'NOT SET',
      callbackUrl: PAYSTACK_CONFIG.callbackUrl,
      webhookUrl: PAYSTACK_CONFIG.webhookUrl
    })
    
    // Validate input
    if (!email || !amount) {
      return NextResponse.json({
        success: false,
        error: 'Email and amount are required'
      }, { status: 400 })
    }

    // Validate configuration
    if (!PAYSTACK_CONFIG.secretKey || !PAYSTACK_CONFIG.callbackUrl) {
      console.error('❌ Paystack secret key not configured')
      return NextResponse.json({
        success: false,
        error: 'Paystack service not properly configured'
      }, { status: 500 })
    }

    // Convert amount to kobo (Paystack uses smallest currency unit)
    const amountInKobo = Math.round(amount * 100)
    
    // Create unique reference
    const transactionRef = reference || `TEST${Date.now()}`
    
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
        ]
      },
      channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
      currency: 'KES'
    }

    console.log('📤 Paystack request prepared:', {
      ...paymentRequest,
      secretKey: '[HIDDEN]'
    })

    // Test the actual Paystack API call
    console.log('🌐 Making Paystack API call...')
    const response = await fetch(`${PAYSTACK_CONFIG.baseUrl}/transaction/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_CONFIG.secretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentRequest)
    })

    console.log('📊 Paystack API Response Status:', response.status)
    console.log('📊 Paystack API Response Headers:', Object.fromEntries(response.headers))

    const data = await response.json()
    console.log('📊 Paystack API Response Data:', data)

    if (response.ok && data.status) {
      console.log('✅ Paystack payment test successful')
      return NextResponse.json({
        success: true,
        message: 'Paystack API test successful',
        testResult: {
          status: data.status,
          authorization_url: data.data?.authorization_url,
          reference: data.data?.reference,
          access_code: data.data?.access_code
        }
      })
    } else {
      console.error('❌ Paystack API test failed:', {
        status: response.status,
        responseCode: data.ResponseCode,
        responseDescription: data.ResponseDescription,
        errorCode: data.errorCode,
        errorMessage: data.errorMessage,
        message: data.message
      })
      
      return NextResponse.json({
        success: false,
        error: data.message || data.errorMessage || 'Paystack API test failed',
        details: {
          httpStatus: response.status,
          responseCode: data.ResponseCode,
          errorCode: data.errorCode,
          fullResponse: data
        }
      }, { status: 400 })
    }

  } catch (error) {
    console.error('💥 Paystack test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Paystack test service temporarily unavailable',
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
