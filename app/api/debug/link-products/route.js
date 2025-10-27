import { NextResponse } from 'next/server'
import connectDB from '../../../../lib/mongodb'
import PendingProduct from '../../../../models/PendingProduct'
import Product from '../../../../models/Product'
import { verifyAuth } from '../../../../lib/auth-middleware'

export async function POST(request) {
  try {
    await connectDB()
    
    // Check if user is authenticated
    const authResult = await verifyAuth(request)
    
    if (!authResult.authenticated) {
      return NextResponse.json({
        error: 'Authentication required'
      }, { status: 401 })
    }

    const userId = authResult.user.id
    const userEmail = authResult.user.email
    const userName = authResult.user.name
    const userPhone = authResult.user.phone

    console.log('🔗 Linking products for user:', { userId, userName, userEmail, userPhone })

    // Find products that might belong to this user based on email, name, or phone
    const matchingPendingProducts = await PendingProduct.find({
      $and: [
        { sellerId: { $exists: false } }, // Products without sellerId
        {
          $or: [
            { sellerEmail: userEmail },
            { sellerName: userName },
            { sellerPhone: userPhone }
          ]
        }
      ]
    })

    const matchingApprovedProducts = await Product.find({
      $and: [
        { sellerId: { $exists: false } }, // Products without sellerId
        // Add matching criteria here if needed
      ]
    })

    // Update pending products
    const pendingUpdateResult = await PendingProduct.updateMany(
      {
        $and: [
          { sellerId: { $exists: false } },
          {
            $or: [
              { sellerEmail: userEmail },
              { sellerName: userName },
              { sellerPhone: userPhone }
            ]
          }
        ]
      },
      { $set: { sellerId: userId } }
    )

    // Update approved products (if any match)
    const approvedUpdateResult = await Product.updateMany(
      {
        $and: [
          { sellerId: { $exists: false } },
          // Add matching criteria here if needed
        ]
      },
      { $set: { sellerId: userId } }
    )

    return NextResponse.json({
      success: true,
      message: 'Products linked successfully',
      results: {
        pendingProductsFound: matchingPendingProducts.length,
        pendingProductsUpdated: pendingUpdateResult.modifiedCount,
        approvedProductsUpdated: approvedUpdateResult.modifiedCount,
        linkedProducts: matchingPendingProducts.map(p => ({
          id: p._id,
          name: p.name,
          sellerName: p.sellerName,
          status: p.status
        }))
      }
    })

  } catch (error) {
    console.error('❌ Error linking products:', error)
    return NextResponse.json({
      error: 'Failed to link products',
      details: error.message
    }, { status: 500 })
  }
}
