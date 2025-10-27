# 🔐 User Authentication System Guide

## Overview
Complete user authentication system with account management, order tracking, and product management for Think Twice Resellers.

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
# Run the installation script
install-auth-deps.bat

# Or manually install
npm install bcryptjs jsonwebtoken
```

### 2. Environment Variables
Ensure your `.env` file includes:
```bash
# Session secret for JWT tokens
SESSION_SECRET="your-long-random-secret-here"

# MongoDB connection (already configured)
MONGODB_URI="mongodb+srv://..."
```

### 3. Start the Application
```bash
npm run dev
```

## 🔑 Authentication Features

### **User Registration & Login**
- **Registration**: `/register` - Create new user accounts
- **Login**: `/login` - Authenticate existing users
- **Logout**: Automatic logout with secure cookie clearing
- **Password Security**: Bcrypt hashing with salt rounds

### **Account Management**
- **Account Page**: `/account` - Centralized user dashboard
- **My Orders**: View all user orders with status tracking
- **My Products**: Manage products listed for sale
- **Profile Management**: Update user information

### **Navigation Integration**
- **Dynamic Navigation**: Shows "Account" when logged in, "Login" when not
- **Authentication Status**: Real-time authentication state management
- **Protected Routes**: Automatic redirect to login for unauthorized access

## 📱 User Experience Flow

### **New User Journey**
1. **Visit Site** → See "Login" in navigation
2. **Click Login** → Option to "Sign up here"
3. **Register** → Fill name, email, password, phone (optional)
4. **Auto Login** → Redirected to Account page
5. **Account Dashboard** → Access to orders and products

### **Returning User Journey**
1. **Visit Site** → See "Account" in navigation (if logged in)
2. **Click Login** → Enter credentials
3. **Dashboard Access** → View orders and manage products
4. **Shopping** → All purchases associated with account

### **Shopping Flow**
1. **Browse Products** → Add items to cart
2. **Checkout** → Must be logged in to proceed
3. **Payment** → M-Pesa integration with user association
4. **Order Tracking** → Orders appear in "My Orders"

## 🛡️ Security Features

### **Authentication Security**
- **JWT Tokens**: Secure session management
- **HTTP-Only Cookies**: Prevent XSS attacks
- **Password Hashing**: Bcrypt with salt rounds
- **Token Expiration**: 7-day automatic expiry
- **Account Status**: Active/inactive user management

### **Route Protection**
- **Checkout Protection**: Login required for purchases
- **Account Routes**: Authentication middleware
- **Admin Routes**: Role-based access control
- **API Security**: Token verification on protected endpoints

### **Data Privacy**
- **Password Exclusion**: Never return passwords in API responses
- **User Data Isolation**: Users only see their own data
- **Secure Cookies**: Production-ready cookie settings

## 📊 Database Schema

### **User Model**
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  phone: String (optional),
  role: String (user/admin),
  isActive: Boolean (default: true),
  lastLogin: Date,
  profile: {
    address: String,
    city: String,
    preferences: {
      notifications: Boolean,
      marketing: Boolean
    }
  },
  createdAt: Date,
  updatedAt: Date
}
```

### **Enhanced Order Model**
```javascript
{
  orderId: String (unique),
  userId: ObjectId (ref: User), // NEW: User association
  customer: { name, phone, email, address },
  items: [{ productId, name, price, quantity }],
  totalAmount: Number,
  payment: { depositPaid, remainingPaid },
  status: String (received/processing/in_transit/delivered),
  createdAt: Date
}
```

### **Enhanced Product Model**
```javascript
{
  name: String,
  category: String,
  price: Number,
  sellerId: ObjectId (ref: User), // NEW: Seller association
  img: String,
  condition: String,
  status: String (active/inactive),
  createdAt: Date
}
```

## 🔌 API Endpoints

### **Authentication APIs**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info

### **User Data APIs**
- `GET /api/user/orders` - Get user's orders
- `GET /api/user/products` - Get user's products
- `PUT /api/auth/profile` - Update user profile

### **Protected APIs**
- `POST /api/orders/complete` - Create order (requires auth)
- All admin APIs require admin role

## 🎨 UI Components

### **AuthContext**
```javascript
// Global authentication state management
const { user, isAuthenticated, login, logout, register } = useAuth()
```

### **Navigation**
- Dynamic links based on authentication status
- "Account" for logged-in users
- "Login" for anonymous users

### **Account Page**
- **My Orders Tab**: Order history with status tracking
- **My Products Tab**: Product management interface
- **User Profile**: Account information display

### **Login/Register Pages**
- Clean, professional design
- Form validation and error handling
- Responsive layout for all devices

## 🔧 Development Notes

### **Authentication Flow**
1. **Registration/Login** → JWT token created
2. **Token Storage** → HTTP-only cookie
3. **Request Authentication** → Cookie sent automatically
4. **Server Verification** → JWT decoded and user verified
5. **Protected Access** → User data accessible

### **Error Handling**
- **Invalid Credentials**: Clear error messages
- **Expired Tokens**: Automatic logout and redirect
- **Network Errors**: User-friendly error display
- **Validation Errors**: Field-specific feedback

### **Performance Considerations**
- **Token Caching**: Efficient authentication checks
- **Database Queries**: Optimized user lookups
- **Password Hashing**: Balanced security vs. performance
- **Session Management**: Automatic cleanup

## 🚀 Production Deployment

### **Environment Setup**
```bash
# Production environment variables
SESSION_SECRET="long-random-production-secret"
MONGODB_URI="production-mongodb-connection"
NODE_ENV="production"
```

### **Security Checklist**
- ✅ Strong session secret (32+ characters)
- ✅ HTTPS enabled for secure cookies
- ✅ Database connection secured
- ✅ Password complexity requirements
- ✅ Rate limiting on auth endpoints
- ✅ Regular security updates

### **Monitoring**
- User registration/login metrics
- Authentication failure tracking
- Session duration analytics
- Account activity monitoring

## 📞 Support

### **Common Issues**
1. **Login Issues**: Check credentials and account status
2. **Registration Errors**: Verify email uniqueness
3. **Session Expiry**: Re-login required after 7 days
4. **Checkout Access**: Login required for purchases

### **Troubleshooting**
- Check browser cookies enabled
- Verify network connectivity
- Clear browser cache if needed
- Contact support for account issues

---

## 🎯 Key Benefits

✅ **Secure Authentication**: Industry-standard security practices
✅ **User Experience**: Seamless login/registration flow
✅ **Order Tracking**: Complete purchase history
✅ **Product Management**: Seller account functionality
✅ **Admin Control**: Role-based access management
✅ **Mobile Friendly**: Responsive design for all devices
✅ **Production Ready**: Scalable and secure architecture

The authentication system provides a complete foundation for user management, order tracking, and secure e-commerce operations!
