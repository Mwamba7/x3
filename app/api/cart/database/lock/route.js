import { NextResponse } from 'next/server'
import { verifyAuth } from '../../../../../lib/auth-middleware'
import connectDB from '../../../../../lib/mongodb'
import Cart from '../../../../../models/Cart'

// POST - Lock or unlock cart in database
export async function POST(request) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request)
    
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, paymentData } = await request.json()

    if (!action || !['lock', 'unlock'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    await connectDB()
    const userId = authResult.user.id

    // Find or create cart for user
    const cart = await Cart.findOrCreateCart(userId)

    if (action === 'lock') {
      // Lock cart
      cart.isLocked = true
      cart.lockedAt = new Date()
      cart.unlockedAt = null
      
      await cart.save()

      // Here you could also save payment data to a separate payment records table
      console.log('🔒 Cart locked for user:', userId, paymentData)

      return NextResponse.json({ 
        success: true, 
        message: 'Cart locked',
        cart: {
          is_locked: cart.isLocked,
          locked_at: cart.lockedAt,
          items: cart.getItemsObject()
        }
      })
    } else if (action === 'unlock') {
      // Unlock cart
      cart.isLocked = false
      cart.lockedAt = null
      cart.unlockedAt = new Date()
      
      await cart.save()

      console.log('🔓 Cart unlocked for user:', userId)

      return NextResponse.json({ 
        success: true, 
        message: 'Cart unlocked',
        cart: {
          is_locked: cart.isLocked,
          unlocked_at: cart.unlockedAt,
          items: cart.getItemsObject()
        }
      })
    }

  } catch (error) {
    console.error('Error managing cart lock:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - Check cart lock status from database
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
    
    if (!cart) {
      return NextResponse.json({ 
        success: true, 
        is_locked: false, 
        has_items: false 
      })
    }

    const itemsObject = cart.getItemsObject()
    const hasItems = Object.keys(itemsObject).length > 0

    return NextResponse.json({ 
      success: true, 
      is_locked: cart.isLocked, 
      locked_at: cart.lockedAt,
      has_items: hasItems,
      items_count: hasItems ? Object.values(itemsObject).reduce((sum, item) => sum + item.qty, 0) : 0
    })

  } catch (error) {
    console.error('Error checking cart status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
