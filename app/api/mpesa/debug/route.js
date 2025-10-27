import { NextResponse } from 'next/server'
import { getAllPaymentResults, clearPaymentResults, storePaymentResult, getMemoryStorageStats } from '../../../../lib/payment-storage'

export async function GET() {
  const allResults = await getAllPaymentResults()
  const memoryStats = getMemoryStorageStats()
  
  return NextResponse.json({
    message: 'M-Pesa Debug Endpoint',
    storedResults: allResults,
    totalResults: allResults.length,
    memoryResults: memoryStats.size,
    memoryKeys: memoryStats.keys,
    timestamp: new Date().toISOString()
  })
}

export async function DELETE() {
  const result = await clearPaymentResults()
  
  console.log('🧹 Cleared all stored payment results:', result)
  
  return NextResponse.json({
    message: 'All payment results cleared',
    ...result,
    timestamp: new Date().toISOString()
  })
}

export async function POST(request) {
  try {
    const { action, checkoutRequestId } = await request.json()
    
    if (action === 'clear' && checkoutRequestId) {
      const deleted = paymentResults.delete(checkoutRequestId)
      console.log('🧹 Cleared payment result for:', checkoutRequestId, 'Success:', deleted)
      
      return NextResponse.json({
        message: `Payment result ${deleted ? 'cleared' : 'not found'}`,
        checkoutRequestId,
        deleted,
        timestamp: new Date().toISOString()
      })
    }
    
    if (action === 'mock' && checkoutRequestId) {
      // Add a mock successful payment for testing
      paymentResults.set(checkoutRequestId, {
        merchantRequestId: 'MOCK_MERCHANT_ID',
        checkoutRequestId: checkoutRequestId,
        resultCode: 0,
        resultDesc: 'The service request is processed successfully.',
        timestamp: new Date().toISOString(),
        success: true,
        metadata: {
          amount: 1000,
          mpesaReceiptNumber: 'MOCK_RECEIPT_123',
          transactionDate: new Date().toISOString(),
          phoneNumber: '254712345678'
        }
      })
      
      console.log('🧪 Added mock payment result for:', checkoutRequestId)
      
      return NextResponse.json({
        message: 'Mock payment result added',
        checkoutRequestId,
        timestamp: new Date().toISOString()
      })
    }
    
    return NextResponse.json({
      error: 'Invalid action. Use "clear" or "mock"'
    }, { status: 400 })
    
  } catch (error) {
    console.error('💥 Debug endpoint error:', error)
    return NextResponse.json({
      error: 'Debug endpoint error',
      details: error.message
    }, { status: 500 })
  }
}
