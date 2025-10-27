import mongoose from 'mongoose'

const WithdrawalRequestSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
    unique: true
  },
  productName: {
    type: String,
    required: true
  },
  productPrice: {
    type: Number,
    required: true
  },
  sellerName: {
    type: String,
    required: true
  },
  sellerPhone: {
    type: String,
    required: true
  },
  withdrawalAmount: {
    type: Number,
    required: true
  },
  serviceFee: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'cancelled'],
    default: 'pending'
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  processedDate: {
    type: Date
  },
  adminNotes: {
    type: String
  },
  transactionId: {
    type: String
  }
}, {
  timestamps: true
})

export default mongoose.models.WithdrawalRequest || mongoose.model('WithdrawalRequest', WithdrawalRequestSchema)
