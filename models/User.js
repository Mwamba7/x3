import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: [8, 'Password must be at least 8 characters long']
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: [/^(\+254|254|0)[17]\d{8}$/, 'Please enter a valid Kenyan phone number']
  },
  role: {
    type: String,
    default: 'user',
    enum: ['user', 'admin']
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  isPhoneVerified: {
    type: Boolean,
    default: false,
  },
  lastLogin: {
    type: Date,
    default: null,
  },
  loginAttempts: {
    type: Number,
    default: 0,
  },
  lockUntil: {
    type: Date,
  },
  passwordResetToken: {
    type: String,
  },
  passwordResetExpires: {
    type: Date,
  },
  emailVerificationToken: {
    type: String,
  },
  emailVerificationExpires: {
    type: Date,
  },
  profile: {
    profilePicture: String, // Base64 or URL
    address: String,
    city: String,
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say']
    },
    preferences: {
      notifications: {
        type: Boolean,
        default: true,
      },
      marketing: {
        type: Boolean,
        default: false,
      },
      language: {
        type: String,
        default: 'en'
      },
      currency: {
        type: String,
        default: 'KES'
      }
    }
  },
  deliveryAddress: {
    fullName: String,
    phone: String,
    street: String,
    city: String,
    region: String,
    additionalInstructions: String,
    isDefault: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true,
})

// Virtual for account lock status
UserSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now())
})

// Index for performance
UserSchema.index({ email: 1 })
UserSchema.index({ phone: 1 })
UserSchema.index({ createdAt: -1 })

export default mongoose.models.User || mongoose.model('User', UserSchema)
