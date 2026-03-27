import { NextResponse } from 'next/server'
import connectDB from '../../../../lib/mongodb'
import Order from '../../../../models/Order'

export async function POST(request) {
  try {
    await connectDB()
    
    const { userPhone, userEmail, userName } = await request.json()

    // Create a test order that represents a sale by the user
    const testOrder = new Order({
      orderId: `TEST-SALE-${Date.now()}`,
      userId: null, // This would be the buyer's ID in a real scenario
      customer: {
        name: "Test Buyer",
        phone: userPhone, // Using user's phone as the seller contact
        email: userEmail, // Using user's email as the seller contact
        address: {
          street: "Test Address",
          city: "Nairobi",
          area: "CBD",
          instructions: "Test sale order"
        }
      },
      items: [
        {
          productId: "test-product-1",
          name: "Samsung Galaxy Phone",
          price: 25000,
          quantity: 1,
          condition: "good",
          img: "/api/placeholder/150/150"
        }
      ],
      totalAmount: 25000,
      payment: {
        depositPaid: true,
        depositAmount: 5000,
        remainingPaid: true,
        remainingAmount: 20000,
        method: "mpesa"
      },
      fulfillment: {
        type: "pickup",
        deliveryOption: "standard"
      },
      status: "delivered", // Mark as delivered so it shows in sales
      createdAt: new Date(),
      updatedAt: new Date()
    })

    await testOrder.save()

    return NextResponse.json({
      success: true,
      message: "Test sale created successfully",
      orderId: testOrder.orderId,
      saleAmount: testOrder.totalAmount
    })

  } catch (error) {
    console.error('❌ Error creating test sale:', error)
    return NextResponse.json({
      error: 'Failed to create test sale'
    }, { status: 500 })
  }
}
