import { NextResponse } from 'next/server'
import { verifyAuth } from '../../../../lib/auth-middleware'
import connectDB from '../../../../lib/mongodb'
import Product from '../../../../models/Product'
import User from '../../../../models/User'
import WithdrawalRequest from '../../../../models/WithdrawalRequest'

// Create Withdrawal model for tracking withdrawal requests
import mongoose from 'mongoose'

const withdrawalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  salePrice: { type: Number, required: true },
  serviceFee: { type: Number, required: true }, // 15% of sale price
  withdrawalAmount: { type: Number, required: true }, // 85% of sale price
  paymentMethod: { type: String, required: true, default: 'mpesa' },
  phoneNumber: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  requestedAt: { type: Date, default: Date.now },
  processedAt: { type: Date },
  transactionId: { type: String }, // M-Pesa transaction ID when completed
  notes: { type: String }
}, {
  timestamps: true
})

const Withdrawal = mongoose.models.Withdrawal || mongoose.model('Withdrawal', withdrawalSchema)

export async function POST(request) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request)
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = authResult.user
    const body = await request.json()
    const { productId, phoneNumber, paymentMethod = 'mpesa' } = body

    // Validate required fields
    if (!productId || !phoneNumber) {
      return NextResponse.json({ 
        error: 'Product ID and phone number are required' 
      }, { status: 400 })
    }

    // Validate phone number format (Kenyan format)
    const phoneRegex = /^(0|\+254|254)?[17]\d{8}$/
    if (!phoneRegex.test(phoneNumber)) {
      return NextResponse.json({ 
        error: 'Please enter a valid Kenyan phone number' 
      }, { status: 400 })
    }

    await connectDB()

    // Find the product and verify ownership
    const product = await Product.findById(productId)
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Check if user owns this product (assuming sellerId field exists)
    if (product.sellerId && product.sellerId.toString() !== user.id.toString()) {
      return NextResponse.json({ 
        error: 'You can only request withdrawal for your own products' 
      }, { status: 403 })
    }

    // Check if product is sold
    if (product.status !== 'sold') {
      return NextResponse.json({ 
        error: 'Can only request withdrawal for sold products' 
      }, { status: 400 })
    }

    // Check if there's already a pending withdrawal for this product in WithdrawalRequest collection
    const existingWithdrawal = await WithdrawalRequest.findOne({
      productId: productId,
      status: { $in: ['pending', 'processing'] }
    })

    if (existingWithdrawal) {
      return NextResponse.json({ 
        error: 'A withdrawal request is already pending for this product' 
      }, { status: 400 })
    }

    // If product shows withdrawalRequested but no record exists, reset the flag
    if (product.withdrawalRequested && !existingWithdrawal) {
      console.log(`Resetting orphaned withdrawal flag for product ${productId}`)
      await Product.findByIdAndUpdate(productId, {
        withdrawalRequested: false,
        $unset: { withdrawalRequestedAt: 1 }
      })
      // Update the product object for further processing
      product.withdrawalRequested = false
    }

    // Calculate withdrawal amounts
    const salePrice = product.price || 0
    const serviceFee = Math.round(salePrice * 0.15) // 15% service fee
    const withdrawalAmount = Math.round(salePrice * 0.85) // 85% to user

    // Normalize phone number to standard format
    let normalizedPhone = phoneNumber.replace(/\s+/g, '')
    if (normalizedPhone.startsWith('0')) {
      normalizedPhone = '254' + normalizedPhone.substring(1)
    } else if (normalizedPhone.startsWith('+254')) {
      normalizedPhone = normalizedPhone.substring(1)
    } else if (!normalizedPhone.startsWith('254')) {
      normalizedPhone = '254' + normalizedPhone
    }

    // Create withdrawal request
    const withdrawal = new Withdrawal({
      userId: user.id,
      productId: productId,
      productName: product.name,
      salePrice: salePrice,
      serviceFee: serviceFee,
      withdrawalAmount: withdrawalAmount,
      paymentMethod: paymentMethod,
      phoneNumber: normalizedPhone,
      status: 'pending'
    })

    await withdrawal.save()

    // Also create entry in WithdrawalRequest collection for admin dashboard
    const withdrawalRequest = new WithdrawalRequest({
      productId: productId,
      productName: product.name,
      productPrice: salePrice,
      sellerName: user.name,
      sellerPhone: normalizedPhone,
      withdrawalAmount: withdrawalAmount,
      serviceFee: serviceFee,
      status: 'pending'
    })

    await withdrawalRequest.save()

    // Update product to mark withdrawal as requested
    await Product.findByIdAndUpdate(productId, {
      withdrawalRequested: true,
      withdrawalRequestedAt: new Date()
    })

    // TODO: Send SMS notification to user
    // TODO: Send notification to admin for processing
    // TODO: Integrate with M-Pesa API for automatic processing

    return NextResponse.json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      withdrawal: {
        id: withdrawal._id,
        productName: withdrawal.productName,
        withdrawalAmount: withdrawal.withdrawalAmount,
        phoneNumber: withdrawal.phoneNumber,
        status: withdrawal.status,
        requestedAt: withdrawal.requestedAt
      }
    })

  } catch (error) {
    console.error('Withdrawal request error:', error)
    return NextResponse.json({ 
      error: 'Failed to process withdrawal request' 
    }, { status: 500 })
  }
}

// GET endpoint to fetch user's withdrawal history
export async function GET(request) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request)
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = authResult.user
    await connectDB()

    // Fetch user's withdrawal requests
    const withdrawals = await Withdrawal.find({ userId: user.id })
      .populate('productId', 'name img')
      .sort({ createdAt: -1 })
      .limit(50)

    return NextResponse.json({
      success: true,
      withdrawals: withdrawals
    })

  } catch (error) {
    console.error('Fetch withdrawals error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch withdrawal history' 
    }, { status: 500 })
  }
}
