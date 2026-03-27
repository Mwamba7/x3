const mongoose = require('mongoose');

// Simple Product schema for checking
const ProductSchema = new mongoose.Schema({}, { strict: false, collection: 'products' });
const Product = mongoose.model('ProductCheck', ProductSchema);

async function checkDatabaseSections() {
  try {
    // Connect to MongoDB - you'll need to update this with your actual connection string
    const mongoUri = 'mongodb://localhost:27017/your-database';
    console.log('Connecting to database...');
    
    await mongoose.connect(mongoUri);
    
    // Check total products
    const totalProducts = await Product.countDocuments();
    console.log(`\n=== TOTAL PRODUCTS: ${totalProducts} ===\n`);
    
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
    ]);
    
    console.log('=== PRODUCTS BY SECTION ===');
    sectionCounts.forEach(result => {
      console.log(`\n📁 Section: ${result._id || 'NULL/UNDEFINED'} (${result.count} products)`);
      
      // Show first 3 examples
      result.examples.slice(0, 3).forEach((example, index) => {
        console.log(`   ${index + 1}. "${example.name}" - Category: ${example.category} - Section: ${example.section || 'NULL'}`);
      });
      
      if (result.examples.length > 3) {
        console.log(`   ... and ${result.examples.length - 3} more`);
      }
    });
    
    // Check for products without section field
    const productsWithoutSection = await Product.find({ 
      $or: [
        { section: { $exists: false } },
        { section: null },
        { section: '' }
      ]
    }).limit(5);
    
    if (productsWithoutSection.length > 0) {
      console.log(`\n⚠️  PRODUCTS WITHOUT SECTION FIELD (${productsWithoutSection.length} shown):`);
      productsWithoutSection.forEach((product, index) => {
        console.log(`   ${index + 1}. "${product.name}" - Category: ${product.category} - Section: ${product.section || 'NULL'}`);
      });
    }
    
    // Check category distribution within each section
    console.log('\n=== CATEGORY DISTRIBUTION BY SECTION ===');
    const categoryBySection = await Product.aggregate([
      { $group: { _id: { section: '$section', category: '$category' }, count: { $sum: 1 } } },
      { $sort: { '_id.section': 1, count: -1 } }
    ]);
    
    let currentSection = null;
    categoryBySection.forEach(item => {
      if (item._id.section !== currentSection) {
        currentSection = item._id.section;
        console.log(`\n📁 ${currentSection || 'NULL'}:`);
      }
      console.log(`   ${item._id.category}: ${item.count} products`);
    });
    
    // Verify section field exists in schema
    console.log('\n=== SCHEMA VERIFICATION ===');
    const sampleProduct = await Product.findOne({});
    if (sampleProduct) {
      const hasSectionField = sampleProduct.section !== undefined;
      console.log(`✅ Section field exists in documents: ${hasSectionField}`);
      console.log(`📋 Sample product structure:`, Object.keys(sampleProduct.toObject()));
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Database check completed!');
    
  } catch (error) {
    console.error('❌ Error checking database:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  checkDatabaseSections();
}

module.exports = { checkDatabaseSections };
