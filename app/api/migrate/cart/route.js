import { NextResponse } from 'next/server'
import { verifyAuth } from '../../../../lib/auth-middleware'
import connectDB from '../../../../lib/mongodb'
import Cart from '../../../../models/Cart'

// POST - Migrate localStorage cart to database
export async function POST(request) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request)
    
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { localStorageCart } = await request.json()

    if (!localStorageCart || typeof localStorageCart !== 'object') {
      return NextResponse.json({ error: 'Invalid cart data' }, { status: 400 })
    }

    await connectDB()
    const userId = authResult.user.id

    console.log('🔄 Migrating cart from localStorage to database for user:', userId)
    console.log('🛒 LocalStorage cart items:', Object.keys(localStorageCart).length)

    // Find or create cart for user
    const cart = await Cart.findOrCreateCart(userId)

    // Check if cart is locked
    if (cart.isLocked) {
      return NextResponse.json({ 
        error: 'Cannot migrate cart - cart is currently locked' 
      }, { status: 403 })
    }

    // Check if database cart already has items
    const existingItemsCount = cart.items.size
    if (existingItemsCount > 0) {
      console.log('⚠️ Database cart already has items, skipping migration')
      return NextResponse.json({
        success: true,
        message: 'Cart already exists in database',
        itemsMigrated: 0,
        itemsInDatabase: existingItemsCount
      })
    }

    // Migrate items from localStorage to database
    let migratedCount = 0
    for (const [productId, item] of Object.entries(localStorageCart)) {
      if (item && typeof item === 'object' && item.name && item.price) {
        cart.items.set(productId, {
          productId: productId,
          name: item.name,
          price: item.price,
          image: item.image || '',
          condition: item.condition || 'unknown',
          category: item.category || 'unknown',
          qty: item.qty || 1
        })
        migratedCount++
      }
    }

    // Save the updated cart
    await cart.save()

    console.log('✅ Migration completed:', migratedCount, 'items migrated')

    return NextResponse.json({
      success: true,
      message: 'Cart migrated successfully',
      itemsMigrated: migratedCount,
      cartId: cart._id
    })

  } catch (error) {
    console.error('❌ Error migrating cart:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - Check migration status
export async function GET(request) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request)
    
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const userId = authResult.user.id

    // Find cart for user
    const cart = await Cart.findOne({ userId })
    
    const status = {
      hasDatabaseCart: !!cart,
      itemsInDatabase: cart ? cart.items.size : 0,
      isCartLocked: cart ? cart.isLocked : false,
      lastActivity: cart ? cart.lastActivityAt : null,
      createdAt: cart ? cart.createdAt : null
    }

    return NextResponse.json({
      success: true,
      migrationStatus: status
    })

  } catch (error) {
    console.error('❌ Error checking migration status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
