import { NextResponse } from 'next/server'
import connectDB from '../../../lib/mongodb.js'
import Product from '../../../models/Product.js'

export async function POST() {
  try {
    await connectDB()
    console.log('🔧 Testing manual section update...')
    
    // Get a sample product
    const sampleProduct = await Product.findOne({})
    if (!sampleProduct) {
      return NextResponse.json({ error: 'No products found' }, { status: 404 })
    }
    
    console.log('📋 Sample product before update:', {
      id: sampleProduct._id,
      name: sampleProduct.name,
      category: sampleProduct.category,
      section: sampleProduct.section
    })
    
    // Try to update the section
    const updateResult = await Product.updateOne(
      { _id: sampleProduct._id },
      { $set: { section: 'collection' } }
    )
    
    console.log('📊 Update result:', updateResult)
    
    // Get the updated product
    const updatedProduct = await Product.findById(sampleProduct._id)
    console.log('📋 Sample product after update:', {
      id: updatedProduct._id,
      name: updatedProduct.name,
      category: updatedProduct.category,
      section: updatedProduct.section
    })
    
    return NextResponse.json({
      success: true,
      before: {
        id: sampleProduct._id,
        name: sampleProduct.name,
        category: sampleProduct.category,
        section: sampleProduct.section
      },
      updateResult,
      after: {
        id: updatedProduct._id,
        name: updatedProduct.name,
        category: updatedProduct.category,
        section: updatedProduct.section
      }
    })
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
