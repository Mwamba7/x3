import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const consumerKey = process.env.MPESA_CONSUMER_KEY
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET
    const environment = process.env.MPESA_ENVIRONMENT || 'sandbox'
    
    if (!consumerKey || !consumerSecret) {
      return NextResponse.json({
        success: false,
        error: 'M-Pesa credentials not configured',
        details: {
          hasConsumerKey: !!consumerKey,
          hasConsumerSecret: !!consumerSecret
        }
      })
    }

    const baseUrl = environment === 'production' 
      ? 'https://api.safaricom.co.ke' 
      : 'https://sandbox.safaricom.co.ke'

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')
    
    console.log('Testing M-Pesa authentication...')
    console.log('Environment:', environment)
    console.log('Base URL:', baseUrl)
    console.log('Consumer Key Length:', consumerKey.length)
    console.log('Consumer Secret Length:', consumerSecret.length)
    
    const response = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    })

    console.log('Auth Response Status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.log('Auth Error Response:', errorText)
      
      return NextResponse.json({
        success: false,
        error: `Authentication failed: HTTP ${response.status}`,
        details: {
          status: response.status,
          statusText: response.statusText,
          response: errorText,
          environment,
          baseUrl
        }
      })
    }

    const data = await response.json()
    console.log('Auth Success:', { 
      access_token: data.access_token ? `${data.access_token.substring(0, 20)}...` : 'missing',
      expires_in: data.expires_in 
    })
    
    return NextResponse.json({
      success: true,
      tokenLength: data.access_token ? data.access_token.length : 0,
      expiresIn: data.expires_in,
      environment,
      baseUrl
    })

  } catch (error) {
    console.error('Auth test error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      details: {
        type: error.constructor.name,
        stack: error.stack
      }
    }, { status: 500 })
  }
}
