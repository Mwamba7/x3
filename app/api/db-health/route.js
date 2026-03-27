import { NextResponse } from 'next/server'
import connectDB from '../../../lib/mongodb.js'

export async function GET() {
  try {
    const startTime = Date.now()
    
    // Test database connection
    await connectDB()
    const connectionTime = Date.now() - startTime
    
    return NextResponse.json({
      success: true,
      message: 'Database Health Check',
      connectionTime: `${connectionTime}ms`,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
