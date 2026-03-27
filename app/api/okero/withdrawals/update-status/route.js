import { NextResponse } from 'next/server'
import connectDB from '../../../../../lib/mongodb'
import WithdrawalRequest from '../../../../../models/WithdrawalRequest'
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

// POST - Update withdrawal status
export async function POST(request) {
  try {
    const { withdrawalId, status, adminNotes } = await request.json()
    
    if (!withdrawalId || !status) {
      return NextResponse.json(
        { success: false, error: 'Withdrawal ID and status are required' },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ['pending', 'processing', 'completed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      )
    }

    await connectDB()
    
    // Find the withdrawal request first
    const withdrawalRequest = await WithdrawalRequest.findById(withdrawalId)
    if (!withdrawalRequest) {
      return NextResponse.json(
        { success: false, error: 'Withdrawal request not found' },
        { status: 404 }
      )
    }

    // Update data for both models
    const updateData = {
      status,
      updatedAt: new Date(),
      ...(adminNotes && { adminNotes })
    }

    // Add status-specific fields
    if (status === 'processing') {
      updateData.processedAt = new Date()
    } else if (status === 'completed') {
      updateData.completedAt = new Date()
    } else if (status === 'cancelled') {
      updateData.cancelledAt = new Date()
    }

    // Update WithdrawalRequest model (admin-facing)
    await WithdrawalRequest.findByIdAndUpdate(withdrawalId, updateData)
    console.log(`Updated WithdrawalRequest ${withdrawalId} to status: ${status}`)

    // Update Withdrawal model (user-facing) - find by productId
    const withdrawalUpdateResult = await Withdrawal.findOneAndUpdate(
      { productId: withdrawalRequest.productId },
      {
        status,
        ...(status === 'processing' && { processedAt: new Date() }),
        ...(status === 'completed' && { processedAt: new Date() }),
        ...(adminNotes && { notes: adminNotes })
      }
    )
    console.log(`Updated Withdrawal for productId ${withdrawalRequest.productId} to status: ${status}`, withdrawalUpdateResult ? 'Success' : 'Not Found')

    // Get updated withdrawal for response
    const updatedWithdrawal = await WithdrawalRequest.findById(withdrawalId)

    return NextResponse.json({ 
      success: true, 
      message: `Withdrawal status updated to ${status}`,
      withdrawal: {
        ...updatedWithdrawal.toObject(),
        _id: updatedWithdrawal._id.toString()
      }
    })
  } catch (error) {
    console.error('Error updating withdrawal status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update withdrawal status' },
      { status: 500 }
    )
  }
}
