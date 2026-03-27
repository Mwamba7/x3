const mongoose = require('mongoose');

// Test database connection
async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    
    // This will use the MONGODB_URI from your .env file
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI not found in environment variables');
      console.log('Please check your .env file');
      return;
    }
    
    console.log('🔗 Connecting to:', MONGODB_URI.replace(/\/\/.*@/, '//***:***@'));
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Database connection successful!');
    
    // Test if we can access the products collection
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('📋 Available collections:', collections.map(c => c.name));
    
    // Count products
    const productsCount = await db.collection('products').countDocuments();
    console.log('📦 Total products:', productsCount);
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected successfully');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    if (error.message.includes('ESERVFAIL')) {
      console.log('\n🔧 DNS Resolution Error - Solutions:');
      console.log('1. Check your internet connection');
      console.log('2. Verify MongoDB Atlas cluster is running');
      console.log('3. Update MONGODB_URI in .env file');
      console.log('4. Try using local MongoDB instead');
    }
  }
}

testConnection();
