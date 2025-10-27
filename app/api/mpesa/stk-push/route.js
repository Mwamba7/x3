import { NextResponse } from 'next/server'

// M-Pesa configuration
const MPESA_CONFIG = {
  consumerKey: process.env.MPESA_CONSUMER_KEY,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET,
  businessShortCode: process.env.MPESA_BUSINESS_SHORT_CODE || '174379',
  passkey: process.env.MPESA_PASSKEY,
  environment: process.env.MPESA_ENVIRONMENT || 'sandbox',
  baseUrl: process.env.MPESA_ENVIRONMENT === 'production' 
    ? 'https://api.safaricom.co.ke' 
    : 'https://sandbox.safaricom.co.ke',
  callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/mpesa/callback`
}

// Get M-Pesa access token
async function getAccessToken() {
  try {
    const auth = Buffer.from(`${MPESA_CONFIG.consumerKey}:${MPESA_CONFIG.consumerSecret}`).toString('base64')
    
    const response = await fetch(`${MPESA_CONFIG.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()
    
    if (!response.ok || !data.access_token) {
      throw new Error(`Auth failed: ${data.errorMessage || 'No access token'}`)
    }

    return data.access_token
  } catch (error) {
    console.error('🔐 Access token error:', error)
    throw error
  }
}

// Generate timestamp
function getTimestamp() {
  const date = new Date()
  return date.getFullYear() +
    ('0' + (date.getMonth() + 1)).slice(-2) +
    ('0' + date.getDate()).slice(-2) +
    ('0' + date.getHours()).slice(-2) +
    ('0' + date.getMinutes()).slice(-2) +
    ('0' + date.getSeconds()).slice(-2)
}

// Generate password
function generatePassword() {
  const timestamp = getTimestamp()
  const password = Buffer.from(MPESA_CONFIG.businessShortCode + MPESA_CONFIG.passkey + timestamp).toString('base64')
  return { password, timestamp }
}

// Format phone number to M-Pesa format
function formatPhoneNumber(phone) {
  // Remove any spaces, dashes, or plus signs
  let formatted = phone.toString().replace(/[\s\-\+]/g, '')
  
  // Remove leading zeros and country code variations
  formatted = formatted.replace(/^(\+?254|0)/, '')
  
  // Add Kenya country code
  formatted = `254${formatted}`
  
  // Validate format (Kenyan mobile numbers)
  if (!/^254[17]\d{8}$/.test(formatted)) {
    throw new Error('Invalid Kenyan phone number format. Use format: 0712345678 or 254712345678')
  }
  
  return formatted
}

export async function POST(request) {
  try {
    console.log('💳 STK Push request initiated...')
    
    const { phone, amount, reference } = await request.json()

    // Validate input
    if (!phone || !amount) {
      return NextResponse.json({
        success: false,
        error: 'Phone number and amount are required'
      }, { status: 400 })
    }

    // Validate configuration
    if (!MPESA_CONFIG.consumerKey || !MPESA_CONFIG.consumerSecret || !MPESA_CONFIG.passkey) {
      console.error('❌ M-Pesa configuration incomplete')
      return NextResponse.json({
        success: false,
        error: 'M-Pesa service not properly configured'
      }, { status: 500 })
    }

    // Format phone number
    let formattedPhone
    try {
      formattedPhone = formatPhoneNumber(phone)
      console.log('📱 Phone formatted:', phone, '->', formattedPhone)
    } catch (error) {
      console.error('❌ Phone format error:', error.message)
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 400 })
    }

    // Get access token
    console.log('🔐 Getting access token...')
    const accessToken = await getAccessToken()
    console.log('✅ Access token obtained')
    
    // Generate password and timestamp
    const { password, timestamp } = generatePassword()
    console.log('🔑 Password generated for timestamp:', timestamp)
    
    // Create unique reference
    const transactionRef = reference || `TXN${Date.now()}`
    
    // Prepare STK push request
    const stkRequest = {
      BusinessShortCode: MPESA_CONFIG.businessShortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: MPESA_CONFIG.businessShortCode,
      PhoneNumber: formattedPhone,
      CallBackURL: MPESA_CONFIG.callbackUrl,
      AccountReference: transactionRef,
      TransactionDesc: `Deposit Payment - ${transactionRef}`
    }

    console.log('📤 STK Push request:', {
      ...stkRequest,
      Password: '[HIDDEN]',
      CallBackURL: MPESA_CONFIG.callbackUrl
    })

    // Send STK push
    const stkResponse = await fetch(`${MPESA_CONFIG.baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(stkRequest)
    })

    const stkData = await stkResponse.json()
    
    console.log('📊 STK Response Status:', stkResponse.status)
    console.log('📊 STK Response Data:', stkData)

    if (stkResponse.ok && stkData.ResponseCode === '0') {
      console.log('✅ STK Push sent successfully')
      
      return NextResponse.json({
        success: true,
        message: 'Payment request sent successfully. Check your phone for M-Pesa prompt.',
        checkoutRequestId: stkData.CheckoutRequestID,
        merchantRequestId: stkData.MerchantRequestID,
        reference: transactionRef,
        phone: formattedPhone,
        amount: Math.round(amount)
      })
    } else {
      console.error('❌ STK Push failed:', {
        httpStatus: stkResponse.status,
        responseCode: stkData.ResponseCode,
        responseDescription: stkData.ResponseDescription,
        errorCode: stkData.errorCode,
        errorMessage: stkData.errorMessage
      })
      
      return NextResponse.json({
        success: false,
        error: stkData.ResponseDescription || stkData.errorMessage || 'Payment request failed',
        details: {
          responseCode: stkData.ResponseCode,
          httpStatus: stkResponse.status,
          errorCode: stkData.errorCode
        }
      }, { status: 400 })
    }

  } catch (error) {
    console.error('💥 STK Push error:', error)
    return NextResponse.json({
      success: false,
      error: 'Payment service temporarily unavailable',
      details: error.message
    }, { status: 500 })
  }
}
