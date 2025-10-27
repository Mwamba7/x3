import { NextResponse } from 'next/server'

// M-Pesa configuration
const MPESA_CONFIG = {
  consumerKey: process.env.MPESA_CONSUMER_KEY,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET,
  environment: process.env.MPESA_ENVIRONMENT || 'sandbox',
  baseUrl: process.env.MPESA_ENVIRONMENT === 'production' 
    ? 'https://api.safaricom.co.ke' 
    : 'https://sandbox.safaricom.co.ke'
}

export async function GET() {
  try {
    console.log('🔐 Getting M-Pesa access token...')
    
    // Validate configuration
    if (!MPESA_CONFIG.consumerKey || !MPESA_CONFIG.consumerSecret) {
      console.error('❌ M-Pesa credentials not configured')
      return NextResponse.json({
        success: false,
        error: 'M-Pesa credentials not configured'
      }, { status: 500 })
    }

    // Create basic auth header
    const auth = Buffer.from(`${MPESA_CONFIG.consumerKey}:${MPESA_CONFIG.consumerSecret}`).toString('base64')
    
    console.log('📡 Making auth request to:', `${MPESA_CONFIG.baseUrl}/oauth/v1/generate?grant_type=client_credentials`)
    
    const response = await fetch(`${MPESA_CONFIG.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()
    
    console.log('📊 Auth response status:', response.status)
    console.log('📊 Auth response data:', data)

    if (!response.ok) {
      console.error('❌ Auth request failed:', data)
      return NextResponse.json({
        success: false,
        error: data.errorMessage || 'Authentication failed',
        details: data
      }, { status: response.status })
    }

    if (!data.access_token) {
      console.error('❌ No access token in response:', data)
      return NextResponse.json({
        success: false,
        error: 'No access token received',
        details: data
      }, { status: 500 })
    }

    console.log('✅ Access token obtained successfully')
    
    return NextResponse.json({
      success: true,
      access_token: data.access_token,
      expires_in: data.expires_in
    })

  } catch (error) {
    console.error('💥 M-Pesa auth error:', error)
    return NextResponse.json({
      success: false,
      error: 'Authentication service error',
      details: error.message
    }, { status: 500 })
  }
}

export async function POST() {
  return GET() // Same logic for both GET and POST
}
