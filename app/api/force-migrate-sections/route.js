import { NextResponse } from 'next/server'
import connectDB from '../../../lib/mongodb.js'
import Product from '../../../models/Product.js'

export async function POST() {
  try {
    await connectDB()
    console.log('🔧 Force updating all products with section field...')
    
    // Get all products
    const allProducts = await Product.find({})
    console.log(`📊 Found ${allProducts.length} products`)
    
    let updateCount = 0
    
    for (const product of allProducts) {
      try {
        // Determine section based on category
        let section = 'collection' // default
        
        const fashionCategories = ['outfits', 'hoodie', 'shoes', 'sneakers', 'ladies', 'men']
        const collectionCategories = ['tv', 'radio', 'phone', 'electronics', 'accessory', 'appliances', 'fridge', 'cooler']
        
        if (product.metadata?.source === 'sell-page' && product.metadata?.submissionType === 'public') {
          section = 'marketplace'
        } else if (product.category && product.category.startsWith('preowned')) {
          section = 'preowned'
        } else if (product.category && fashionCategories.includes(product.category)) {
          section = 'fashion'
        } else if (product.category && collectionCategories.includes(product.category)) {
          section = 'collection'
        }
        
        console.log(`🔄 Processing: "${product.name}" (category: ${product.category}) → section: ${section}`)
        
        // Force update with $setOnInsert to ensure section field exists
        const result = await Product.updateOne(
          { _id: product._id },
          { 
            $set: { section: section },
            $setOnInsert: { section: section }
          },
          { upsert: false }
        )
        
        if (result.modifiedCount > 0) {
          updateCount++
          console.log(`✅ Updated "${product.name}" with section: ${section}`)
        } else {
          console.log(`⚠️  No changes for "${product.name}" (section already: ${product.section})`)
        }
        
      } catch (error) {
        console.error(`❌ Error processing product ${product._id}:`, error.message)
      }
    }
    
    // Verify the updates
    const sectionCounts = await Product.aggregate([
      { $group: { _id: '$section', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ])
    
    console.log('\n📈 Final Section Counts:')
    sectionCounts.forEach(result => {
      console.log(`   ${result._id || 'null'}: ${result.count} products`)
    })
    
    // Get sample products to verify
    const sampleProducts = await Product.find({}).limit(3)
    console.log('\n📋 Sample Products:')
    sampleProducts.forEach((product, index) => {
      console.log(`   ${index + 1}. "${product.name}" - Category: ${product.category} - Section: ${product.section || 'NULL'}`)
    })
    
    return NextResponse.json({
      success: true,
      message: 'Force migration completed!',
      stats: {
        totalProducts: allProducts.length,
        productsUpdated: updateCount,
        sectionCounts: sectionCounts.reduce((acc, item) => {
          acc[item._id || 'null'] = item.count
          return acc
        }, {})
      },
      sampleProducts: sampleProducts.map(p => ({
        name: p.name,
        category: p.category,
        section: p.section
      }))
    })
    
  } catch (error) {
    console.error('❌ Force migration failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
