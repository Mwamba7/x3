import { NextResponse } from 'next/server'

/**
 * Complete M-Pesa Daraja API Integration
 * Rewritten with proper error handling, caching, and best practices
 */

// Environment Configuration
const CONFIG = {
  CONSUMER_KEY: process.env.MPESA_CONSUMER_KEY,
  CONSUMER_SECRET: process.env.MPESA_CONSUMER_SECRET,
  BUSINESS_SHORT_CODE: process.env.MPESA_BUSINESS_SHORT_CODE,
  PASSKEY: process.env.MPESA_PASSKEY,
  ENVIRONMENT: process.env.MPESA_ENVIRONMENT || 'sandbox',
  BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  INITIATOR_NAME: process.env.MPESA_INITIATOR_NAME || 'testapi',
  SECURITY_CREDENTIAL: process.env.MPESA_SECURITY_CREDENTIAL || ''
}

// Validate environment variables
const validateConfig = () => {
  const required = ['CONSUMER_KEY', 'CONSUMER_SECRET', 'BUSINESS_SHORT_CODE', 'PASSKEY', 'BASE_URL']
  const missing = required.filter(key => !CONFIG[key])
  
  if (missing.length > 0) {
    console.error('❌ Missing M-Pesa environment variables:', missing)
    return false
  }
  return true
}

