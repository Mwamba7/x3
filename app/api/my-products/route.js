import { NextResponse } from 'next/server'
import connectDB from '../../../lib/mongodb'
import PendingProduct from '../../../models/PendingProduct'
import Product from '../../../models/Product'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone')

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    await connectDB()

    // Get pending products (exclude those that are already approved)
    const pendingProducts = await PendingProduct.find({ 
      sellerPhone: phone,
      status: { $ne: 'approved' }  // Exclude approved pending products
    }).sort({ createdAt: -1 })

    // Get approved products (from main Product collection)
    // These would have metadata indicating they came from sell page or admin approval
    const approvedProducts = await Product.find({
      'metadata.originalSeller.phone': phone,
      'metadata.source': { $in: ['sell-page', 'sell-page-preowned', 'admin-panel'] }
    }).sort({ createdAt: -1 })

    // Combine and format all products
    const allProducts = []

    // Add pending products
    pendingProducts.forEach(product => {
      allProducts.push({
        _id: product._id,
        name: product.name,
        category: product.category,
        price: product.price,
        description: product.description,
        submissionType: product.submissionType,
        status: product.status,
        rejectionReason: product.rejectionReason,
        createdAt: product.createdAt,
        source: 'pending'
      })
    })

    // Add approved products
    approvedProducts.forEach(product => {
      // Determine if product is sold based on inStock field or status
      const isSold = !product.inStock || product.status === 'sold' || product.status === 'out-of-stock'
      // Products sold to admin (admin-panel source) should be marked as sold
      const soldToAdmin = product.metadata?.source === 'admin-panel'
      
      allProducts.push({
        _id: product._id,
        name: product.name,
        category: product.category,
        price: product.price,
        description: product.description,
        submissionType: product.metadata?.submissionType || 'unknown',
        status: (isSold || soldToAdmin) ? 'sold' : 'approved',
        createdAt: product.createdAt,
        source: 'approved',
        inStock: product.inStock,
        productStatus: product.status, // Original product status
        soldToAdmin: soldToAdmin // Flag to indicate sold to admin
      })
    })

    // Sort by creation date (newest first)
    allProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    return NextResponse.json({ 
      products: allProducts,
      total: allProducts.length
    })

  } catch (error) {
    console.error('Error fetching user products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}
