import { NextResponse } from 'next/server'

// M-Pesa credentials from environment variables
const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET
const BUSINESS_SHORT_CODE = process.env.MPESA_BUSINESS_SHORT_CODE
const PASSKEY = process.env.MPESA_PASSKEY
const ENVIRONMENT = process.env.MPESA_ENVIRONMENT || 'sandbox'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL

// Validate required environment variables
if (!CONSUMER_KEY || !CONSUMER_SECRET || !BUSINESS_SHORT_CODE || !PASSKEY || !BASE_URL) {
  console.error('Missing required M-Pesa environment variables. Please check your .env file.')
}

const CALLBACK_URL = BASE_URL ? `${BASE_URL}/api/mpesa/callback` : null

// M-Pesa API URLs based on environment
const API_URLS = {
  sandbox: {
    oauth: 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    stkpush: 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
    stkquery: 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query'
  },
  production: {
    oauth: 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    stkpush: 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
    stkquery: 'https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query'
  }
}

// Generate M-Pesa access token
async function generateAccessToken() {
  // Validate credentials before making request
  if (!CONSUMER_KEY || !CONSUMER_SECRET) {
    throw new Error('M-Pesa credentials not configured. Please check your environment variables.')
  }

  const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64')
  
  try {
    const response = await fetch(API_URLS[ENVIRONMENT].oauth, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      console.error('Access token generation failed:', data)
      throw new Error(`HTTP ${response.status}: ${data.errorMessage || data.error_description || 'Unknown error'}`)
    }
    
    if (!data.access_token) {
      console.error('Access token generation failed:', data)
      throw new Error('Failed to get access token: ' + (data.errorMessage || 'Unknown error'))
    }
    
    return data.access_token
  } catch (error) {
    console.error('Error generating access token:', error)
    throw new Error('Failed to generate access token: ' + error.message)
  }
}

// Generate password for STK push
function generatePassword() {
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3)
  const password = Buffer.from(`${BUSINESS_SHORT_CODE}${PASSKEY}${timestamp}`).toString('base64')
  return { password, timestamp }
}

// Format phone number to required format
function formatPhoneNumber(phone) {
  if (!phone) return ''
  
  // Remove any non-digit characters
  let cleaned = phone.replace(/\D/g, '')
  
  // Handle different formats
  if (cleaned.startsWith('254')) {
    return cleaned.length === 12 ? cleaned : ''
  } else if (cleaned.startsWith('0') && cleaned.length === 10) {
    return '254' + cleaned.slice(1)
  } else if ((cleaned.startsWith('7') || cleaned.startsWith('1')) && cleaned.length === 9) {
    return '254' + cleaned
  }
  
  // Return empty string if format doesn't match (will fail validation)
  return ''
}

