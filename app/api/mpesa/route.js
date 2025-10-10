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
  // Remove any non-digit characters
  let cleaned = phone.replace(/\D/g, '')
  
  // Handle different formats
  if (cleaned.startsWith('254')) {
    return cleaned
  } else if (cleaned.startsWith('0')) {
    return '254' + cleaned.slice(1)
  } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
    return '254' + cleaned
  }
  
  return cleaned
}

// STK Push endpoint
export async function POST(request) {
  try {
    // Validate environment configuration
    if (!CALLBACK_URL) {
      return NextResponse.json(
        { success: false, message: 'M-Pesa configuration incomplete. Please set NEXT_PUBLIC_BASE_URL in your environment variables.' },
        { status: 500 }
      )
    }

    const { phoneNumber, amount, accountReference, transactionDesc } = await request.json()

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
    const accessToken = await generateAccessToken()
    
    // Generate password and timestamp
    const { password, timestamp } = generatePassword()
    
    // Format phone number
    const formattedPhone = formatPhoneNumber(phoneNumber)
    
    // Validate phone number format
    if (!formattedPhone.match(/^254[0-9]{9}$/)) {
      return NextResponse.json(
        { success: false, message: 'Invalid phone number format. Please use a valid Kenyan phone number.' },
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
    
    if (!response.ok) {
      console.error('STK Push failed:', data)
      return NextResponse.json({
        success: false,
        message: data.errorMessage || data.ResponseDescription || 'STK push request failed',
        error: data
      }, { status: response.status })
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
      console.error('STK Push rejected:', data)
      return NextResponse.json({
        success: false,
        message: data.ResponseDescription || 'STK push failed',
        error: data
      }, { status: 400 })
    }

  } catch (error) {
    console.error('STK Push error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
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
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}
