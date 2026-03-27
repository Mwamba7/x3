import { NextResponse } from 'next/server'
import mongoose from 'mongoose'

export async function GET() {
  try {
    const startTime = Date.now()
    
    // Connect directly to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database'
    await mongoose.connect(mongoUri)
    const connectTime = Date.now() - startTime
    
    // Use raw collection
    const db = mongoose.connection.db
    const collectionStartTime = Date.now()
    const productsCollection = db.collection('products')
    
    // Test raw count
    const countStartTime = Date.now()
    const count = await productsCollection.countDocuments()
    const countTime = Date.now() - countStartTime
    
    // Test raw find
    const findStartTime = Date.now()
    const products = await productsCollection.find({}).limit(3).toArray()
    const findTime = Date.now() - findStartTime
    
    const totalTime = Date.now() - startTime
    
    await mongoose.disconnect()
    
    return NextResponse.json({
      success: true,
      message: 'Raw MongoDB Test',
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