// STK Push endpoint
export async function POST(request) {
  try {
    console.log('🚀 M-Pesa STK Push request received')
    
    // Validate environment configuration
    if (!CALLBACK_URL) {
      console.error('❌ CALLBACK_URL not configured')
      return NextResponse.json(
        { success: false, message: 'M-Pesa configuration incomplete. Please set NEXT_PUBLIC_BASE_URL in your environment variables.' },
        { status: 500 }
      )
    }

    // Validate required environment variables
    if (!CONSUMER_KEY || !CONSUMER_SECRET || !BUSINESS_SHORT_CODE || !PASSKEY) {
      console.error('❌ Missing M-Pesa credentials:', {
        hasConsumerKey: !!CONSUMER_KEY,
        hasConsumerSecret: !!CONSUMER_SECRET,
        hasBusinessShortCode: !!BUSINESS_SHORT_CODE,
        hasPasskey: !!PASSKEY
      })
      return NextResponse.json(
        { success: false, message: 'M-Pesa credentials not configured. Please check your environment variables.' },
        { status: 500 }
      )
    }

    let requestBody
    try {
      requestBody = await request.json()
    } catch (jsonError) {
      console.error('❌ Invalid JSON in request body:', jsonError)
      return NextResponse.json(
        { success: false, message: 'Invalid request format. Please check your request data.' },
        { status: 400 }
      )
    }

    const { phoneNumber, amount, accountReference, transactionDesc } = requestBody
    console.log('📋 Request data:', { phoneNumber, amount, accountReference, transactionDesc })

    if (!phoneNumber || !amount) {
      return NextResponse.json(
        { success: false, message: 'Phone number and amount are required' },
        { status: 400 }
      )
    }

    // Validate amount
    if (amount < 1) {
      return NextResponse.json(
        { success: false, message: 'Amount must be at least 1 KES' },
        { status: 400 }
      )
    }

    // Get access token
    console.log('🔑 Generating access token...')
    const accessToken = await generateAccessToken()
    console.log('✅ Access token generated successfully')
    
    // Generate password and timestamp
    const { password, timestamp } = generatePassword()
    
    // Format phone number
    const formattedPhone = formatPhoneNumber(phoneNumber)
    console.log('📱 Formatted phone number:', formattedPhone)
    
    // Validate phone number format (must be Kenyan mobile number)
    // Valid formats: 254[7,1,0][0-9]{8} (Safaricom, Airtel, Telkom)
    if (!formattedPhone || formattedPhone.length !== 12 || !formattedPhone.match(/^254[710][0-9]{8}$/)) {
      console.log('❌ Invalid phone number format:', { original: phoneNumber, formatted: formattedPhone })
      return NextResponse.json(
        { success: false, message: 'Invalid phone number format. Please use a valid Kenyan mobile number (e.g., 0708374149 or 254708374149).' },
        { status: 400 }
      )
    }
    
    // STK Push request
    const stkPushData = {
      BusinessShortCode: BUSINESS_SHORT_CODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: BUSINESS_SHORT_CODE,
      PhoneNumber: formattedPhone,
      CallBackURL: CALLBACK_URL,
      AccountReference: accountReference || 'Order Payment',
      TransactionDesc: transactionDesc || 'Payment for order'
    }

    console.log(`Initiating STK Push for ${formattedPhone} - Amount: ${amount} KES`)

    const response = await fetch(API_URLS[ENVIRONMENT].stkpush, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(stkPushData)
    })

    const data = await response.json()
    console.log('📋 M-Pesa API Response:', data)
    
    if (!response.ok) {
      console.error('❌ STK Push failed:', data)
      
      // Handle specific M-Pesa error messages
      let errorMessage = 'Payment request failed. Please try again.'
      
      if (data.errorMessage) {
        if (data.errorMessage.includes('Invalid Access Token')) {
          errorMessage = 'M-Pesa service temporarily unavailable. Please try again in a few minutes.'
        } else if (data.errorMessage.includes('Bad Request')) {
          errorMessage = 'Invalid payment request. Please check your phone number and try again.'
        } else {
          errorMessage = data.errorMessage
        }
      } else if (data.ResponseDescription) {
        errorMessage = data.ResponseDescription
      }
      
      return NextResponse.json({
        success: false,
        message: errorMessage
      }, { status: 400 }) // Always return 400 for client errors, not 500
    }
    
    if (data.ResponseCode === '0') {
      console.log('STK Push initiated successfully:', data.CheckoutRequestID)
      return NextResponse.json({
        success: true,
        message: 'STK push sent successfully',
        checkoutRequestId: data.CheckoutRequestID,
        merchantRequestId: data.MerchantRequestID
      })
    } else {
      console.error('❌ STK Push rejected:', data)
      
      // Handle specific M-Pesa response codes
      let errorMessage = 'Payment request failed. Please try again.'
      
      if (data.ResponseDescription) {
        if (data.ResponseDescription.includes('invalid phone number')) {
          errorMessage = 'Invalid phone number. Please check your M-Pesa number and try again.'
        } else if (data.ResponseDescription.includes('system busy')) {
          errorMessage = 'M-Pesa system is busy. Please try again in a few minutes.'
        } else if (data.ResponseDescription.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again.'
        } else {
          errorMessage = data.ResponseDescription
        }
      }
      
      return NextResponse.json({
        success: false,
        message: errorMessage
      }, { status: 400 })
    }

  } catch (error) {
    console.error('STK Push error:', error)
    
    // Provide more specific error messages
    let errorMessage = 'Payment request failed. Please try again.'
    
    if (error.message.includes('Failed to generate access token')) {
      errorMessage = 'M-Pesa service temporarily unavailable. Please try again in a few minutes.'
    } else if (error.message.includes('credentials not configured')) {
      errorMessage = 'Payment service configuration error. Please contact support.'
    } else if (error.message.includes('fetch')) {
      errorMessage = 'Network error. Please check your connection and try again.'
    } else if (error.message.includes('JSON')) {
      errorMessage = 'Invalid request format. Please try again.'
    }
    
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    )
  }
}

// Query STK Push status
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const checkoutRequestId = searchParams.get('checkoutRequestId')

    if (!checkoutRequestId) {
      return NextResponse.json(
        { success: false, message: 'CheckoutRequestID is required' },
        { status: 400 }
      )
    }

    // Get access token
    const accessToken = await generateAccessToken()
    
    // Generate password and timestamp
    const { password, timestamp } = generatePassword()

    const queryData = {
      BusinessShortCode: BUSINESS_SHORT_CODE,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId
    }

    const response = await fetch(API_URLS[ENVIRONMENT].stkquery, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(queryData)
    })

    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      data: data
    })

  } catch (error) {
    console.error('STK Push query error:', error)
    
    // Provide more specific error messages
    let errorMessage = 'Unable to check payment status. Please try again.'
    
    if (error.message.includes('Failed to generate access token')) {
      errorMessage = 'M-Pesa service temporarily unavailable. Please try again in a few minutes.'
    } else if (error.message.includes('credentials not configured')) {
      errorMessage = 'Payment service configuration error. Please contact support.'
    } else if (error.message.includes('fetch')) {
      errorMessage = 'Network error. Please check your connection and try again.'
    }
    
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    )
  }
}
