// Direct MongoDB migration script
// Run this script directly with Node.js to add deliveryFees to all products

const { MongoClient } = require('mongodb');

// MongoDB connection string - adjust if needed
const MONGODB_URI = 'mongodb://localhost:27017/mwamba7';

async function migrateDeliveryFees() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔄 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const products = db.collection('products');
    
    // Find products without deliveryFees
    const productsWithoutDeliveryFees = await products.find({ 
      deliveryFees: { $exists: false } 
    }).toArray();
    
    console.log(`📊 Found ${productsWithoutDeliveryFees.length} products without deliveryFees`);
    
    if (productsWithoutDeliveryFees.length === 0) {
      console.log('✅ All products already have deliveryFees field');
      return;
    }
    
    // Default delivery fees
    const defaultDeliveryFees = {
      nairobiStandard: 100,
      nairobiExpress: 250,
      surroundingStandard: 300,
      surroundingExpress: 500,
      otherStandard: 350,
      otherExpress: 600,
      freeDeliveryThreshold: 5000
    };
    
    // Update products one by one
    let updatedCount = 0;
    for (const product of productsWithoutDeliveryFees) {
      try {
        const result = await products.updateOne(
          { _id: product._id },
          { 
            $set: { 
              deliveryFees: defaultDeliveryFees,
              adminContact: product.adminContact || ''
            }
          }
        );
        
        if (result.modifiedCount > 0) {
          updatedCount++;
          console.log(`✅ Updated: ${product.name}`);
        }
      } catch (error) {
        console.error(`❌ Failed to update ${product.name}:`, error.message);
      }
    }
    
    console.log(`🎉 Migration completed! Updated ${updatedCount} products`);
    
    // Verify the migration
    const remainingWithoutDeliveryFees = await products.countDocuments({ 
      deliveryFees: { $exists: false } 
    });
    console.log(`📊 Products without deliveryFees after migration: ${remainingWithoutDeliveryFees}`);
    
    if (remainingWithoutDeliveryFees === 0) {
      console.log('🎉 SUCCESS! All products now have deliveryFees field');
    }
    
  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await client.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run the migration
migrateDeliveryFees().then(() => {
  console.log('🏁 Migration script finished');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Migration script failed:', error);
  process.exit(1);
});
