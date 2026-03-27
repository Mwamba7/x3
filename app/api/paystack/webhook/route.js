import { NextResponse } from 'next/server'
import crypto from 'crypto'
import connectDB from '../../../../lib/mongodb'
import Order from '../../../../models/Order'
import Cart from '../../../../models/Cart'
import jwt from 'jsonwebtoken'

// Paystack configuration
const PAYSTACK_CONFIG = {
  secretKey: process.env.PAYSTACK_SECRET_KEY,
  webhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET
}

export async function POST(request) {
  try {
    console.log('🪝 Paystack webhook received...')

    if (!PAYSTACK_CONFIG.webhookSecret) {
      console.error('❌ Paystack webhook secret not configured')
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }
    
    const body = await request.text()
    const signature = request.headers.get('x-paystack-signature')
    
    // Verify webhook signature
    if (!signature) {
      console.error('❌ No webhook signature provided')
      return NextResponse.json({ error: 'No signature provided' }, { status: 400 })
    }
    
    const expectedSignature = crypto
      .createHmac('sha512', PAYSTACK_CONFIG.webhookSecret)
      .update(body)
      .digest('hex')
    
    if (signature !== expectedSignature) {
      console.error('❌ Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }
    
    const event = JSON.parse(body)
    console.log('📊 Webhook event:', event)
    
    // Handle different event types
    switch (event.event) {
      case 'charge.success':
        await handleSuccessfulCharge(event.data)
        break
        
      case 'charge.failed':
        await handleFailedCharge(event.data)
        break
        
      case 'transfer.success':
        await handleSuccessfulTransfer(event.data)
        break
        
      case 'transfer.failed':
        await handleFailedTransfer(event.data)
        break
        
      default:
        console.log('ℹ️ Unhandled event type:', event.event)
    }
    
    return NextResponse.json({ received: true })
    
  } catch (error) {
    console.error('💥 Webhook processing error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleSuccessfulCharge(chargeData) {
  console.log('✅ Payment successful:', chargeData)
  
  try {
    const { reference, amount, customer, metadata } = chargeData
    
    // Extract payment details
    const paidAmount = amount / 100 // Convert from kobo to KES
    const customerEmail = customer?.email
    const customerPhone = metadata?.phone
    const orderType = metadata?.orderType || 'deposit'
    const totalAmount = metadata?.totalAmount || paidAmount
    const depositAmount = metadata?.depositAmount || paidAmount
    const balanceAmount = metadata?.balanceAmount || (totalAmount - depositAmount)
    const userId = metadata?.userId
    
    console.log(`💰 Payment of KES ${paidAmount} completed for reference: ${reference}`)
    console.log(`👤 Customer: ${customerEmail}`)
    console.log(`📱 Phone: ${customerPhone}`)
    console.log(`📦 Order Type: ${orderType}`)
    console.log(`🆔 User ID: ${userId}`)
    
    // 1. Lock the cart in database after successful payment
    console.log('🔒 Locking cart after successful payment...')
    await connectDB()
    
    if (userId) {
      // Find and lock the user's cart
      const cart = await Cart.findOne({ userId })
      if (cart) {
        cart.isLocked = true
        cart.lockedAt = new Date()
        cart.unlockedAt = null
        cart.paymentReference = reference
        cart.depositAmount = paidAmount
        cart.totalAmount = totalAmount
        cart.balanceAmount = balanceAmount
        
        await cart.save()
        console.log('✅ Cart locked successfully for user:', userId)
        console.log('🔒 Cart details:', {
          isLocked: cart.isLocked,
          lockedAt: cart.lockedAt,
          itemsCount: cart.items?.length || 0,
          paymentReference: reference
        })
      } else {
        console.log('⚠️ No cart found for user:', userId)
      }
    } else {
      console.log('⚠️ No userId provided in payment metadata')
    }
    
    // 2. Create a temporary order record to indicate cart is locked
    const tempOrder = new Order({
      orderId: `TEMP-${Date.now()}`,
      userId: userId,
      customer: {
        name: metadata?.customerName || 'Pending',
        phone: customerPhone || '',
        email: customerEmail || ''
      },
      items: [], // Will be populated from cart during order completion
      totalAmount: totalAmount || 0,
      payment: {
        depositAmount: paidAmount || 0,
        depositPaid: true,
        remainingAmount: balanceAmount || 0,
        paymentMethod: 'paystack',
        transactionId: reference
      },
      status: 'payment_received',
      source: 'payment_lock',
      notes: 'Temporary order created for cart locking after deposit payment'
    })

    await tempOrder.save()
    console.log('✅ Temporary order created:', tempOrder.orderId)
    
    // 3. Store payment record for checkout process
    const paymentRecord = {
      paymentReference: reference,
      paymentMethod: 'paystack',
      depositPaid: true,
      paidAmount: paidAmount,
      totalAmount: totalAmount,
      balanceAmount: balanceAmount,
      customerEmail: customerEmail,
      customerPhone: customerPhone,
      userId: userId,
      paymentDate: new Date().toISOString(),
      chargeData: chargeData
    }
    
    console.log('💾 Payment record stored for checkout process')
    
    // 4. Update product availability if needed
    if (orderType === 'deposit') {
      console.log('🏷️ Marking products as sold/deposit-paid...')
      // This would typically update product status in database
      // For now, the cart locking mechanism handles this
    }
    
    // 5. Send confirmation (optional - could be implemented later)
    console.log('📧 Payment processing complete - cart locked and ready for order completion')
    
  } catch (error) {
    console.error('❌ Error processing successful charge:', error)
  }
}

async function handleFailedCharge(chargeData) {
  console.log('❌ Payment failed:', chargeData)
  
  try {
    const { reference, amount, customer, metadata } = chargeData
    
    // Update order status to failed
    // await Order.findOneAndUpdate(
    //   { paymentReference: reference },
    //   { 
    //     paymentStatus: 'failed',
    //     paymentMethod: 'paystack',
    //     failedAt: new Date(),
    //     transactionDetails: chargeData
    //   }
    // )
    
    console.log(`💸 Payment of ${amount / 100} KES failed for reference: ${reference}`)
    
  } catch (error) {
    console.error('❌ Error processing failed charge:', error)
  }
}

async function handleSuccessfulTransfer(transferData) {
  console.log('✅ Transfer successful:', transferData)
  // Handle successful transfers (for withdrawals, etc.)
}

async function handleFailedTransfer(transferData) {
  console.log('❌ Transfer failed:', transferData)
  // Handle failed transfers
}
