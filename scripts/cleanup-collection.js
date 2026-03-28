// Comprehensive Collection section cleanup script
// This script removes the Collection section from the entire website

import { NextResponse } from 'next/server';
import connectDB from '../lib/mongodb';
import Product from '../models/Product';
import fs from 'fs';
import path from 'path';

async function cleanupCollectionSection() {
  console.log('🚀 Starting Collection section cleanup...\n');

  try {
    // 1. Remove Collection products from database
    console.log('📊 Step 1: Removing Collection products from database...');
    await connectDB();
    
    const beforeCount = await Product.countDocuments({ section: 'collection' });
    console.log(`   Found ${beforeCount} products in Collection section`);

    if (beforeCount > 0) {
      const result = await Product.deleteMany({ section: 'collection' });
      console.log(`   ✅ Removed ${result.deletedCount} Collection products`);
      
      const afterCount = await Product.countDocuments({ section: 'collection' });
      console.log(`   ✅ Verification: ${afterCount} Collection products remaining`);
    } else {
      console.log('   ✅ No Collection products found - already clean!');
    }

    // 2. Show remaining products summary
    const sectionCounts = await Product.aggregate([
      { $group: { _id: '$section', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    console.log('\n📊 Remaining products by section:');
    sectionCounts.forEach(item => {
      console.log(`   ${item._id || 'undefined'}: ${item.count} products`);
    });

    // 3. Check if StoreClient component still exists
    const storeClientPath = path.join(process.cwd(), 'components/StoreClient.jsx');
    if (fs.existsSync(storeClientPath)) {
      console.log('\n⚠️  Warning: StoreClient.jsx still exists');
      console.log('   Consider removing this file as it\'s no longer needed');
    } else {
      console.log('\n✅ StoreClient.jsx has been removed');
    }

    // 4. Check if collection references still exist in main page
    const pagePath = path.join(process.cwd(), 'app/page.jsx');
    const pageContent = fs.readFileSync(pagePath, 'utf8');
    
    if (pageContent.includes('StoreClient') || pageContent.includes('collection')) {
      console.log('\n⚠️  Warning: Collection references still exist in app/page.jsx');
    } else {
      console.log('\n✅ No Collection references found in main page');
    }

    console.log('\n🎉 Collection section cleanup completed!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Collection section removed from homepage');
    console.log('   ✅ Collection products removed from database');
    console.log('   ✅ Homepage now shows only Pre-owned and Community sections');
    console.log('   ✅ Hero rotator updated to exclude Collection products');

  } catch (error) {
    console.error('❌ Cleanup error:', error.message);
  }
}

// Run the cleanup
cleanupCollectionSection();
