import { NextResponse } from 'next/server'
import connectDB from '../../../lib/mongodb.js'
import Product from '../../../models/Product.js'

// Define section mappings
const SECTION_MAPPINGS = {
  collection: {
    categories: ['tv', 'radio', 'phone', 'electronics', 'accessory', 'appliances', 'fridge', 'cooler'],
  },
  fashion: {
    categories: ['outfits', 'hoodies', 'shoes', 'sneakers', 'ladies', 'men'],
  },
  preowned: {
    categoryPattern: /^preowned/i,
    metadataFilter: {
      'metadata.source': 'admin-panel',
      'metadata.submissionType': 'direct_to_admin'
    }
  },
  marketplace: {
    metadataFilter: {
      'metadata.source': 'sell-page',
      'metadata.submissionType': 'public'
    }
  }
}

export async function POST() {
  try {
    console.log('🚀 Starting database migration...')
    
    await connectDB()
    console.log('✅ Connected to database')
    
    // Get all products
    const allProducts = await Product.find({})
    console.log(`📊 Found ${allProducts.length} products to process`)
    
    let updateCount = 0
    let errors = []
    
    for (const product of allProducts) {
      try {
        let section = 'collection' // default
        
        // Determine section based on existing logic (check metadata first)
        if (SECTION_MAPPINGS.preowned.metadataFilter && 
            product.metadata?.source === 'admin-panel' && 
            product.metadata?.submissionType === 'direct_to_admin') {
          // ALL direct_to_admin products go to preowned section
          section = 'preowned'
        } else if (SECTION_MAPPINGS.marketplace.metadataFilter && 
                   product.metadata?.source === 'sell-page' && 
                   product.metadata?.submissionType === 'public') {
          section = 'marketplace'
        } else if (SECTION_MAPPINGS.preowned.categoryPattern && 
                   SECTION_MAPPINGS.preowned.categoryPattern.test(product.category)) {
          section = 'preowned'
        } else if (SECTION_MAPPINGS.fashion.categories.includes(product.category)) {
          section = 'fashion'
        } else if (SECTION_MAPPINGS.collection.categories.includes(product.category)) {
          section = 'collection'
        }
        
        // Update product if section is different
        if (product.section !== section) {
          await Product.updateOne(
            { _id: product._id },
            { $set: { section } }
          )
          updateCount++
          console.log(`✅ Updated "${product.name}" → section: ${section}`)
        }
      } catch (error) {
        errors.push({ productId: product._id, error: error.message })
        console.error(`❌ Error processing product ${product._id}:`, error.message)
      }
    }
    
    // Verify the migration
    const sectionCounts = await Product.aggregate([
      { $group: { _id: '$section', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ])
    
    console.log('\n📈 Migration Results:')
    sectionCounts.forEach(result => {
      console.log(`   ${result._id || 'null'}: ${result.count} products`)
    })
    
    const result = {
      success: true,
      message: 'Migration completed successfully!',
      stats: {
        totalProducts: allProducts.length,
        productsUpdated: updateCount,
        errors: errors.length,
        sectionCounts: sectionCounts.reduce((acc, item) => {
          acc[item._id || 'null'] = item.count
          return acc
        }, {})
      }
    }
    
    console.log(`\n🎉 Migration completed! Updated ${updateCount} products`)
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('💥 Migration failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
