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
    const token = request.cookies.get('tt_session')?.value
    
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

    // Combine and format products with deduplication
    const allProducts = []
    const seenProducts = new Set()
    let duplicatesRemoved = 0

    // Add approved products first (these take priority)
    approvedProducts.forEach(p => {
      // Use multiple identifiers for robust deduplication
      const productKey = `${p.name}_${p.category}_${p.price}_${p.createdAt.getTime()}`
      seenProducts.add(productKey)
      
      // Determine submission type from metadata
      const submissionType = p.metadata?.submissionType || 'Direct to Admin'
      const source = p.metadata?.source || 'admin-panel'
      const soldToAdmin = source === 'admin-panel'
      
      // Determine correct status
      let productStatus = p.status || 'approved'
      
      // Normalize status values
      if (productStatus === 'available' || productStatus === 'active' || productStatus === 'live') {
        productStatus = 'approved'
      }
      
      if (soldToAdmin) {
        productStatus = 'sold'
      } else if (!p.inStock || productStatus === 'sold' || productStatus === 'out-of-stock') {
        productStatus = 'sold'
      }
      
      console.log(`📊 Product ${p.name}: original status="${p.status}", normalized status="${productStatus}", soldToAdmin=${soldToAdmin}, inStock=${p.inStock}`)
      
      allProducts.push({
        _id: p._id,
        name: p.name,
        price: p.price,
        category: p.category,
        status: productStatus,
        image: p.image,
        createdAt: p.createdAt,
        source: 'approved',
        submissionType: submissionType,
        soldToAdmin: soldToAdmin,
        inStock: p.inStock,
        saleInfo: p.saleInfo || null,
        withdrawalRequested: p.saleInfo?.withdrawalRequested || false,
        metadata: p.metadata || {}
      })
    })

    // Add pending products only if they don't duplicate approved products
    pendingProducts.forEach(p => {
      // Check if this pending product has a corresponding approved product
      const isDuplicate = approvedProducts.some(approved => 
        approved.name === p.name && 
        approved.category === p.category && 
        approved.price === p.price
      )
      
      if (!isDuplicate) {
        const productKey = `${p.name}_${p.category}_${p.price}_${p.createdAt.getTime()}`
        seenProducts.add(productKey)
        allProducts.push({
          _id: p._id,
          name: p.name,
          price: p.price,
          category: p.category,
          status: p.status,
          image: p.images?.[0],
          createdAt: p.createdAt,
          source: 'pending',
          submissionType: p.submissionType || 'Direct to Admin',
          rejectionReason: p.rejectionReason || null
        })
      } else {
        duplicatesRemoved++
        console.log('🔄 Removing duplicate pending product:', p.name, '(already approved)')
      }
    })

    // Sort by creation date (newest first)
    allProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    console.log(`📊 Final products: ${allProducts.length} (removed ${duplicatesRemoved} duplicates)`)

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
