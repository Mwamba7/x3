import mongoose from 'mongoose'

const WithdrawalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  salePrice: {
    type: Number,
    required: true,
  },
  withdrawalAmount: {
    type: Number,
    required: true,
  },
  platformFee: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'cancelled'],
    default: 'pending',
  },
  requestedAt: {
    type: Date,
    default: Date.now,
  },
  processedAt: {
    type: Date,
  },
  completedAt: {
    type: Date,
  },
  paymentMethod: {
    type: String,
    enum: ['mpesa', 'bank_transfer', 'cash'],
    default: 'mpesa',
  },
  paymentDetails: {
    phoneNumber: String,
    accountNumber: String,
    bankName: String,
    accountName: String,
  },
  adminNotes: {
    type: String,
    default: '',
  },
  sellerNotes: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
})

// Create indexes for better query performance
WithdrawalSchema.index({ userId: 1 })
WithdrawalSchema.index({ status: 1 })
WithdrawalSchema.index({ createdAt: -1 })

export default mongoose.models.Withdrawal || mongoose.model('Withdrawal', WithdrawalSchema)
