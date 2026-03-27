const mongoose = require('mongoose');

// Simple Product schema for checking
const ProductSchema = new mongoose.Schema({}, { strict: false, collection: 'products' });
const Product = mongoose.model('ProductCheck', ProductSchema);

async function checkCurrentState() {
  try {
    // You'll need to update this with your actual MongoDB connection string
    const mongoUri = 'mongodb://localhost:27017/your-database';
    console.log('Connecting to database...');
    
    await mongoose.connect(mongoUri);
    
    const totalProducts = await Product.countDocuments();
    const electronics = await Product.countDocuments({ 
      category: { $in: ['tv','radio','phone','electronics','accessory','appliances','fridge','cooler'] } 
    });
    const fashion = await Product.countDocuments({ 
      category: { $in: ['outfits','hoodie','shoes','sneakers','ladies','men'] } 
    });
    const preowned = await Product.countDocuments({ 
      category: { $regex: /^preowned/i } 
    });
    const marketplace = await Product.countDocuments({ 
      'metadata.source': 'sell-page', 
      'metadata.submissionType': 'public' 
    });
    
    console.log('\n=== CURRENT DATABASE STATE ===');
    console.log('Total Products:', totalProducts);
    console.log('Electronics (Collection):', electronics);
    console.log('Fashion:', fashion);
    console.log('Pre-owned:', preowned);
    console.log('Marketplace:', marketplace);
    console.log('================================\n');
    
    await mongoose.disconnect();
    return { totalProducts, electronics, fashion, preowned, marketplace };
  } catch (error) {
    console.error('Error checking database:', error.message);
    console.log('\nPlease update the MongoDB connection string in the script');
    process.exit(1);
  }
}

if (require.main === module) {
  checkCurrentState();
}

module.exports = { checkCurrentState };
