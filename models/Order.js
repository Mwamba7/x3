import mongoose from 'mongoose'

const OrderSchema = new mongoose.Schema({
  // Order identification
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  
  // User association
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Customer information
  customer: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    address: {
      street: String,
      city: String,
      area: String,
      instructions: String
    }
  },
  
  // Order items
  items: [{
    productId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    condition: String,
    img: String,
    lineTotal: { type: Number, required: true }
  }],
  
  // Order totals
  subtotal: { type: Number, required: true },
  deliveryFee: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  
  // Payment information
  payment: {
    depositAmount: { type: Number, required: true },
    depositPaid: { type: Boolean, default: true },
    remainingAmount: { type: Number, required: true },
    remainingPaid: { type: Boolean, default: false },
    remainingTransactionId: String,
    remainingPaidAt: Date,
    paymentMethod: { type: String, default: 'M-Pesa + Cash on Delivery' },
    transactionId: String
  },
  
  // Order status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'in_transit', 'receiving', 'delivered', 'shipped', 'completed', 'cancelled'],
    default: 'processing'
  },
  
  // Delivery information
  delivery: {
    method: { type: String, default: 'delivery' },
    estimatedDate: Date,
    actualDate: Date,
    trackingNumber: String
  },
  
  // Order tracking
  orderDate: { type: Date, default: Date.now },
  whatsappSentAt: { type: Date, default: Date.now },
  completedAt: Date,
  
  // Additional metadata
  notes: String,
  adminNotes: String,
  
  // Source tracking
  source: { type: String, default: 'website' }
}, {
  timestamps: true
})

// Generate unique order ID before validation
OrderSchema.pre('validate', function(next) {
  if (!this.orderId) {
    const now = new Date()
    const date = now.getFullYear().toString().slice(-2) + 
                 (now.getMonth() + 1).toString().padStart(2, '0') + 
                 now.getDate().toString().padStart(2, '0')
    const time = now.getHours().toString().padStart(2, '0') + 
                 now.getMinutes().toString().padStart(2, '0')
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    this.orderId = `ORD-${date}${time}-${random}`
  }
  next()
})

// Also ensure it's generated before save as backup
OrderSchema.pre('save', function(next) {
  if (!this.orderId) {
    const now = new Date()
    const date = now.getFullYear().toString().slice(-2) + 
                 (now.getMonth() + 1).toString().padStart(2, '0') + 
                 now.getDate().toString().padStart(2, '0')
    const time = now.getHours().toString().padStart(2, '0') + 
                 now.getMinutes().toString().padStart(2, '0')
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    this.orderId = `ORD-${date}${time}-${random}`
  }
  next()
})

// Indexes for better query performance (orderId already has unique index)
OrderSchema.index({ 'customer.phone': 1 })
OrderSchema.index({ 'customer.email': 1 })
OrderSchema.index({ orderDate: -1 })
OrderSchema.index({ status: 1 })

export default mongoose.models.Order || mongoose.model('Order', OrderSchema)
