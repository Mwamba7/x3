import { NextResponse } from 'next/server'
import { getPaymentResult, getAllPaymentResults } from '../../../../lib/payment-storage'

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

export async function POST(request) {
  try {
    console.log('🔍 Payment status check initiated...')
    
    const { checkoutRequestId } = await request.json()

    if (!checkoutRequestId) {
      return NextResponse.json({
        success: false,
        error: 'CheckoutRequestID is required'
      }, { status: 400 })
    }

    console.log('🔍 Checking status for CheckoutRequestID:', checkoutRequestId)

    // First, check if we have a callback result stored
    const callbackResult = await getPaymentResult(checkoutRequestId)
    console.log('🔍 Checking stored callback results for:', checkoutRequestId)
    
    const allResults = await getAllPaymentResults()
    console.log('📊 All stored results:', allResults.map(([key]) => key))
    
    if (callbackResult) {
      console.log('📞 Found callback result:', callbackResult)
      
      if (callbackResult.success && callbackResult.metadata?.mpesaReceiptNumber) {
        console.log('✅ Valid callback result with transaction ID:', callbackResult.metadata.mpesaReceiptNumber)
        return NextResponse.json({
          success: true,
          status: 'completed',
          message: 'Payment completed successfully',
          transactionId: callbackResult.metadata.mpesaReceiptNumber,
          amount: callbackResult.metadata.amount,
          phone: callbackResult.metadata.phoneNumber,
          transactionDate: callbackResult.metadata.transactionDate
        })
      } else {
        // Payment failed according to callback
        let status = 'failed'
        if (callbackResult.resultDesc?.toLowerCase().includes('cancel')) {
          status = 'cancelled'
        } else if (callbackResult.resultDesc?.toLowerCase().includes('timeout')) {
          status = 'timeout'
        }
        
        return NextResponse.json({
          success: false,
          status: status,
          message: callbackResult.resultDesc || 'Payment failed'
        })
      }
    }

    // If no callback result, query M-Pesa directly
    console.log('📡 No callback result found, querying M-Pesa directly...')

    // Validate configuration
    if (!MPESA_CONFIG.consumerKey || !MPESA_CONFIG.consumerSecret || !MPESA_CONFIG.passkey) {
      return NextResponse.json({
        success: false,
        error: 'M-Pesa service not properly configured'
      }, { status: 500 })
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

    console.log('📤 STK Query request:', {
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
    
    console.log('📊 Query Response Status:', queryResponse.status)
    console.log('📊 Query Response Data:', queryData)

    if (queryResponse.ok) {
      // Interpret the response
      if (queryData.ResponseCode === '0') {
        // Payment completed successfully
        console.log('✅ Payment completed (direct query)')
        console.log('💰 M-Pesa query result:', queryData)
        
        // Only return success if we have a real transaction ID
        if (queryData.MpesaReceiptNumber && queryData.MpesaReceiptNumber !== 'undefined') {
          return NextResponse.json({
            success: true,
            status: 'completed',
            message: 'Payment completed successfully',
            transactionId: queryData.MpesaReceiptNumber,
            amount: queryData.Amount,
            phone: queryData.PhoneNumber
          })
        } else {
          console.log('⚠️ M-Pesa query shows success but no receipt number - treating as pending')
          return NextResponse.json({
            success: false,
            status: 'pending',
            message: 'Payment is still being processed'
          })
        }
      } else if (queryData.ResponseCode === '1032') {
        // Payment cancelled by user
        console.log('❌ Payment cancelled by user')
        return NextResponse.json({
          success: false,
          status: 'cancelled',
          message: 'Payment was cancelled by user'
        })
      } else if (queryData.ResponseCode === '1037') {
        // Payment timeout - treat as pending to continue polling
        console.log('⏰ Payment timeout from M-Pesa, treating as pending')
        return NextResponse.json({
          success: false,
          status: 'pending',
          message: 'Payment is still being processed'
        })
      } else if (queryData.ResponseCode === '1001') {
        // Payment pending
        console.log('⏳ Payment still pending')
        return NextResponse.json({
          success: false,
          status: 'pending',
          message: 'Payment is still pending'
        })
      } else {
        // Other error
        console.log('❌ Payment failed with code:', queryData.ResponseCode)
        return NextResponse.json({
          success: false,
          status: 'failed',
          message: queryData.ResponseDescription || 'Payment failed'
        })
      }
    } else {
      console.error('❌ Query request failed:', queryData)
      return NextResponse.json({
        success: false,
        status: 'error',
        message: 'Failed to check payment status'
      }, { status: queryResponse.status })
    }

  } catch (error) {
    console.error('💥 Payment status check error:', error)
    return NextResponse.json({
      success: false,
      status: 'error',
      message: 'Payment status check service temporarily unavailable',
      details: error.message
    }, { status: 500 })
  }
}

// Function to store payment result from callback (called by callback handler)
export function storePaymentResult(checkoutRequestId, result) {
  paymentResults.set(checkoutRequestId, result)
  console.log('💾 Payment result stored:', checkoutRequestId)
}

// GET endpoint for debugging
export async function GET() {
  return NextResponse.json({
    message: 'M-Pesa status check endpoint is active',
    storedResults: Array.from(paymentResults.keys()),
    timestamp: new Date().toISOString()
  })
}
