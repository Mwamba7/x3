import { NextResponse } from 'next/server'
import connectDB from '../../../../lib/mongodb'
import WithdrawalRequest from '../../../../models/WithdrawalRequest'
import mongoose from 'mongoose'

// Import Withdrawal model
const withdrawalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  salePrice: { type: Number, required: true },
  serviceFee: { type: Number, required: true },
  withdrawalAmount: { type: Number, required: true },
  paymentMethod: { type: String, required: true, default: 'mpesa' },
  phoneNumber: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  requestedAt: { type: Date, default: Date.now },
  processedAt: { type: Date },
  transactionId: { type: String },
  notes: { type: String }
}, {
  timestamps: true
})

const Withdrawal = mongoose.models.Withdrawal || mongoose.model('Withdrawal', withdrawalSchema)

// GET - Get withdrawal status for a specific sale
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const saleId = searchParams.get('saleId')
    const userId = searchParams.get('userId')
    
    if (!saleId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Sale ID and User ID are required' },
        { status: 400 }
      )
    }

    await connectDB()
    
    console.log(`Looking for withdrawal: saleId=${saleId}, userId=${userId}`)
    
    // First check the Withdrawal model (user-facing)
    const withdrawal = await Withdrawal.findOne({
      productId: saleId,
      userId: userId
    })
    
    console.log(`Withdrawal found in Withdrawal model:`, withdrawal ? `Status: ${withdrawal.status}` : 'Not found')
    
    if (withdrawal) {
      return NextResponse.json({ 
        success: true, 
        status: withdrawal.status || 'pending',
        withdrawal: {
          id: withdrawal._id.toString(),
          status: withdrawal.status,
          productName: withdrawal.productName,
          withdrawalAmount: withdrawal.withdrawalAmount,
          requestedAt: withdrawal.requestedAt,
          processedAt: withdrawal.processedAt
        }
      })
    }

    // Fallback to WithdrawalRequest model (admin-facing)
    const withdrawalRequest = await WithdrawalRequest.findOne({
      productId: saleId
    })
    
    console.log(`WithdrawalRequest found:`, withdrawalRequest ? `Status: ${withdrawalRequest.status}` : 'Not found')
    
    if (!withdrawalRequest) {
      return NextResponse.json({ 
        success: true, 
        status: 'not_requested',
        message: 'No withdrawal request found'
      })
    }

    return NextResponse.json({ 
      success: true, 
      status: withdrawalRequest.status || 'pending',
      withdrawal: {
        id: withdrawalRequest._id.toString(),
        status: withdrawalRequest.status,
        productName: withdrawalRequest.productName,
        withdrawalAmount: withdrawalRequest.withdrawalAmount,
        requestedAt: withdrawalRequest.requestDate
      }
    })
  } catch (error) {
    console.error('Error fetching withdrawal status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch withdrawal status' },
      { status: 500 }
    )
  }
}
