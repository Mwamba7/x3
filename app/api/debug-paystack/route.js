import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🔍 Debugging Paystack environment variables...')
    
    const paystackConfig = {
      PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY ? 'SET' : 'NOT SET',
      PAYSTACK_PUBLIC_KEY: process.env.PAYSTACK_PUBLIC_KEY ? 'SET' : 'NOT SET',
      PAYSTACK_CALLBACK_URL: process.env.PAYSTACK_CALLBACK_URL || 'DEFAULT',
      PAYSTACK_WEBHOOK_URL: process.env.PAYSTACK_WEBHOOK_URL || 'DEFAULT',
      PAYSTACK_WEBHOOK_SECRET: process.env.PAYSTACK_WEBHOOK_SECRET ? 'SET' : 'NOT SET',
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'NOT SET'
    }
    
    // Test Paystack API connection
    let paystackTest = 'NOT TESTED'
    try {
      if (process.env.PAYSTACK_SECRET_KEY) {
        const response = await fetch('https://api.paystack.co/', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
          }
        })
        
        if (response.ok) {
          paystackTest = 'CONNECTION OK'
        } else {
          paystackTest = `CONNECTION FAILED: ${response.status}`
        }
      } else {
        paystackTest = 'NO SECRET KEY'
      }
    } catch (error) {
      paystackTest = `CONNECTION ERROR: ${error.message}`
    }
    
    return NextResponse.json({
      success: true,
      message: 'Paystack environment debug information',
      config: paystackConfig,
      paystackTest: paystackTest,
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('💥 Debug endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
