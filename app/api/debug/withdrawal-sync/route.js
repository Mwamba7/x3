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

// GET - Debug withdrawal synchronization
export async function GET() {
  try {
    await connectDB()
    
    // Get all withdrawal requests
    const withdrawalRequests = await WithdrawalRequest.find({}).sort({ createdAt: -1 }).limit(10)
    
    // Get all withdrawals
    const withdrawals = await Withdrawal.find({}).sort({ createdAt: -1 }).limit(10)
    
    // Check for mismatches
    const mismatches = []
    
    for (const wr of withdrawalRequests) {
      const matchingWithdrawal = await Withdrawal.findOne({ productId: wr.productId })
      
      if (matchingWithdrawal && matchingWithdrawal.status !== wr.status) {
        mismatches.push({
          productId: wr.productId,
          withdrawalRequestStatus: wr.status,
          withdrawalStatus: matchingWithdrawal.status,
          withdrawalRequestId: wr._id.toString(),
          withdrawalId: matchingWithdrawal._id.toString()
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      withdrawalRequests: withdrawalRequests.map(wr => ({
        id: wr._id.toString(),
        productId: wr.productId,
        productName: wr.productName,
        status: wr.status,
        sellerName: wr.sellerName
      })),
      withdrawals: withdrawals.map(w => ({
        id: w._id.toString(),
        productId: w.productId.toString(),
        productName: w.productName,
        status: w.status,
        userId: w.userId.toString()
      })),
      mismatches,
      totalWithdrawalRequests: withdrawalRequests.length,
      totalWithdrawals: withdrawals.length,
      totalMismatches: mismatches.length
    })
  } catch (error) {
    console.error('Debug withdrawal sync error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to debug withdrawal sync' },
      { status: 500 }
    )
  }
}

// POST - Force sync all withdrawals
export async function POST() {
  try {
    await connectDB()
    
    const withdrawalRequests = await WithdrawalRequest.find({})
    let syncedCount = 0
    
    for (const wr of withdrawalRequests) {
      const result = await Withdrawal.findOneAndUpdate(
        { productId: wr.productId },
        {
          status: wr.status,
          ...(wr.status === 'processing' && { processedAt: new Date() }),
          ...(wr.status === 'completed' && { processedAt: new Date() }),
          ...(wr.adminNotes && { notes: wr.adminNotes })
        }
      )
      
      if (result) {
        syncedCount++
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Synced ${syncedCount} withdrawal records`,
      syncedCount,
      totalRequests: withdrawalRequests.length
    })
  } catch (error) {
    console.error('Force sync error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to force sync withdrawals' },
      { status: 500 }
    )
  }
}
