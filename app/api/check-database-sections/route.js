import { NextResponse } from 'next/server'
import connectDB from '../../../lib/mongodb.js'
import Product from '../../../models/Product.js'

export async function GET() {
  try {
    await connectDB()
    console.log('🔍 Checking database sections...')
    
    // Check total products
    const totalProducts = await Product.countDocuments()
    
    // Check products by section
    const sectionCounts = await Product.aggregate([
      { 
        $group: { 
          _id: '$section', 
          count: { $sum: 1 },
          examples: { $push: { name: '$name', category: '$category', section: '$section' } }
        } 
      },
      { $sort: { _id: 1 } }
    ])
    
    // Check for products without section field
    const productsWithoutSection = await Product.countDocuments({ 
      $or: [
        { section: { $exists: false } },
        { section: null },
        { section: '' }
      ]
    })
    
    // Check category distribution within each section
    const categoryBySection = await Product.aggregate([
      { $group: { _id: { section: '$section', category: '$category' }, count: { $sum: 1 } } },
      { $sort: { '_id.section': 1, count: -1 } }
    ])
    
    // Get sample products to verify structure
    const sampleProducts = await Product.find({}).limit(3).lean()
    
    const result = {
      success: true,
      totalProducts,
      sectionCounts: sectionCounts.map(item => ({
        section: item._id || 'NULL',
        count: item.count,
        examples: item.examples.slice(0, 3)
      })),
      productsWithoutSection,
      categoryBySection,
      sampleProductStructure: sampleProducts.length > 0 ? Object.keys(sampleProducts[0]) : [],
      hasSectionField: sampleProducts.length > 0 && sampleProducts[0].section !== undefined
    }
    
    console.log('✅ Database sections check completed')
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('❌ Error checking database sections:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
