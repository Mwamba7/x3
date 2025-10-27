// M-Pesa Utility Functions
// Centralized utilities for M-Pesa integration

/**
 * Enhanced logging function for M-Pesa operations
 */
export function logMpesa(level, message, data = null) {
  const timestamp = new Date().toISOString()
  const logMessage = `[${timestamp}] [MPESA-${level.toUpperCase()}] ${message}`
  
  if (level === 'error') {
    console.error(logMessage, data ? JSON.stringify(data, null, 2) : '')
  } else if (level === 'warn') {
    console.warn(logMessage, data ? JSON.stringify(data, null, 2) : '')
  } else {
    console.log(logMessage, data ? JSON.stringify(data, null, 2) : '')
  }
}

/**
 * Validate Daraja M-Pesa environment variables
 */
export function validateMpesaConfig() {
  const requiredVars = [
    'MPESA_CONSUMER_KEY',
    'MPESA_CONSUMER_SECRET', 
    'MPESA_BUSINESS_SHORT_CODE',
    'MPESA_PASSKEY',
    'NEXT_PUBLIC_BASE_URL'
  ]

  const optionalVars = [
    'MPESA_INITIATOR_NAME',
    'MPESA_SECURITY_CREDENTIAL',
    'MPESA_COMMAND_ID'
  ]

  const missing = requiredVars.filter(varName => !process.env[varName])
  const missingOptional = optionalVars.filter(varName => !process.env[varName])
  
  if (missing.length > 0) {
    logMpesa('error', 'Missing required Daraja environment variables', { missing })
    return {
      isValid: false,
      missing,
      error: `Missing required environment variables: ${missing.join(', ')}`
    }
  }

  if (missingOptional.length > 0) {
    logMpesa('warn', 'Missing optional Daraja environment variables', { missingOptional })
  }

  // Validate Daraja API endpoints
  const environment = process.env.MPESA_ENVIRONMENT || 'sandbox'
  const validEnvironments = ['sandbox', 'production']
  
  if (!validEnvironments.includes(environment)) {
    logMpesa('error', 'Invalid MPESA_ENVIRONMENT', { environment, valid: validEnvironments })
    return {
      isValid: false,
      error: `Invalid MPESA_ENVIRONMENT. Must be one of: ${validEnvironments.join(', ')}`
    }
  }

  logMpesa('info', 'Daraja M-Pesa configuration validated successfully', { environment })
  return { isValid: true, environment }
}

/**
 * Validate and format phone number for M-Pesa
 */
export function validatePhoneNumber(phoneNumber) {
  if (!phoneNumber) {
    throw new Error('Phone number is required')
  }

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

/**
 * Generate Daraja M-Pesa access token
 */
export async function generateMpesaAccessToken() {
  const { MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_ENVIRONMENT } = process.env
  
  // Validate credentials
  if (!MPESA_CONSUMER_KEY || !MPESA_CONSUMER_SECRET) {
    throw new Error('Missing Daraja API credentials: MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET are required')
  }
  
  const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64')
  const baseUrl = MPESA_ENVIRONMENT === 'production' 
    ? 'https://api.safaricom.co.ke' 
    : 'https://sandbox.safaricom.co.ke'
  
  try {
    logMpesa('info', 'Generating Daraja M-Pesa access token', { 
      environment: MPESA_ENVIRONMENT || 'sandbox',
      endpoint: `${baseUrl}/oauth/v1/generate`
    })
    
    const response = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    })

    const data = await response.json()
    
    if (!response.ok) {
      logMpesa('error', 'Daraja API token generation failed', {
        status: response.status,
        statusText: response.statusText,
        error: data
      })
      throw new Error(`Daraja API error: ${data.error_description || data.errorMessage || response.statusText}`)
    }

    if (!data.access_token) {
      throw new Error('No access token received from Daraja API')
    }

    logMpesa('info', 'Daraja access token generated successfully', {
      expires_in: data.expires_in,
      token_type: data.token_type || 'Bearer'
    })
    
    return {
      success: true,
      access_token: data.access_token,
      expires_in: data.expires_in,
      token_type: data.token_type || 'Bearer'
    }
  } catch (error) {
    logMpesa('error', 'Failed to generate Daraja access token', { 
      error: error.message,
      stack: error.stack
    })
    throw error
  }
}

