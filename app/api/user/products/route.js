import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import Product from '../../../../models/Product'
import PendingProduct from '../../../../models/PendingProduct'
import User from '../../../../models/User'
import connectDB from '../../../../lib/mongodb'

export async function GET(request) {
  try {
    await connectDB()
    
    // Get token from cookies
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({
        error: 'Not authenticated'
      }, { status: 401 })
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.SESSION_SECRET || 'fallback-secret')
    console.log('🔍 Fetching products for user ID:', decoded.userId)
    
    // Get user info to match with seller data
    const user = await User.findById(decoded.userId).select('email phone')
    
    // Fetch user's products from both collections
    // Look for products where user is either the sellerId OR the original seller in metadata
    const [approvedProducts, pendingProducts] = await Promise.all([
      Product.find({
        $or: [
          { sellerId: decoded.userId },
          { 'metadata.originalSeller.email': user?.email },
          { 'metadata.originalSeller.phone': user?.phone }
        ]
      }).sort({ createdAt: -1 }).limit(25),
      PendingProduct.find({
        $or: [
          { sellerId: decoded.userId },
          { sellerEmail: user?.email },
          { sellerPhone: user?.phone }
        ]
      }).sort({ createdAt: -1 }).limit(25)
    ])

    console.log('📦 Found approved products:', approvedProducts.length)
    console.log('⏳ Found pending products:', pendingProducts.length)
    console.log('🔍 Pending products details:', pendingProducts.map(p => ({ id: p._id, name: p.name, sellerId: p.sellerId })))

    // Combine and format products
    const allProducts = [
      ...approvedProducts.map(p => ({
        _id: p._id,
        name: p.name,
        price: p.price,
        category: p.category,
        status: p.status || 'approved',
        image: p.image,
        createdAt: p.createdAt,
        source: 'approved',
        saleInfo: p.saleInfo || null,
        withdrawalRequested: p.saleInfo?.withdrawalRequested || false
      })),
      ...pendingProducts.map(p => ({
        _id: p._id,
        name: p.name,
        price: p.price,
        category: p.category,
        status: p.status,
        image: p.images?.[0],
        createdAt: p.createdAt,
        source: 'pending',
        rejectionReason: p.rejectionReason || null
      }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    return NextResponse.json({
      success: true,
      products: allProducts
    })

  } catch (error) {
    console.error('❌ Error fetching user products:', error)
    return NextResponse.json({
      error: 'Failed to fetch products'
    }, { status: 500 })
  }
}
