import { NextResponse } from 'next/server'
import connectDB from '../../../../lib/mongodb'
import Order from '../../../../models/Order'

export async function GET(request) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone')
    
    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    // Clean phone number (remove spaces, dashes, etc.)
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')
    
    // Search for orders with matching phone number
    // Try different phone number formats (with/without country code)
    const phoneVariations = [
      cleanPhone,
      cleanPhone.startsWith('0') ? `254${cleanPhone.slice(1)}` : cleanPhone,
      cleanPhone.startsWith('254') ? `0${cleanPhone.slice(3)}` : cleanPhone,
      cleanPhone.startsWith('+254') ? cleanPhone.slice(1) : cleanPhone,
      cleanPhone.startsWith('+254') ? `0${cleanPhone.slice(4)}` : cleanPhone
    ]

    const orders = await Order.find({
      'customer.phone': { $in: phoneVariations }
    }).sort({ orderDate: -1 }) // Most recent first

    if (orders.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No orders found for this phone number'
      })
    }

    console.log(`📦 Found ${orders.length} orders for phone: ${phone}`)

    return NextResponse.json({
      success: true,
      orders: orders,
      count: orders.length
    })

  } catch (error) {
    console.error('❌ Error searching orders:', error)
    return NextResponse.json(
      { error: 'Failed to search orders', details: error.message },
      { status: 500 }
    )
  }
}