/**
 * Generate Daraja M-Pesa password and timestamp for STK Push
 */
export function generateMpesaPassword() {
  const { MPESA_BUSINESS_SHORT_CODE, MPESA_PASSKEY } = process.env
  
  if (!MPESA_BUSINESS_SHORT_CODE || !MPESA_PASSKEY) {
    throw new Error('Missing Daraja credentials: MPESA_BUSINESS_SHORT_CODE and MPESA_PASSKEY are required')
  }
  
  // Generate timestamp in the format: YYYYMMDDHHMMSS
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14)
  
  // Create password: Base64(BusinessShortCode + Passkey + Timestamp)
  const password = Buffer.from(`${MPESA_BUSINESS_SHORT_CODE}${MPESA_PASSKEY}${timestamp}`).toString('base64')
  
  logMpesa('info', 'Generated Daraja STK Push credentials', {
    shortCode: MPESA_BUSINESS_SHORT_CODE,
    timestamp,
    passwordLength: password.length
  })
  
  return { password, timestamp }
}

/**
 * Create Daraja STK Push payload
 */
export function createStkPushPayload(phoneNumber, amount, accountReference, description) {
  const { MPESA_BUSINESS_SHORT_CODE, NEXT_PUBLIC_BASE_URL, MPESA_COMMAND_ID } = process.env
  const { password, timestamp } = generateMpesaPassword()
  
  // Validate required parameters
  if (!phoneNumber || !amount || !accountReference) {
    throw new Error('Missing required STK Push parameters: phoneNumber, amount, accountReference')
  }
  
  // Ensure amount is a positive integer
  const numericAmount = Math.round(Number(amount))
  if (numericAmount <= 0) {
    throw new Error('Amount must be a positive number')
  }
  
  // Ensure callback URL is properly formatted
  let callbackUrl = `${NEXT_PUBLIC_BASE_URL}/api/mpesa/payment-callback`
  
  // Validate callback URL format
  try {
    new URL(callbackUrl)
  } catch (error) {
    throw new Error(`Invalid callback URL format: ${callbackUrl}`)
  }
  
  // Log the callback URL for debugging
  logMpesa('info', '🔗 Daraja STK Push payload created', { 
    callbackUrl,
    amount: numericAmount,
    phone: phoneNumber.replace(/\d(?=\d{4})/g, '*'),
    accountReference
  })
  
  const payload = {
    BusinessShortCode: MPESA_BUSINESS_SHORT_CODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: MPESA_COMMAND_ID || 'CustomerPayBillOnline',
    Amount: numericAmount,
    PartyA: phoneNumber,
    PartyB: MPESA_BUSINESS_SHORT_CODE,
    PhoneNumber: phoneNumber,
    CallBackURL: callbackUrl,
    AccountReference: accountReference.substring(0, 12), // Max 12 characters
    TransactionDesc: description.substring(0, 13) // Max 13 characters
  }
  
  // Validate payload before returning
  const requiredFields = ['BusinessShortCode', 'Password', 'Timestamp', 'Amount', 'PartyA', 'PartyB', 'PhoneNumber', 'CallBackURL']
  const missingFields = requiredFields.filter(field => !payload[field])
  
  if (missingFields.length > 0) {
    throw new Error(`STK Push payload missing required fields: ${missingFields.join(', ')}`)
  }
  
  return payload
}

/**
 * Send Daraja STK Push request
 */