// API Endpoints
const DARAJA_URLS = {
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

// Caching and Rate Limiting
let tokenCache = { token: null, expiry: null }
const requestTracker = new Map()
const RATE_LIMITS = {
  window: 60000, // 1 minute
  maxRequests: 10,
  maxStatusQueries: 20
}

// Rate Limiting System
class RateLimiter {
  static checkLimit(clientId, type = 'default') {
    const now = Date.now()
    const key = `${clientId}-${type}`
    const requests = requestTracker.get(key) || []
    
    // Clean old requests
    const validRequests = requests.filter(time => now - time < RATE_LIMITS.window)
    
    // Check limits based on type
    const limit = type === 'status' ? RATE_LIMITS.maxStatusQueries : RATE_LIMITS.maxRequests
    
    if (validRequests.length >= limit) {
      return { allowed: false, resetTime: Math.min(...validRequests) + RATE_LIMITS.window }
    }
    
    // Add current request
    validRequests.push(now)
    requestTracker.set(key, validRequests)
    
    return { allowed: true, remaining: limit - validRequests.length }
  }
}

// Token Management
class TokenManager {
  static async getAccessToken() {
    // Return cached token if valid
    if (tokenCache.token && tokenCache.expiry && Date.now() < tokenCache.expiry) {
      console.log('🔄 Using cached access token')
      return tokenCache.token
    }

    console.log('🔑 Generating new access token...')
    
    if (!validateConfig()) {
      throw new Error('M-Pesa configuration is incomplete')
    }

    const credentials = Buffer.from(`${CONFIG.CONSUMER_KEY}:${CONFIG.CONSUMER_SECRET}`).toString('base64')
    
    try {
      const response = await fetch(DARAJA_URLS[CONFIG.ENVIRONMENT].oauth, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Token request failed: ${response.status} - ${errorData.error_description || 'Unknown error'}`)
      }
      
      const data = await response.json()
      
      if (!data.access_token) {
        throw new Error('No access token received from Daraja API')
      }
      
      // Cache token (expires in 1 hour, refresh after 55 minutes)
      tokenCache = {
        token: data.access_token,
        expiry: Date.now() + (55 * 60 * 1000)
      }
      
      console.log('✅ Access token generated and cached')
      return data.access_token
      
    } catch (error) {
      console.error('❌ Token generation failed:', error.message)
      throw new Error(`Failed to generate access token: ${error.message}`)
    }
  }
}

// Utility Functions
class MpesaUtils {
  static generatePassword() {
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3)
    const password = Buffer.from(`${CONFIG.BUSINESS_SHORT_CODE}${CONFIG.PASSKEY}${timestamp}`).toString('base64')
    return { password, timestamp }
  }
  
  static formatPhoneNumber(phone) {
    if (!phone) return null
    
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '')
    
    // Handle different formats
    if (cleaned.startsWith('254')) {
      return cleaned // Already in correct format
    } else if (cleaned.startsWith('0')) {
      return '254' + cleaned.slice(1) // Remove leading 0 and add 254
    } else if (cleaned.length === 9) {
      return '254' + cleaned // Add 254 prefix
    }
    
    return null // Invalid format
  }
  
  static validateAmount(amount) {
    const num = parseFloat(amount)
    return num >= 1 && num <= 70000 && !isNaN(num)
  }
  
  static generateTransactionId() {
    return `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`
  }
}

// Request Validation
function validateSTKPushRequest({ phoneNumber, amount, accountReference, transactionDesc }) {
  if (!phoneNumber) {
    return { valid: false, field: 'phoneNumber', message: 'Phone number is required' }
  }
  
  if (!amount) {
    return { valid: false, field: 'amount', message: 'Amount is required' }
  }
  
  if (!MpesaUtils.validateAmount(amount)) {
    return { valid: false, field: 'amount', message: 'Amount must be between 1 and 70,000 KES' }
  }
  
  if (!accountReference || accountReference.length > 12) {
    return { valid: false, field: 'accountReference', message: 'Account reference is required and must be 12 characters or less' }
  }
  
  if (!transactionDesc || transactionDesc.length > 13) {
    return { valid: false, field: 'transactionDesc', message: 'Transaction description is required and must be 13 characters or less' }
  }
  
  return { valid: true }
}

// Error Handler
class ErrorHandler {
  static handleDarajaError(error, context = '') {
    console.error(`❌ Daraja API Error [${context}]:`, error)
    
    // Network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: 'Unable to connect to M-Pesa service. Please check your internet connection.',
        retryable: true
      }
    }
    
    // Timeout errors
    if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      return {
        success: false,
        error: 'TIMEOUT_ERROR',
        message: 'Request timed out. Please try again.',
        retryable: true
      }
    }
    
    // Parse Daraja-specific errors
    if (error.message.includes('System is busy')) {
      return {
        success: false,
        error: 'SYSTEM_BUSY',
        message: 'M-Pesa system is currently busy. Please try again in 2-3 minutes.',
        retryable: true,
        retryAfter: 120000 // 2 minutes
      }
    }
    
    if (error.message.includes('Invalid Access Token')) {
      return {
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Authentication failed. Please try again.',
        retryable: true
      }
    }
    
    // Default error
    return {
      success: false,
      error: 'UNKNOWN_ERROR',
      message: error.message || 'An unexpected error occurred. Please try again.',
      retryable: false
    }
  }
}

// STK Push Implementation
export async function POST(request) {
  const startTime = Date.now()
  
  try {
    console.log('🚀 M-Pesa STK Push request initiated')
    
    // Get client identifier
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    request.headers.get('cf-connecting-ip') || 
                    'unknown'
    
    // Rate limiting check
    const rateCheck = RateLimiter.checkLimit(clientIP, 'stkpush')
    if (!rateCheck.allowed) {
      const resetIn = Math.ceil((rateCheck.resetTime - Date.now()) / 1000)
      console.log(`⚠️ Rate limit exceeded for ${clientIP}. Reset in ${resetIn}s`)
      
      return NextResponse.json({
        success: false,
        error: 'RATE_LIMITED',
        message: `Too many requests. Please wait ${resetIn} seconds before trying again.`,
        retryAfter: resetIn
      }, { status: 429 })
    }
    
    // Validate configuration
    if (!validateConfig()) {
      return NextResponse.json({
        success: false,
        error: 'CONFIG_ERROR',
        message: 'M-Pesa service is not properly configured. Please contact support.'
      }, { status: 500 })
    }

    // Parse and validate request body
    let requestBody
    try {
      requestBody = await request.json()
    } catch (error) {
      console.error('❌ Invalid JSON in request:', error)
      return NextResponse.json({
        success: false,
        error: 'INVALID_JSON',
        message: 'Invalid request format. Please send valid JSON data.'
      }, { status: 400 })
    }

    const { phoneNumber, amount, accountReference, transactionDesc } = requestBody
    
    // Comprehensive input validation
    const validation = validateSTKPushRequest({ phoneNumber, amount, accountReference, transactionDesc })
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: validation.message,
        field: validation.field
      }, { status: 400 })
    }

    const formattedPhone = MpesaUtils.formatPhoneNumber(phoneNumber)
    if (!formattedPhone) {
      return NextResponse.json({
        success: false,
        error: 'INVALID_PHONE',
        message: 'Invalid phone number format. Use format: 0712345678 or 254712345678'
      }, { status: 400 })
    }

    // Get access token
    const accessToken = await TokenManager.getAccessToken()
    
    // Generate transaction credentials
    const { password, timestamp } = MpesaUtils.generatePassword()
    const transactionId = MpesaUtils.generateTransactionId()
    
    // Prepare STK Push payload
    const stkPushPayload = {
      BusinessShortCode: CONFIG.BUSINESS_SHORT_CODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: CONFIG.BUSINESS_SHORT_CODE,
      PhoneNumber: formattedPhone,
      CallBackURL: `${CONFIG.BASE_URL}/api/mpesa/callback`,
      AccountReference: accountReference || transactionId,
      TransactionDesc: transactionDesc || 'Payment'
    }

    console.log('📤 Sending STK Push request...')
    
    // Send STK Push request
    const stkResponse = await fetch(DARAJA_URLS[CONFIG.ENVIRONMENT].stkpush, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(stkPushPayload)
    })

    const stkData = await stkResponse.json()
    console.log('📥 STK Push response:', stkData)

    // Handle STK Push response
    if (stkData.ResponseCode === '0') {
      console.log('✅ STK Push sent successfully:', stkData.CheckoutRequestID)
      
      return NextResponse.json({
        success: true,
        message: 'STK push sent successfully. Please check your phone.',
        checkoutRequestId: stkData.CheckoutRequestID,
        merchantRequestId: stkData.MerchantRequestID,
        customerMessage: stkData.CustomerMessage,
        transactionId: transactionId,
        responseTime: Date.now() - startTime
      })
    } else {
      console.error('❌ STK Push failed:', stkData)
      
      const errorResponse = ErrorHandler.handleDarajaError(
        new Error(stkData.ResponseDescription || stkData.errorMessage || 'STK Push failed'),
        'STK_PUSH'
      )
      
      return NextResponse.json(errorResponse, { status: 400 })
    }

  } catch (error) {
    console.error('❌ STK Push error:', error)
    const errorResponse = ErrorHandler.handleDarajaError(error, 'STK_PUSH')
    return NextResponse.json(errorResponse, { status: 500 })
  }
}

// STK Push Query Implementation
export async function GET(request) {
  const startTime = Date.now()
  
  try {
    console.log('🔍 M-Pesa status query initiated')
    
    const { searchParams } = new URL(request.url)
    const checkoutRequestId = searchParams.get('checkoutRequestId')
    
    if (!checkoutRequestId) {
      return NextResponse.json({
        success: false,
        error: 'MISSING_PARAMETER',
        message: 'CheckoutRequestID is required'
      }, { status: 400 })
    }

    // Rate limiting for status queries
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'
    
    const rateCheck = RateLimiter.checkLimit(clientIP, 'status')
    if (!rateCheck.allowed) {
      const resetIn = Math.ceil((rateCheck.resetTime - Date.now()) / 1000)
      return NextResponse.json({
        success: false,
        error: 'RATE_LIMITED',
        message: `Too many status queries. Please wait ${resetIn} seconds.`,
        retryAfter: resetIn
      }, { status: 429 })
    }

    // Get access token
    const accessToken = await TokenManager.getAccessToken()
    
    // Generate query credentials
    const { password, timestamp } = MpesaUtils.generatePassword()
    
    // Prepare status query payload
    const queryPayload = {
      BusinessShortCode: CONFIG.BUSINESS_SHORT_CODE,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId
    }

    console.log('📤 Querying transaction status...')
    
    // Send status query request
    const queryResponse = await fetch(DARAJA_URLS[CONFIG.ENVIRONMENT].stkquery, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(queryPayload)
    })

    const queryData = await queryResponse.json()
    console.log('📥 Status query response:', queryData)

    // Process status response
    if (queryData.ResponseCode === '0') {
      return NextResponse.json({
        success: true,
        data: {
          ResultCode: queryData.ResultCode,
          ResultDesc: queryData.ResultDesc,
          MerchantRequestID: queryData.MerchantRequestID,
          CheckoutRequestID: queryData.CheckoutRequestID,
          ResponseCode: queryData.ResponseCode,
          ResponseDescription: queryData.ResponseDescription
        },
        responseTime: Date.now() - startTime
      })
    } else {
      const errorResponse = ErrorHandler.handleDarajaError(
        new Error(queryData.ResponseDescription || 'Status query failed'),
        'STATUS_QUERY'
      )
      
      return NextResponse.json(errorResponse, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Status query error:', error)
    const errorResponse = ErrorHandler.handleDarajaError(error, 'STATUS_QUERY')
    return NextResponse.json(errorResponse, { status: 500 })
  }
}
