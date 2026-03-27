import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import Order from '../../../../models/Order'
import Product from '../../../../models/Product'
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
    
    // Get user info to match with orders
    const User = (await import('../../../../models/User')).default
    const userInfo = await User.findById(decoded.userId).select('email phone name')
    
    if (!userInfo) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 })
    }

    // Find orders where the customer phone or email matches the user
    // This represents sales where the user was the seller (contacted via their info)
    const salesOrders = await Order.find({
      $or: [
        { 'customer.phone': userInfo.phone },
        { 'customer.email': userInfo.email }
      ],
      status: 'delivered' // Only count completed sales
    }).sort({ createdAt: -1 })

    // Transform orders into sales format
    const sales = salesOrders.map(order => ({
      _id: order._id,
      orderId: order.orderId,
      productName: order.items.map(item => item.name).join(', '),
      saleAmount: order.totalAmount,
      saleDate: order.createdAt,
      buyerName: order.customer.name,
      buyerPhone: order.customer.phone,
      itemCount: order.items.length
    }))

    return NextResponse.json({
      success: true,
      sales: sales
    })

  } catch (error) {
    console.error('❌ Error fetching user sales:', error)
    return NextResponse.json({
      error: 'Failed to fetch sales'
    }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    await connectDB()
    const { userPhone } = await request.json()
    
    if (!userPhone) {
      return NextResponse.json({ sales: [] })
    }
    
    // Get all user products (sales) from database
    const products = await Product.find({ 
      $or: [
        { 'originalSeller.phone': userPhone },
        { 'metadata.sellerPhone': userPhone }
      ],
      status: 'sold' // Only fetch sold products
    }).sort({ createdAt: -1 })
    
    const sales = products.map(product => ({
      id: product._id,
      name: product.name,
      category: product.category,
      price: product.price,
      section: product.section,
      status: product.status,
      images: product.images || [product.img],
      condition: product.condition,
      description: product.meta || product.description,
      approvedBy: product.approvedBy,
      approvedAt: product.approvedAt,
      originalSeller: product.originalSeller,
      metadata: product.metadata,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    }))
    
    return NextResponse.json({ 
      success: true,
      sales: sales
    })
    
  } catch (error) {
    console.error('Error fetching user sales:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message,
      sales: []
    }, { status: 500 })
  }
}
