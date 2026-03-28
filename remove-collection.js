// Simple script to remove Collection products
// Run with: node remove-collection.js

const mongoose = require('mongoose');

async function removeCollectionProducts() {
  try {
    // Connect to MongoDB - update the URI as needed
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('🔗 Connected to MongoDB');

    // Define Product schema (simplified)
    const ProductSchema = new mongoose.Schema({}, { strict: false, collection: 'products' });
    const Product = mongoose.model('Product', ProductSchema);

    // Count collection products before deletion
    const beforeCount = await Product.countDocuments({ section: 'collection' });
    console.log(`📊 Found ${beforeCount} products in Collection section`);

    if (beforeCount > 0) {
      // Remove all products with section 'collection'
      const result = await Product.deleteMany({ section: 'collection' });
      
      console.log(`🗑️  Successfully removed ${result.deletedCount} Collection products`);
      
      // Verify removal
      const afterCount = await Product.countDocuments({ section: 'collection' });
      console.log(`✅ Verification: ${afterCount} Collection products remaining`);
      
      // Show remaining products by section
      const sectionCounts = await Product.aggregate([
        { $group: { _id: '$section', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]);
      
      console.log('\n📊 Remaining products by section:');
      sectionCounts.forEach(item => {
        console.log(`   ${item._id || 'undefined'}: ${item.count} products`);
      });
    } else {
      console.log('✅ No Collection products found - already clean!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB connection closed');
  }
}

removeCollectionProducts();
