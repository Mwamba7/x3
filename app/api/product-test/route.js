import { NextResponse } from 'next/server'
import connectDB from '../../../lib/mongodb.js'
import Product from '../../../models/Product.js'

export async function GET() {
  try {
    const startTime = Date.now()
    
    // Test database connection
    await connectDB()
    const connectTime = Date.now() - startTime
    
    // Test simple count query
    const countStartTime = Date.now()
    const count = await Product.countDocuments()
    const countTime = Date.now() - countStartTime
    
    // Test simple find query with limit
    const findStartTime = Date.now()
    const products = await Product.find({}).limit(3).lean()
    const findTime = Date.now() - findStartTime
    
    const totalTime = Date.now() - startTime
    
    return NextResponse.json({
      success: true,
      message: 'Product Model Test',
      timings: {
        connection: `${connectTime}ms`,
        countQuery: `${countTime}ms`,
        findQuery: `${findTime}ms`,
        total: `${totalTime}ms`
      },
      results: {
        totalProducts: count,
        sampleProducts: products.length
      },
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
