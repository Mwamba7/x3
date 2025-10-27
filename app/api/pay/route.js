import { NextResponse } from 'next/server'

// Redirect to new M-Pesa STK Push endpoint
export async function POST(request) {
  try {
    console.log('🔄 Redirecting /api/pay to /api/mpesa/stk-push')
    
    const body = await request.json()
    
    // Forward the request to the new M-Pesa STK Push endpoint
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/mpesa/stk-push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    
    const data = await response.json()
    
    return NextResponse.json(data, { status: response.status })
    
  } catch (error) {
    console.error('💥 Payment redirect error:', error)
    return NextResponse.json({
      success: false,
      error: 'Payment service temporarily unavailable',
      details: error.message
    }, { status: 500 })
  }
}
