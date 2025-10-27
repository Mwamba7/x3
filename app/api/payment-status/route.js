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
    : 'https://sandbox.safaricom.co.ke'
}

// Get M-Pesa access token
async function getAccessToken() {
  try {
    const auth = Buffer.from(`${MPESA_CONFIG.consumerKey}:${MPESA_CONFIG.consumerSecret}`).toString('base64')
    
    const response = await fetch(`${MPESA_CONFIG.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    })

    if (!response.ok) {
      throw new Error(`Auth failed: ${response.status}`)
    }

    const data = await response.json()
    return data.access_token
  } catch (error) {
    console.error('Access token error:', error)
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

export async function POST(request) {
  try {
    const { checkoutRequestId } = await request.json()

    if (!checkoutRequestId) {
      return NextResponse.json({
        success: false,
        message: 'CheckoutRequestID is required'
      })
    }

    // Check M-Pesa configuration
    if (!MPESA_CONFIG.consumerKey || !MPESA_CONFIG.consumerSecret) {
      return NextResponse.json({
        success: false,
        message: 'M-Pesa service not configured'
      })
    }

    // Get access token
    const accessToken = await getAccessToken()
    
    // Generate password and timestamp
    const { password, timestamp } = generatePassword()

    // Prepare query request
    const queryRequest = {
      BusinessShortCode: MPESA_CONFIG.businessShortCode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId
    }

    console.log('Payment Status Query Request:', {
      ...queryRequest,
      Password: '[HIDDEN]'
    })

    // Query transaction status
    const queryResponse = await fetch(`${MPESA_CONFIG.baseUrl}/mpesa/stkpushquery/v1/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(queryRequest)
    })

    const queryData = await queryResponse.json()
    console.log('M-Pesa Query Response:', queryData)

    if (queryResponse.ok) {
      // Check payment status
      if (queryData.ResponseCode === '0') {
        // Payment completed successfully
        return NextResponse.json({
          success: true,
          status: 'completed',
          message: 'Payment completed successfully',
          transactionId: queryData.MpesaReceiptNumber,
          amount: queryData.Amount,
          phone: queryData.PhoneNumber
        })
      } else if (queryData.ResponseCode === '1032') {
        // Payment cancelled by user
        return NextResponse.json({
          success: false,
          status: 'cancelled',
          message: 'Payment was cancelled by user'
        })
      } else if (queryData.ResponseCode === '1037') {
        // Payment timeout
        return NextResponse.json({
          success: false,
          status: 'timeout',
          message: 'Payment request timed out'
        })
      } else if (queryData.ResponseCode === '1001') {
        // Payment pending
        return NextResponse.json({
          success: false,
          status: 'pending',
          message: 'Payment is still pending'
        })
      } else {
        // Other error
        return NextResponse.json({
          success: false,
          status: 'failed',
          message: queryData.ResponseDescription || 'Payment failed'
        })
      }
    } else {
      return NextResponse.json({
        success: false,
        status: 'error',
        message: 'Failed to check payment status'
      })
    }

  } catch (error) {
    console.error('Payment status check error:', error)
    return NextResponse.json({
      success: false,
      status: 'error',
      message: 'Payment status check service temporarily unavailable'
    })
  }
}
