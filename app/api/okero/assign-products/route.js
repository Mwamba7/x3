import { NextResponse } from 'next/server'
import connectDB from '../../../../lib/mongodb'
import Product from '../../../../models/Product'
import User from '../../../../models/User'

export async function POST(request) {
  try {
    await connectDB()
    
    const { userEmail, productCount = 3 } = await request.json()

    // Find the user
    const user = await User.findOne({ email: userEmail })
    if (!user) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 })
    }

    // Find products without sellerId and assign them to the user
    const unassignedProducts = await Product.find({ 
      $or: [
        { sellerId: { $exists: false } },
        { sellerId: null }
      ]
    }).limit(productCount)

    if (unassignedProducts.length === 0) {
      return NextResponse.json({
        error: 'No unassigned products found'
      }, { status: 404 })
    }

    // Update products to assign them to the user
    const productIds = unassignedProducts.map(p => p._id)
    await Product.updateMany(
      { _id: { $in: productIds } },
      { 
        $set: { 
          sellerId: user._id,
          status: 'active',
          updatedAt: new Date()
        }
      }
    )

    const assignedProducts = unassignedProducts.map(p => ({
      id: p._id,
      name: p.name,
      price: p.price,
      category: p.category
    }))

    return NextResponse.json({
      success: true,
      message: `Successfully assigned ${assignedProducts.length} products to ${user.name}`,
      assignedProducts: assignedProducts,
      userInfo: {
        name: user.name,
        email: user.email
      }
    })

  } catch (error) {
    console.error('❌ Error assigning products:', error)
    return NextResponse.json({
      error: 'Failed to assign products'
    }, { status: 500 })
  }
}
