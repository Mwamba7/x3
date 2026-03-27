import { NextResponse } from 'next/server'
import mongoose from 'mongoose'

export async function GET() {
  try {
    // Connect directly to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database'
    await mongoose.connect(mongoUri)
    
    const db = mongoose.connection.db
    const productsCollection = db.collection('products')
    
    // Get one product and analyze its size
    const product = await productsCollection.findOne({})
    
    // Get document stats
    const stats = await productsCollection.stats()
    
    // Calculate document size
    const docSize = JSON.stringify(product).length
    const docSizeKB = (docSize / 1024).toFixed(2)
    
    await mongoose.disconnect()
    
    return NextResponse.json({
      success: true,
      message: 'Document Analysis',
      documentStats: {
        documentCount: stats.count,
        avgDocumentSize: `${(stats.avgObjSize / 1024).toFixed(2)} KB`,
        totalCollectionSize: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
        sampleDocumentSize: `${docSizeKB} KB`,
        sampleDocumentFields: Object.keys(product).length,
        sampleDocumentKeys: Object.keys(product)
      },
      sampleProduct: {
        name: product.name,
        category: product.category,
        section: product.section,
        hasImages: !!product.images,
        imagesCount: product.images ? product.images.length : 0,
        hasMetadata: !!product.metadata,
        hasDeliveryFees: !!product.deliveryFees
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
