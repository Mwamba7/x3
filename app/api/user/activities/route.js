import connectDB from '../../../../lib/mongodb'
import Order from '../../../../models/Order'
import Product from '../../../../models/Product'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    await connectDB()
    const { userPhone } = await request.json()
    
    if (!userPhone) {
      return NextResponse.json({ activities: [] })
    }
    
    // Get all user activities from database
    const activities = []
    
    // 1. Get orders (purchases)
    const orders = await Order.find({ 
      'customer.phone': userPhone 
    }).sort({ createdAt: -1 }).limit(20)
    
    orders.forEach(order => {
      activities.push({
        type: 'purchase',
        id: order.orderId,
        description: `Purchased ${order.items?.length || 0} item(s)`,
        amount: order.totalAmount,
        status: order.status,
        date: order.createdAt,
        details: {
          items: order.items,
          paymentMethod: order.paymentMethod,
          depositPaid: order.depositPaid
        }
      })
    })
    
    // 2. Get submitted products (sales)
    const products = await Product.find({ 
      $or: [
        { 'originalSeller.phone': userPhone },
        { 'metadata.sellerPhone': userPhone }
      ]
    }).sort({ createdAt: -1 }).limit(20)
    
    products.forEach(product => {
      activities.push({
        type: 'product_submission',
        id: product._id,
        description: `Submitted ${product.name}`,
        amount: product.price,
        status: product.status,
        date: product.createdAt,
        details: {
          category: product.category,
          section: product.section,
          approved: product.approvedBy ? true : false
        }
      })
    })
    
    // Sort by date (most recent first)
    activities.sort((a, b) => new Date(b.date) - new Date(a.date))
    
    return NextResponse.json({ 
      success: true,
      activities: activities.slice(0, 50) // Return latest 50 activities
    })
    
  } catch (error) {
    console.error('Error fetching user activities:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message,
      activities: []
    }, { status: 500 })
  }
}
