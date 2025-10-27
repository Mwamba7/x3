import mongoose from 'mongoose'

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  img: {
    type: String,
    required: true,
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Make optional for existing products
  },
  imagesJson: {
    type: String,
    default: null,
  },
  meta: {
    type: String,
    default: '',
  },
  condition: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    default: 'available',
  },
  description: {
    type: String,
    default: '',
  },
  images: [{
    type: String // Array of image URLs/base64
  }],
  inStock: {
    type: Boolean,
    default: true,
  },
  featured: {
    type: Boolean,
    default: false,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  saleInfo: {
    soldAt: Date,
    salePrice: Number,
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    withdrawalRequested: {
      type: Boolean,
      default: false,
    },
    withdrawalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Withdrawal',
    },
  },
}, {
  timestamps: true, // This adds createdAt and updatedAt fields
})

// Create indexes for better query performance
ProductSchema.index({ category: 1 })
ProductSchema.index({ status: 1 })
ProductSchema.index({ createdAt: -1 })

export default mongoose.models.Product || mongoose.model('Product', ProductSchema)
