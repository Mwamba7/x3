const { MongoClient } = require('mongodb');

async function removeCollectionProducts() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');

    const database = client.db();
    const productsCollection = database.collection('products');

    // Remove all products with section 'collection'
    const result = await productsCollection.deleteMany({ section: 'collection' });
    
    console.log(`🗑️  Removed ${result.deletedCount} collection products from database`);
    
    // Verify removal
    const remainingCollectionProducts = await productsCollection.countDocuments({ section: 'collection' });
    console.log(`✅ Verification: ${remainingCollectionProducts} collection products remaining`);

    // Show remaining products by section
    const sectionCounts = await productsCollection.aggregate([
      { $group: { _id: '$section', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).toArray();
    
    console.log('\n📊 Remaining products by section:');
    sectionCounts.forEach(item => {
      console.log(`   ${item._id || 'undefined'}: ${item.count} products`);
    });

  } catch (error) {
    console.error('❌ Error removing collection products:', error);
  } finally {
    await client.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run the cleanup
removeCollectionProducts().catch(console.error);
