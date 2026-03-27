import mongoose from 'mongoose'
import connectDB from '../lib/mongodb.js'
import Product from '../models/Product.js'

// Define section mappings
const SECTION_MAPPINGS = {
  collection: {
    categories: ['tv', 'radio', 'phone', 'electronics', 'accessory', 'appliances', 'fridge', 'cooler'],
    excludeCommunity: true
  },
  fashion: {
    categories: ['outfits', 'hoodie', 'shoes', 'sneakers', 'ladies', 'men'],
    excludeCommunity: true
  },
  preowned: {
    categories: null, // Uses regex pattern
    categoryPattern: /^preowned/i,
    excludeCommunity: true
  },
  marketplace: {
    categories: null, // All categories
    metadataFilter: {
      'metadata.source': 'sell-page',
      'metadata.submissionType': 'public'
    }
  }
}

/**
 * Safely add section field to all products without breaking existing functionality
 */
async function migrateToSections() {
  try {
    await connectDB()
    console.log('Connected to database')
    
    // Get all products
    const allProducts = await Product.find({})
    console.log(`Found ${allProducts.length} products to process`)
    
    let updateCount = 0
    let errors = []
    
    for (const product of allProducts) {
      try {
        let section = null
        
        // Determine section based on existing logic
        if (SECTION_MAPPINGS.marketplace.metadataFilter && 
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
        } else {
          // Default fallback
          section = 'collection'
        }
        
        // Update product if section is different
        if (product.section !== section) {
          await Product.updateOne(
            { _id: product._id },
            { $set: { section } }
          )
          updateCount++
          console.log(`Updated product ${product.name} (${product._id}) to section: ${section}`)
        }
      } catch (error) {
        errors.push({ productId: product._id, error: error.message })
        console.error(`Error processing product ${product._id}:`, error)
      }
    }
    
    console.log(`\nMigration completed:`)
    console.log(`- Total products processed: ${allProducts.length}`)
    console.log(`- Products updated: ${updateCount}`)
    console.log(`- Errors: ${errors.length}`)
    
    if (errors.length > 0) {
      console.log('\nErrors details:')
      errors.forEach(err => console.log(`- Product ${err.productId}: ${err.error}`))
    }
    
    // Verify the migration
    console.log('\nVerifying migration results:')
    const sectionCounts = await Product.aggregate([
      { $group: { _id: '$section', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ])
    
    sectionCounts.forEach(result => {
      console.log(`- ${result._id || 'null'}: ${result.count} products`)
    })
    
    return { success: true, updateCount, errors: errors.length }
    
  } catch (error) {
    console.error('Migration failed:', error)
    return { success: false, error: error.message }
  }
}

// Run if called directly
if (require.main === module) {
  migrateToSections()
    .then(result => {
      console.log('Migration result:', result)
      process.exit(result.success ? 0 : 1)
    })
    .catch(error => {
      console.error('Migration failed:', error)
      process.exit(1)
    })
}

export { migrateToSections }
