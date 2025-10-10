# M-Pesa Integration Setup Guide

## 🚨 Issues Found and Fixed

Your M-Pesa integration had several critical issues that have been resolved:

1. **Security Risk**: Hardcoded credentials in source code ✅ **FIXED**
2. **Missing Environment Configuration**: No proper env setup ✅ **FIXED**
3. **Wrong API URLs**: Using production URLs with test credentials ✅ **FIXED**
4. **Missing Validation**: No proper error handling ✅ **FIXED**
5. **Callback URL Issues**: Hardcoded fallback URL ✅ **FIXED**

## 📋 Setup Instructions

### Step 1: Get M-Pesa API Credentials

1. **For Testing (Sandbox)**:
   - Go to [Safaricom Developer Portal](https://developer.safaricom.co.ke/)
   - Create an account and login
   - Create a new app and select "Lipa Na M-Pesa Online"
   - Get your Consumer Key and Consumer Secret
   - Use the test shortcode: `174379`
   - Use the test passkey: `bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919`

2. **For Production (Live)**:
   - Complete the Go-Live process on Safaricom Developer Portal
   - Get your production Consumer Key and Consumer Secret
   - Get your production Business Shortcode and Passkey

### Step 2: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update your `.env` file with your credentials:

   **For Testing/Sandbox:**
   ```env
   NEXT_PUBLIC_BASE_URL="http://localhost:3000"
   MPESA_CONSUMER_KEY="your_sandbox_consumer_key_here"
   MPESA_CONSUMER_SECRET="your_sandbox_consumer_secret_here"
   MPESA_BUSINESS_SHORT_CODE="174379"
   MPESA_PASSKEY="bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919"
   MPESA_ENVIRONMENT="sandbox"
   ```

   **For Production:**
   ```env
   NEXT_PUBLIC_BASE_URL="https://yourdomain.com"
   MPESA_CONSUMER_KEY="your_production_consumer_key_here"
   MPESA_CONSUMER_SECRET="your_production_consumer_secret_here"
   MPESA_BUSINESS_SHORT_CODE="your_production_shortcode"
   MPESA_PASSKEY="your_production_passkey"
   MPESA_ENVIRONMENT="production"
   ```

### Step 3: Test the Integration

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Test the M-Pesa callback endpoint:**
   ```bash
   curl http://localhost:3000/api/mpesa/callback
   ```
   Should return: `{"message":"M-Pesa callback endpoint is active","timestamp":"..."}`

3. **Test a payment (use sandbox credentials):**
   - Go to your cart page
   - Add items to cart
   - Fill in fulfillment details
   - Enter a test phone number (use format: 254700000000)
   - Click "Pay Deposit"

### Step 4: Production Deployment

1. **Update environment variables** on your hosting platform (Netlify, Vercel, etc.)
2. **Set MPESA_ENVIRONMENT to "production"**
3. **Use your production credentials**
4. **Update NEXT_PUBLIC_BASE_URL** to your live domain

## 🔧 Testing Phone Numbers

For sandbox testing, use these test numbers:
- `254708374149`
- `254700000000`
- `254711000000`

## 📱 M-Pesa Flow

1. **User initiates payment** → STK Push sent to phone
2. **User enters M-Pesa PIN** → Payment processed
3. **Safaricom sends callback** → Your app receives confirmation
4. **Payment status updated** → User can proceed with order

## 🚨 Common Issues & Solutions

### Issue: "M-Pesa configuration incomplete"
**Solution**: Make sure `NEXT_PUBLIC_BASE_URL` is set in your `.env` file

### Issue: "Invalid credentials"
**Solution**: Double-check your Consumer Key and Secret from Safaricom Developer Portal

### Issue: "Invalid phone number format"
**Solution**: Use Kenyan phone numbers in format `254XXXXXXXXX` (12 digits total)

### Issue: Callback not working
**Solution**: 
- Ensure your app is publicly accessible (use ngrok for local testing)
- Check that callback URL is correctly set
- Verify your server can receive POST requests

## 🔒 Security Best Practices

✅ **DO:**
- Keep credentials in environment variables
- Use HTTPS in production
- Validate all inputs
- Log transactions for audit

❌ **DON'T:**
- Hardcode credentials in source code
- Commit `.env` files to version control
- Skip input validation
- Ignore callback security

## 📞 Support

If you encounter issues:
1. Check the browser console for errors
2. Check your server logs
3. Verify your credentials on Safaricom Developer Portal
4. Test with sandbox credentials first

## 🎯 Next Steps

1. **Set up your credentials** following Step 2
2. **Test with sandbox** to ensure everything works
3. **Go live** when ready for production
4. **Monitor transactions** and handle edge cases

Your M-Pesa integration is now properly configured and secure! 🎉
