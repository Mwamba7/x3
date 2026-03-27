// Simple migration script - run with: node migrate-simple.js
const fs = require('fs');
const path = require('path');

// Read the .env.local file to get MongoDB URI
const envPath = path.join(__dirname, '.env.local');
let mongoURI = 'mongodb://localhost:27017/mwamba7';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/MONGODB_URI=(.+)/);
  if (match) {
    mongoURI = match[1].trim();
  }
}

console.log('🔄 Connecting to MongoDB:', mongoURI);

// Simple MongoDB connection without mongoose
const { MongoClient } = require('mongodb');

async function runMigration() {
  const client = new MongoClient(mongoURI);
  
  try {
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
    
    // Update products
    let updatedCount = 0;
    for (const product of productsWithoutDeliveryFees) {
      await products.updateOne(
        { _id: product._id },
        { 
          $set: { 
            deliveryFees: defaultDeliveryFees,
            adminContact: product.adminContact || ''
          }
        }
      );
      updatedCount++;
      console.log(`✅ Updated: ${product.name}`);
    }
    
    console.log(`🎉 Migration completed! Updated ${updatedCount} products`);
    
    // Verify
    const remainingWithoutDeliveryFees = await products.countDocuments({ 
      deliveryFees: { $exists: false } 
    });
    console.log(`📊 Products without deliveryFees after migration: ${remainingWithoutDeliveryFees}`);
    
  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await client.close();
    console.log('🔌 MongoDB connection closed');
  }
}

runMigration();
