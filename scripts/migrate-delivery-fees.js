const mongoose = require('mongoose');

// Connect to MongoDB - using the same connection as the app
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mwamba7';

// Connect to MongoDB
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const ProductSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

async function runMigration() {
  try {
    console.log('🔄 Starting delivery fees migration...');
    
    // Find all products that don't have deliveryFees
    const productsWithoutDeliveryFees = await Product.find({ deliveryFees: { $exists: false } });
    
    console.log(`📊 Found ${productsWithoutDeliveryFees.length} products without deliveryFees`);
    
    if (productsWithoutDeliveryFees.length === 0) {
      console.log('✅ All products already have deliveryFees field');
      process.exit(0);
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
    };
    
    // Update all products without deliveryFees
    let updatedCount = 0;
    for (const product of productsWithoutDeliveryFees) {
      await Product.findByIdAndUpdate(
        product._id,
        { 
          $set: { deliveryFees: defaultDeliveryFees },
          $setOnInsert: { adminContact: '' }
        }
      );
      updatedCount++;
      console.log(`✅ Updated product: ${product.name}`);
    }
    
    console.log(`🎉 Migration completed! Updated ${updatedCount} products`);
    
    // Verify the migration
    const remainingWithoutDeliveryFees = await Product.countDocuments({ deliveryFees: { $exists: false } });
    console.log(`📊 Products without deliveryFees after migration: ${remainingWithoutDeliveryFees}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

runMigration();
