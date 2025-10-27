import mongoose from 'mongoose'

const PaymentSchema = new mongoose.Schema({
  checkoutRequestId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  merchantRequestId: {
    type: String,
    required: true
  },
  cartId: {
    type: String,
    required: true,
    index: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  mpesaReceiptNumber: {
    type: String,
    sparse: true // Only for successful payments
  },
  resultCode: {
    type: Number,
    required: true
  },
  resultDesc: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed', 'cancelled'],
    default: 'pending'
  },
  transactionDate: {
    type: Date
  },
  callbackReceived: {
    type: Boolean,
    default: false
  },
  depositPaid: {
    type: Boolean,
    default: false
  },
  paymentType: {
    type: String,
    enum: ['deposit', 'full_payment'],
    default: 'deposit'
  }
}, {
  timestamps: true
})

// Indexes for efficient queries
PaymentSchema.index({ cartId: 1, status: 1 })
PaymentSchema.index({ phoneNumber: 1, createdAt: -1 })
PaymentSchema.index({ checkoutRequestId: 1, callbackReceived: 1 })

export default mongoose.models.Payment || mongoose.model('Payment', PaymentSchema)
