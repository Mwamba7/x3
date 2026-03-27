import { NextResponse } from 'next/server'
import connectDB from '../../../../lib/mongodb'
import Order from '../../../../models/Order'
import { getAdminSession } from '../../../../lib/adminAuth'

export async function GET(request) {
  try {
    console.log('Admin orders API called')
    
    // Verify admin session
    const session = await getAdminSession()
    console.log('Admin session:', session ? 'Found' : 'Not found')
    
    if (!session || !session.isAdmin) {
      console.log('Unauthorized access attempt')
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    console.log('Fetching orders from database...')
    await connectDB()
    
    // Fetch all orders, sorted by newest first
    const orders = await Order.find({})
      .sort({ orderDate: -1 })
      .lean()
    
    console.log(`Found ${orders.length} orders`)
    
    // Transform orders to match expected format
    const transformedOrders = orders.map(order => ({
      _id: order._id,
      orderId: order.orderId,
      customer: {
        name: order.customer?.name || 'Unknown',
        phone: order.customer?.phone || 'Unknown',
        email: order.customer?.email || '',
        address: order.customer?.address || {}
      },
      customerInfo: {
        name: order.customer?.name || 'Unknown',
        phone: order.customer?.phone || 'Unknown',
        email: order.customer?.email || '',
        address: order.customer?.address || {}
      },
      items: order.items || [],
      subtotal: order.subtotal || 0,
      deliveryFee: order.deliveryFee || 0,
      totalAmount: order.totalAmount || 0,
      status: order.status || 'processing',
      payment: order.payment || {},
      delivery: order.delivery || {},
      orderDate: order.orderDate,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      notes: order.notes,
      adminNotes: order.adminNotes
    }))
    
    console.log('Orders transformed successfully')
    
    return NextResponse.json({
      success: true,
      orders: transformedOrders,
      count: transformedOrders.length
    })
    
  } catch (error) {
    console.error('Admin orders fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders: ' + error.message },
      { status: 500 }
    )
  }
}
