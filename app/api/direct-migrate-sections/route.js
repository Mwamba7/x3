import { NextResponse } from 'next/server'
import mongoose from 'mongoose'

export async function POST() {
  try {
    // Connect directly to MongoDB without using the Product model
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database'
    await mongoose.connect(mongoUri)
    
    console.log('🔧 Direct MongoDB section update...')
    
    const db = mongoose.connection.db
    const productsCollection = db.collection('products')
    
    // Get all products
    const allProducts = await productsCollection.find({}).toArray()
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
        
        // Direct MongoDB update
        const result = await productsCollection.updateOne(
          { _id: product._id },
          { $set: { section: section } }
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
    const sectionCounts = await productsCollection.aggregate([
      { $group: { _id: '$section', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).toArray()
    
    console.log('\n📈 Final Section Counts:')
    sectionCounts.forEach(result => {
      console.log(`   ${result._id || 'null'}: ${result.count} products`)
    })
    
    // Get sample products to verify
    const sampleProducts = await productsCollection.find({}).limit(3).toArray()
    console.log('\n📋 Sample Products:')
    sampleProducts.forEach((product, index) => {
      console.log(`   ${index + 1}. "${product.name}" - Category: ${product.category} - Section: ${product.section || 'NULL'}`)
    })
    
    await mongoose.disconnect()
    
    return NextResponse.json({
      success: true,
      message: 'Direct MongoDB migration completed!',
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
    console.error('❌ Direct MongoDB migration failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
