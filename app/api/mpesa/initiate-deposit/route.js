import { NextResponse } from 'next/server'

// M-Pesa configuration from environment variables
const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET
const MPESA_BUSINESS_SHORT_CODE = process.env.MPESA_BUSINESS_SHORT_CODE
const MPESA_PASSKEY = process.env.MPESA_PASSKEY
const MPESA_ENVIRONMENT = process.env.MPESA_ENVIRONMENT || 'sandbox'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL

// M-Pesa API URLs
const MPESA_BASE_URL = MPESA_ENVIRONMENT === 'production' 
  ? 'https://api.safaricom.co.ke' 
  : 'https://sandbox.safaricom.co.ke'

// Generate M-Pesa access token
async function generateAccessToken() {
  const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64')
  
  try {
    const response = await fetch(`${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to generate access token: ${response.status}`)
    }

    const data = await response.json()
    return data.access_token
  } catch (error) {
    console.error('Error generating access token:', error)
    throw error
  }
}

// Generate M-Pesa password
function generatePassword() {
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3)
  const password = Buffer.from(`${MPESA_BUSINESS_SHORT_CODE}${MPESA_PASSKEY}${timestamp}`).toString('base64')
  return { password, timestamp }
}

// Validate phone number format
function validatePhoneNumber(phoneNumber) {
  // Remove any spaces, dashes, or plus signs
  const cleaned = phoneNumber.replace(/[\s\-\+]/g, '')
  
  // Check if it starts with 254 (Kenya country code)
  if (cleaned.startsWith('254') && cleaned.length === 12) {
    return cleaned
  }
  
  // Check if it starts with 0 (local format)
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return '254' + cleaned.substring(1)
  }
  
  // Check if it's just the 9-digit number
  if (cleaned.length === 9) {
    return '254' + cleaned
  }
  
  throw new Error('Invalid phone number format. Please use format: 254XXXXXXXXX or 07XXXXXXXX')
}

export async function POST(request) {
  try {
    const { phoneNumber, cartTotal, cartId } = await request.json()

    // Validate required fields
    if (!phoneNumber || !cartTotal || !cartId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: phoneNumber, cartTotal, cartId' },
        { status: 400 }
      )
    }

    // Validate environment variables
    if (!MPESA_CONSUMER_KEY || !MPESA_CONSUMER_SECRET || !MPESA_BUSINESS_SHORT_CODE || !MPESA_PASSKEY) {
      console.error('Missing M-Pesa environment variables')
      return NextResponse.json(
        { success: false, error: 'M-Pesa configuration error' },
        { status: 500 }
      )
    }

    // Validate and format phone number
    let formattedPhone
    try {
      formattedPhone = validatePhoneNumber(phoneNumber)
    } catch (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    // Calculate 20% deposit
    const depositAmount = Math.round(cartTotal * 0.2)
    
    if (depositAmount < 1) {
      return NextResponse.json(
        { success: false, error: 'Deposit amount too small' },
        { status: 400 }
      )
    }

    // Generate access token
    const accessToken = await generateAccessToken()
    
    // Generate password and timestamp
    const { password, timestamp } = generatePassword()

    // Prepare STK Push request
    const stkPushPayload = {
      BusinessShortCode: MPESA_BUSINESS_SHORT_CODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: depositAmount,
      PartyA: formattedPhone,
      PartyB: MPESA_BUSINESS_SHORT_CODE,
      PhoneNumber: formattedPhone,
      CallBackURL: `${BASE_URL}/api/mpesa/payment-callback`,
      AccountReference: `DEPOSIT-${cartId}`,
      TransactionDesc: `20% Deposit Payment - Cart ${cartId}`
    }

    console.log('Initiating STK Push:', {
      amount: depositAmount,
      phone: formattedPhone,
      cartId,
      accountReference: stkPushPayload.AccountReference
    })

    // Send STK Push request
    const stkResponse = await fetch(`${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(stkPushPayload)
    })

    const stkData = await stkResponse.json()
    console.log('STK Push Response:', stkData)

    if (stkData.ResponseCode === '0') {
      // Success - STK Push sent
      return NextResponse.json({
        success: true,
        message: 'STK Push sent successfully',
        checkoutRequestId: stkData.CheckoutRequestID,
        merchantRequestId: stkData.MerchantRequestID,
        depositAmount,
        cartId,
        phoneNumber: formattedPhone
      })
    } else {
      // STK Push failed
      console.error('STK Push failed:', stkData)
      return NextResponse.json({
        success: false,
        error: stkData.ResponseDescription || 'Failed to initiate payment',
        errorCode: stkData.ResponseCode
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Error in initiate-deposit:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