export async function sendStkPush(payload) {
  const { MPESA_ENVIRONMENT } = process.env
  const baseUrl = MPESA_ENVIRONMENT === 'production' 
    ? 'https://api.safaricom.co.ke' 
    : 'https://sandbox.safaricom.co.ke'
  
  const stkPushUrl = `${baseUrl}/mpesa/stkpush/v1/processrequest`

  try {
    // Get access token
    const tokenResult = await generateMpesaAccessToken()
    
    logMpesa('info', 'Sending Daraja STK Push request', {
      endpoint: stkPushUrl,
      amount: payload.Amount,
      phone: payload.PhoneNumber.replace(/\d(?=\d{4})/g, '*'),
      accountReference: payload.AccountReference,
      businessShortCode: payload.BusinessShortCode
    })

    const response = await fetch(stkPushUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenResult.access_token}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(payload)
    })

    const data = await response.json()
    
    logMpesa('info', 'Daraja STK Push response received', {
      status: response.status,
      responseCode: data.ResponseCode,
      responseDescription: data.ResponseDescription
    })
    
    if (data.ResponseCode === '0') {
      logMpesa('info', 'Daraja STK Push sent successfully', {
        CheckoutRequestID: data.CheckoutRequestID,
        MerchantRequestID: data.MerchantRequestID,
        CustomerMessage: data.CustomerMessage
      })
      
      return {
        success: true,
        checkoutRequestId: data.CheckoutRequestID,
        merchantRequestId: data.MerchantRequestID,
        responseDescription: data.ResponseDescription,
        customerMessage: data.CustomerMessage
      }
    } else {
      logMpesa('error', 'Daraja STK Push failed', {
        responseCode: data.ResponseCode,
        responseDescription: data.ResponseDescription,
        errorCode: data.errorCode,
        errorMessage: data.errorMessage
      })
      
      return {
        success: false,
        error: data.ResponseDescription || data.errorMessage || 'STK push failed',
        errorCode: data.ResponseCode,
        responseCode: data.ResponseCode
      }
    }

  } catch (error) {
    logMpesa('error', 'Daraja STK Push request failed', { 
      error: error.message,
      stack: error.stack,
      endpoint: stkPushUrl
    })
    
    return {
      success: false,
      error: 'Network error occurred while sending STK push',
      details: error.message
    }
  }
}

/**
 * Calculate deposit amount (20% of total)
 */
export function calculateDepositAmount(totalAmount) {
  const depositAmount = Math.round(totalAmount * 0.2)
  
  if (depositAmount < 1) {
    throw new Error('Deposit amount too small (minimum 1 KES)')
  }
  
  return depositAmount
}

/**
 * Generate unique cart/order ID
 */
