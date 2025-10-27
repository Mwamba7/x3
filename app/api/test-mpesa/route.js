import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🧪 Testing M-Pesa integration...')
    
    // Test environment variables
    const config = {
      consumerKey: process.env.MPESA_CONSUMER_KEY ? '✅ Set' : '❌ Missing',
      consumerSecret: process.env.MPESA_CONSUMER_SECRET ? '✅ Set' : '❌ Missing',
      businessShortCode: process.env.MPESA_BUSINESS_SHORT_CODE || '174379',
      passkey: process.env.MPESA_PASSKEY ? '✅ Set' : '❌ Missing',
      environment: process.env.MPESA_ENVIRONMENT || 'sandbox',
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || '❌ Missing'
    }
    
    console.log('📊 M-Pesa Configuration:', config)
    
    // Test authentication
    let authResult = '❌ Not tested'
    try {
      const authResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/mpesa/auth`)
      const authData = await authResponse.json()
      authResult = authData.success ? '✅ Working' : `❌ Failed: ${authData.error}`
    } catch (error) {
      authResult = `❌ Error: ${error.message}`
    }
    
    return NextResponse.json({
      message: 'M-Pesa Integration Test',
      timestamp: new Date().toISOString(),
      configuration: config,
      authentication: authResult,
      endpoints: {
        auth: '/api/mpesa/auth',
        stkPush: '/api/mpesa/stk-push',
        callback: '/api/mpesa/callback',
        status: '/api/mpesa/status',
        debug: '/api/mpesa/debug'
      },
      testInstructions: {
        step1: 'Ensure all environment variables are set',
        step2: 'Test authentication endpoint',
        step3: 'Send STK Push with valid phone number',
        step4: 'Check payment status using CheckoutRequestID',
        step5: 'Verify callback receives payment confirmation'
      }
    })
    
  } catch (error) {
    console.error('💥 M-Pesa test error:', error)
    return NextResponse.json({
      error: 'M-Pesa test failed',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { phone, amount } = await request.json()
    
    console.log('🧪 Testing STK Push with:', { phone, amount })
    
    // Test STK Push
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    const stkResponse = await fetch(`${baseUrl}/api/mpesa/stk-push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: phone || '254712345678',
        amount: amount || 1,
        reference: `TEST_${Date.now()}`
      })
    })
    
    const stkData = await stkResponse.json()
    
    console.log('📊 STK Push test result:', stkData)
    
    return NextResponse.json({
      message: 'STK Push Test Complete',
      timestamp: new Date().toISOString(),
      request: { phone, amount },
      response: stkData,
      success: stkData.success,
      checkoutRequestId: stkData.checkoutRequestId,
      nextStep: stkData.success ? 
        `Use CheckoutRequestID "${stkData.checkoutRequestId}" to check payment status at /api/mpesa/status` :
        'Fix the error and try again'
    })
    
  } catch (error) {
    console.error('💥 STK Push test error:', error)
    return NextResponse.json({
      error: 'STK Push test failed',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
