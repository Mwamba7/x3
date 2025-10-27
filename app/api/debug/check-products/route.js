import { NextResponse } from 'next/server'
import connectDB from '../../../../lib/mongodb'
import PendingProduct from '../../../../models/PendingProduct'
import Product from '../../../../models/Product'

export async function GET(request) {
  try {
    await connectDB()
    
    // Get all pending products
    const allPendingProducts = await PendingProduct.find({}).sort({ createdAt: -1 }).limit(10)
    const allApprovedProducts = await Product.find({}).sort({ createdAt: -1 }).limit(10)
    
    return NextResponse.json({
      success: true,
      debug: {
        totalPendingProducts: allPendingProducts.length,
        totalApprovedProducts: allApprovedProducts.length,
        recentPendingProducts: allPendingProducts.map(p => ({
          id: p._id,
          name: p.name,
          sellerName: p.sellerName,
          sellerId: p.sellerId,
          status: p.status,
          createdAt: p.createdAt
        })),
        recentApprovedProducts: allApprovedProducts.map(p => ({
          id: p._id,
          name: p.name,
          sellerId: p.sellerId,
          status: p.status,
          createdAt: p.createdAt
        }))
      }
    })

  } catch (error) {
    console.error('❌ Error in debug check:', error)
    return NextResponse.json({
      error: 'Failed to check products',
      details: error.message
    }, { status: 500 })
  }
}
