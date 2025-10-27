import { NextResponse } from 'next/server'
import { getAllPaymentResults, getMemoryStorageStats } from '../../../lib/payment-storage'

export async function GET() {
  try {
    console.log('🔍 Running payment diagnosis...')
    
    const diagnosis = {
      timestamp: new Date().toISOString(),
      environment: {
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
        mpesaEnvironment: process.env.MPESA_ENVIRONMENT,
        hasConsumerKey: !!process.env.MPESA_CONSUMER_KEY,
        hasConsumerSecret: !!process.env.MPESA_CONSUMER_SECRET,
        hasPasskey: !!process.env.MPESA_PASSKEY,
        businessShortCode: process.env.MPESA_BUSINESS_SHORT_CODE
      },
      callbacks: {
        callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/mpesa/callback`,
        testCallbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/test-callback`
      },
      storage: {
        memory: getMemoryStorageStats(),
        database: 'checking...'
      },
      endpoints: {
        auth: '/api/mpesa/auth',
        stkPush: '/api/mpesa/stk-push',
        callback: '/api/mpesa/callback',
        status: '/api/mpesa/status',
        debug: '/api/mpesa/debug'
      }
    }
    
    // Check stored payment results
    const allResults = await getAllPaymentResults()
    diagnosis.storage.totalResults = allResults.length
    diagnosis.storage.recentResults = allResults.slice(-5).map(([key, value]) => ({
      checkoutRequestId: key,
      success: value.success,
      timestamp: value.timestamp,
      hasMetadata: !!value.metadata,
      transactionId: value.metadata?.mpesaReceiptNumber || 'N/A'
    }))
    
    // Test callback URL reachability
    try {
      const callbackTest = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/test-callback`)
      diagnosis.callbacks.reachable = callbackTest.ok
      diagnosis.callbacks.status = callbackTest.status
    } catch (error) {
      diagnosis.callbacks.reachable = false
      diagnosis.callbacks.error = error.message
    }
    
    // Test M-Pesa authentication
    try {
      const authTest = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/mpesa/auth`)
      const authData = await authTest.json()
      diagnosis.authentication = {
        working: authData.success,
        error: authData.error || null
      }
    } catch (error) {
      diagnosis.authentication = {
        working: false,
        error: error.message
      }
    }
    
    // Analyze issues
    const issues = []
    const solutions = []
    
    if (!diagnosis.callbacks.reachable) {
      issues.push('Callback URL is not reachable')
      solutions.push('Ensure ngrok tunnel is active and NEXT_PUBLIC_BASE_URL is correct')
    }
    
    if (!diagnosis.authentication.working) {
      issues.push('M-Pesa authentication failing')
      solutions.push('Check M-Pesa credentials in environment variables')
    }
    
    if (diagnosis.storage.totalResults === 0) {
      issues.push('No payment callbacks received')
      solutions.push('Check if M-Pesa can reach your callback URL')
    }
    
    if (diagnosis.storage.memory.size === 0 && diagnosis.storage.totalResults > 0) {
      issues.push('Memory storage empty but database has results')
      solutions.push('Payment results are in database but not loaded to memory')
    }
    
    diagnosis.issues = issues
    diagnosis.solutions = solutions
    diagnosis.status = issues.length === 0 ? 'healthy' : 'issues_found'
    
    return NextResponse.json(diagnosis)
    
  } catch (error) {
    console.error('💥 Payment diagnosis error:', error)
    return NextResponse.json({
      error: 'Payment diagnosis failed',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { action, checkoutRequestId } = await request.json()
    
    if (action === 'simulate_callback' && checkoutRequestId) {
      // Simulate a successful M-Pesa callback for testing
      const { storePaymentResult } = await import('../../../lib/payment-storage')
      
      const mockPaymentResult = {
        merchantRequestId: 'MOCK_MERCHANT_ID',
        checkoutRequestId: checkoutRequestId,
        resultCode: 0,
        resultDesc: 'The service request is processed successfully.',
        timestamp: new Date().toISOString(),
        success: true,
        metadata: {
          amount: 1000,
          mpesaReceiptNumber: `MOCK_${Date.now()}`,
          transactionDate: new Date().toISOString(),
          phoneNumber: '254712345678'
        }
      }
      
      await storePaymentResult(checkoutRequestId, mockPaymentResult)
      
      return NextResponse.json({
        message: 'Mock callback simulated successfully',
        checkoutRequestId,
        mockResult: mockPaymentResult,
        timestamp: new Date().toISOString()
      })
    }
    
    return NextResponse.json({
      error: 'Invalid action. Use "simulate_callback" with checkoutRequestId'
    }, { status: 400 })
    
  } catch (error) {
    console.error('💥 Payment diagnosis POST error:', error)
    return NextResponse.json({
      error: 'Payment diagnosis action failed',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
