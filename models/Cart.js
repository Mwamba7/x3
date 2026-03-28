const mongoose = require('mongoose')

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  qty: {
    type: Number,
    required: true,
    min: 1
  },
  image: {
    type: String,
    required: true
  },
  condition: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  section: {
    type: String,
    required: true
  },
  sellerId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: 'available'
  }
}, { _id: false })

const cartSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  items: [cartItemSchema],
  
  // Cart locking fields for payment protection
  isLocked: {
    type: Boolean,
    default: false
  },
  lockedAt: {
    type: Date,
    default: null
  },
  unlockedAt: {
    type: Date,
    default: null
  },
  
  // Payment information
  paymentReference: {
    type: String,
    default: null
  },
  depositAmount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  balanceAmount: {
    type: Number,
    default: 0
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'carts'
})

// Indexes for performance
cartSchema.index({ userId: 1, isLocked: 1 })
cartSchema.index({ paymentReference: 1 })
cartSchema.index({ lockedAt: 1 })

// Virtual for items count
cartSchema.virtual('itemsCount').get(function() {
  return this.items ? this.items.length : 0
})

// Virtual for total quantity
cartSchema.virtual('totalQuantity').get(function() {
  if (!this.items) return 0
  return this.items.reduce((total, item) => total + (item.qty || 0), 0)
})

// Method to get cart total
cartSchema.methods.getCartTotal = function() {
  if (!this.items) return 0
  return this.items.reduce((total, item) => total + (item.price * item.qty), 0)
}

// Method to add/update item
cartSchema.methods.updateItem = function(productId, itemData) {
  const existingItemIndex = this.items.findIndex(item => item.productId === productId)
  
  if (existingItemIndex > -1) {
    // Update existing item
    this.items[existingItemIndex] = { ...this.items[existingItemIndex], ...itemData }
  } else {
    // Add new item
    this.items.push({ productId, ...itemData })
  }
  
  this.updatedAt = new Date()
  return this.save()
}

// Method to remove item
cartSchema.methods.removeItem = function(productId) {
  this.items = this.items.filter(item => item.productId !== productId)
  this.updatedAt = new Date()
  return this.save()
}

// Method to clear cart
cartSchema.methods.clearCart = function() {
  this.items = []
  this.updatedAt = new Date()
  return this.save()
}

// Method to lock cart
cartSchema.methods.lockCart = function(paymentData) {
  this.isLocked = true
  this.lockedAt = new Date()
  this.unlockedAt = null
  
  if (paymentData) {
    this.paymentReference = paymentData.reference || null
    this.depositAmount = paymentData.depositAmount || 0
    this.totalAmount = paymentData.totalAmount || 0
    this.balanceAmount = paymentData.balanceAmount || 0
  }
  
  this.updatedAt = new Date()
  return this.save()
}

// Method to unlock cart
cartSchema.methods.unlockCart = function() {
  this.isLocked = false
  this.lockedAt = null
  this.unlockedAt = new Date()
  this.paymentReference = null
  this.depositAmount = 0
  this.totalAmount = 0
  this.balanceAmount = 0
  
  this.updatedAt = new Date()
  return this.save()
}

// Static method to find or create cart
cartSchema.statics.findOrCreateCart = async function(userId) {
  let cart = await this.findOne({ userId })
  
  if (!cart) {
    cart = new this({ userId, items: [] })
    await cart.save()
  }
  
  return cart
}

module.exports = mongoose.models.Cart || mongoose.model('Cart', cartSchema)