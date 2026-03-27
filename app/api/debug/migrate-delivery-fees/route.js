import connectDB from '../../../../lib/mongodb'
import Product from '../../../../models/Product'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    await connectDB()
    
    // Find all products that don't have deliveryFees
    const productsWithoutDeliveryFees = await Product.find({ deliveryFees: { $exists: false } })
    
    console.log(`Found ${productsWithoutDeliveryFees.length} products without deliveryFees`)
    
    // Default delivery fees to add
    const defaultDeliveryFees = {
      nairobiStandard: 100,
      nairobiExpress: 250,
      surroundingStandard: 300,
      surroundingExpress: 500,
      otherStandard: 350,
      otherExpress: 600,
      freeDeliveryThreshold: 5000
    }
    
    // Update all products without deliveryFees
    const updatePromises = productsWithoutDeliveryFees.map(product => {
      return Product.findByIdAndUpdate(
        product._id,
        { 
          $set: { deliveryFees: defaultDeliveryFees },
          $setOnInsert: { adminContact: '' }
        },
        { new: true, upsert: false }
      )
    })
    
    const updatedProducts = await Promise.all(updatePromises)
    
    return NextResponse.json({
      message: `Successfully added deliveryFees to ${updatedProducts.length} products`,
      updatedProducts: updatedProducts.map(p => ({
        id: p._id,
        name: p.name,
        deliveryFees: p.deliveryFees
      }))
    })
    
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
