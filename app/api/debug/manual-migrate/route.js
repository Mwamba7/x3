import connectDB from '../../../../lib/mongodb'
import Product from '../../../../models/Product'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    await connectDB()
    
    console.log('🔄 Manual migration started...')
    
    // Find all products that don't have deliveryFees
    const productsWithoutDeliveryFees = await Product.find({ deliveryFees: { $exists: false } })
    
    console.log(`📊 Found ${productsWithoutDeliveryFees.length} products without deliveryFees`)
    
    if (productsWithoutDeliveryFees.length === 0) {
      return NextResponse.json({ 
        message: 'All products already have deliveryFees field',
        migratedCount: 0
      })
    }
    
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
    let migratedCount = 0
    const migratedProducts = []
    
    for (const product of productsWithoutDeliveryFees) {
      try {
        const updatedProduct = await Product.findByIdAndUpdate(
          product._id,
          { 
            $set: { deliveryFees: defaultDeliveryFees },
            $setOnInsert: { adminContact: product.adminContact || '' }
          },
          { new: true }
        )
        
        migratedCount++
        migratedProducts.push({
          id: updatedProduct._id,
          name: updatedProduct.name,
          deliveryFees: updatedProduct.deliveryFees
        })
        
        console.log(`✅ Migrated product: ${product.name}`)
        
      } catch (error) {
        console.error(`❌ Failed to migrate product ${product.name}:`, error)
      }
    }
    
    console.log(`🎉 Manual migration completed! Migrated ${migratedCount} products`)
    
    return NextResponse.json({
      message: `Successfully migrated ${migratedCount} products`,
      migratedCount,
      migratedProducts
    })
    
  } catch (error) {
    console.error('❌ Manual migration error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
