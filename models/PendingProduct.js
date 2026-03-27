import mongoose from 'mongoose'

const PendingProductSchema = new mongoose.Schema({
  // Product details
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['tv', 'radio', 'phone', 'fridge', 'cooler', 'accessory', 'outfits', 'hoodies', 'shoes', 'sneakers', 'ladies', 'men', 'others']
  },
  price: {
    type: Number,
    min: 0
  },
  description: {
    type: String,
    trim: true
  },
  images: [{
    type: String // URLs to uploaded images
  }],
  coverImage: {
    type: String, // URL of the cover/main image
    default: null
  },
  
  // Seller details
  sellerName: {
    type: String,
    required: true,
    trim: true
  },
  sellerPhone: {
    type: String,
    required: true,
    trim: true
  },
  sellerEmail: {
    type: String,
    trim: true
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional - for users who aren't logged in
  },
  
  // Submission details
  submissionType: {
    type: String,
    enum: ['public', 'direct_to_admin'],
    default: 'public'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  
  // Admin actions
  reviewedBy: {
    type: String // Admin username who reviewed
  },
  reviewedAt: {
    type: Date
  },
  rejectionReason: {
    type: String
  },
  
  // Notifications
  adminNotified: {
    type: Boolean,
    default: false
  },
  sellerNotified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
})

// Index for efficient queries
PendingProductSchema.index({ status: 1, createdAt: -1 })
PendingProductSchema.index({ sellerPhone: 1 })

export default mongoose.models.PendingProduct || mongoose.model('PendingProduct', PendingProductSchema)
