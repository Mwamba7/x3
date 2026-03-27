import connectDB from '../../../lib/mongodb'
import Product from '../../../models/Product'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    await connectDB()
    
    // Get a sample product to check its structure
    const sampleProduct = await Product.findOne()
    
    if (!sampleProduct) {
      return NextResponse.json({ error: 'No products found' }, { status: 404 })
    }
    
    // Check if deliveryFees field exists
    const hasDeliveryFees = sampleProduct.deliveryFees !== undefined
    
    // Get all products and count how many have deliveryFees
    const allProducts = await Product.find({})
    const productsWithDeliveryFees = allProducts.filter(p => p.deliveryFees !== undefined)
    const productsWithoutDeliveryFees = allProducts.filter(p => p.deliveryFees === undefined)
    
    return NextResponse.json({
      sampleProduct: {
        id: sampleProduct._id,
        name: sampleProduct.name,
        hasDeliveryFees,
        deliveryFees: sampleProduct.deliveryFees,
        allFields: Object.keys(sampleProduct.toObject())
      },
      statistics: {
        totalProducts: allProducts.length,
        productsWithDeliveryFees: productsWithDeliveryFees.length,
        productsWithoutDeliveryFees: productsWithoutDeliveryFees.length
      },
      productsWithoutDeliveryFees: productsWithoutDeliveryFees.map(p => ({
        id: p._id,
        name: p.name
      }))
    })
    
  } catch (error) {
    console.error('Debug delivery fees error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