export function generateCartId() {
  return `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}


/**
 * Extract metadata from successful Daraja payment callback
 */
export function extractDarajaPaymentMetadata(callbackMetadata) {
  if (!callbackMetadata || !callbackMetadata.Item) {
    logMpesa('warn', 'No callback metadata provided for extraction')
    return {}
  }

  const metadata = {}
  
  callbackMetadata.Item.forEach(item => {
    switch (item.Name) {
      case 'Amount':
        metadata.amount = Number(item.Value)
        break
      case 'MpesaReceiptNumber':
        metadata.mpesaReceiptNumber = item.Value
        break
      case 'TransactionDate':
        // Convert Daraja timestamp to ISO format
        metadata.transactionDate = item.Value
        metadata.transactionDateISO = convertDarajaTimestamp(item.Value)
        break
      case 'PhoneNumber':
        metadata.phoneNumber = item.Value
        break
      case 'Balance':
        metadata.balance = Number(item.Value)
        break
    }
  })

  logMpesa('info', 'Daraja payment metadata extracted', {
    amount: metadata.amount,
    receiptNumber: metadata.mpesaReceiptNumber,
    phoneNumber: metadata.phoneNumber ? metadata.phoneNumber.replace(/\d(?=\d{4})/g, '*') : 'N/A'
  })

  return metadata
}

/**
 * Convert Daraja timestamp to ISO format
 */
export function convertDarajaTimestamp(darajaTimestamp) {
  try {
    // Daraja timestamp format: 20231016142530 (YYYYMMDDHHMMSS)
    if (!darajaTimestamp || darajaTimestamp.length !== 14) {
      return null
    }
    
    const year = darajaTimestamp.substring(0, 4)
    const month = darajaTimestamp.substring(4, 6)
    const day = darajaTimestamp.substring(6, 8)
    const hour = darajaTimestamp.substring(8, 10)
    const minute = darajaTimestamp.substring(10, 12)
    const second = darajaTimestamp.substring(12, 14)
    
    const isoString = `${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`
    return new Date(isoString).toISOString()
  } catch (error) {
    logMpesa('warn', 'Failed to convert Daraja timestamp', { darajaTimestamp, error: error.message })
    return null
  }
}

/**
 * Generate Daraja API headers
 */
export function generateDarajaHeaders(accessToken) {
  return {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    'User-Agent': 'Daraja-Node-Client/1.0'
  }
}

/**
 * Query payment status directly from Daraja API
 * This bypasses the callback system and queries the transaction directly
 */
export async function queryPaymentStatus(checkoutRequestId) {
  try {
    logMpesa('info', '🔍 Querying payment status from Daraja API', { checkoutRequestId })
    
    if (!checkoutRequestId) {
      throw new Error('CheckoutRequestID is required for payment status query')
    }
    
    // Generate access token
    const tokenResult = await generateMpesaAccessToken()
    
    const queryUrl = process.env.MPESA_ENVIRONMENT === 'production' 
      ? 'https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query'
      : 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query'
    
    // Generate fresh timestamp and password for the query
    const { password, timestamp } = generateMpesaPassword()
    
    const queryPayload = {
      BusinessShortCode: process.env.MPESA_BUSINESS_SHORT_CODE,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId
    }
    
    logMpesa('info', '📤 Sending Daraja payment query', { 
      url: queryUrl,
      checkoutRequestId,
      businessShortCode: process.env.MPESA_BUSINESS_SHORT_CODE,
      timestamp
    })
    
    const response = await fetch(queryUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenResult.access_token}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(queryPayload)
    })
    
    const result = await response.json()
    
    logMpesa('info', '📥 Daraja payment query response', {
      status: response.status,
      responseCode: result.ResponseCode,
      resultCode: result.ResultCode,
      resultDesc: result.ResultDesc
    })
    
    if (response.ok && result.ResponseCode === '0') {
      return {
        success: true,
        data: result,
        resultCode: result.ResultCode,
        resultDesc: result.ResultDesc,
        isPending: result.ResultCode === null || result.ResultCode === undefined,
        isSuccess: result.ResultCode === '0',
        isFailed: result.ResultCode && result.ResultCode !== '0'
      }
    } else {
      logMpesa('error', '❌ Daraja payment query failed', result)
      return {
        success: false,
        error: result.ResponseDescription || result.errorMessage || 'Payment query failed',
        data: result,
        responseCode: result.ResponseCode
      }
    }
    
  } catch (error) {
    logMpesa('error', '💥 Error querying Daraja payment status', {
      error: error.message,
      stack: error.stack,
      checkoutRequestId
    })
    
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Get Daraja API base URL based on environment
 */
export function getDarajaBaseUrl() {
  const environment = process.env.MPESA_ENVIRONMENT || 'sandbox'
  return environment === 'production' 
    ? 'https://api.safaricom.co.ke' 
    : 'https://sandbox.safaricom.co.ke'
}

/**
 * Validate Daraja callback data structure
 */
export function validateDarajaCallback(callbackData) {
  if (!callbackData || !callbackData.Body || !callbackData.Body.stkCallback) {
    return {
      isValid: false,
      error: 'Invalid Daraja callback structure - missing Body or stkCallback'
    }
  }

  const { stkCallback } = callbackData.Body
  const requiredFields = ['CheckoutRequestID', 'MerchantRequestID', 'ResultCode']
  
  for (const field of requiredFields) {
    if (stkCallback[field] === undefined || stkCallback[field] === null) {
      return {
        isValid: false,
        error: `Missing required Daraja callback field: ${field}`
      }
    }
  }

  logMpesa('info', 'Daraja callback validation successful', {
    checkoutRequestId: stkCallback.CheckoutRequestID,
    resultCode: stkCallback.ResultCode,
    resultDesc: stkCallback.ResultDesc
  })

  return { 
    isValid: true,
    resultCode: stkCallback.ResultCode,
    isSuccess: stkCallback.ResultCode === 0,
    isCancelled: stkCallback.ResultCode === 1032,
    isTimeout: stkCallback.ResultCode === 1037
  }
}
