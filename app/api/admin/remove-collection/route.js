import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Product from '../../../../models/Product';

export async function DELETE() {
  try {
    await connectDB();
    
    // Remove all products with section 'collection'
    const result = await Product.deleteMany({ section: 'collection' });
    
    console.log(`🗑️  Removed ${result.deletedCount} collection products from database`);
    
    // Verify removal
    const remainingCollectionProducts = await Product.countDocuments({ section: 'collection' });
    console.log(`✅ Verification: ${remainingCollectionProducts} collection products remaining`);

    // Show remaining products by section
    const sectionCounts = await Product.aggregate([
      { $group: { _id: '$section', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).toArray();
    
    console.log('\n📊 Remaining products by section:');
    sectionCounts.forEach(item => {
      console.log(`   ${item._id || 'undefined'}: ${item.count} products`);
    });

    return NextResponse.json({ 
      success: true, 
      message: `Successfully removed ${result.deletedCount} collection products`,
      remainingProducts: sectionCounts
    });

  } catch (error) {
    console.error('❌ Error removing collection products:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
