# M-Pesa Integration Setup Guide

## 🚀 Complete M-Pesa Integration

This guide covers the complete M-Pesa Daraja API integration for real payment processing.

## 📋 Prerequisites

1. **M-Pesa Developer Account**: Register at [developer.safaricom.co.ke](https://developer.safaricom.co.ke)
2. **Ngrok or Public URL**: For callback handling (provided: `https://kimberley-dextrocardial-coolly.ngrok-free.dev`)
3. **Environment Variables**: Configured in `.env` file

## 🔧 Environment Configuration

Create a `.env` file with the following configuration:

```bash
# Base URL for your application (REQUIRED for callbacks)
NEXT_PUBLIC_BASE_URL=https://kimberley-dextrocardial-coolly.ngrok-free.dev

# M-Pesa Daraja API Configuration
MPESA_CONSUMER_KEY=VhJ3SaroNiEiFQTTimt7HDn3dDlWTmJjxKfAB4wqwZIZpLte
MPESA_CONSUMER_SECRET=nI0Eg3zEfyiw0lY3JhPJu5ATwgK979wMtTqZVX8mFo06k1y7ujCQpwK4z0mGpkUM
MPESA_BUSINESS_SHORT_CODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
MPESA_ENVIRONMENT=sandbox

# Session Secret
SESSION_SECRET=change_this_to_a_long_random_secret

# MongoDB (existing)
MONGODB_URI=your_mongodb_connection_string
```

## 🏗️ API Endpoints Created

### 1. Authentication (`/api/mpesa/auth`)
- **Purpose**: Get M-Pesa access token
- **Method**: GET/POST
- **Response**: Access token for API calls

### 2. STK Push (`/api/mpesa/stk-push`)
- **Purpose**: Initiate payment request
- **Method**: POST
- **Body**: `{ phone, amount, reference }`
- **Response**: CheckoutRequestID for tracking

### 3. Callback Handler (`/api/mpesa/callback`)
- **Purpose**: Receive M-Pesa payment notifications
- **Method**: POST
- **URL**: `{NEXT_PUBLIC_BASE_URL}/api/mpesa/callback`
- **Automatic**: Handles payment confirmations

### 4. Status Check (`/api/mpesa/status`)
- **Purpose**: Check payment status
- **Method**: POST
- **Body**: `{ checkoutRequestId }`
- **Response**: Payment status (pending/completed/failed)

## 💳 Payment Flow

### Customer Experience:
1. **Add Items to Cart** → Normal shopping experience
2. **Go to Checkout** → Fill delivery details
3. **Enter Phone Number** → Kenyan format (0712345678)
4. **Click "Pay Now"** → STK Push sent to phone
5. **Enter M-Pesa PIN** → Complete payment on phone
6. **Automatic Verification** → System polls for confirmation
7. **Cart Locks** → Proceed to WhatsApp order

### Technical Flow:
```
Customer → STK Push → M-Pesa → Callback → Status Check → Cart Lock
```

## 🔍 Testing the Integration

### 1. Test Authentication
```bash
curl -X GET https://kimberley-dextrocardial-coolly.ngrok-free.dev/api/mpesa/auth
```

### 2. Test STK Push
```bash
curl -X POST https://kimberley-dextrocardial-coolly.ngrok-free.dev/api/mpesa/stk-push \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "254712345678",
    "amount": 1000,
    "reference": "TEST123"
  }'
```

### 3. Test Status Check
```bash
curl -X POST https://kimberley-dextrocardial-coolly.ngrok-free.dev/api/mpesa/status \
  -H "Content-Type: application/json" \
  -d '{
    "checkoutRequestId": "ws_CO_191220191020363925"
  }'
```

## 📱 Sandbox Testing

### Test Phone Numbers:
- **Format**: 254XXXXXXXXX (Kenyan format)
- **Sandbox**: Use any valid Kenyan number format
- **PIN**: Use any 4-digit PIN in sandbox

### Test Amounts:
- **Minimum**: Ksh 1
- **Maximum**: Ksh 70,000 (sandbox limit)
- **Deposit**: 20% of total cart amount

## 🛠️ Component Integration

### SimplePayment Component Features:
- ✅ **Real-time Status**: Live payment polling
- ✅ **Countdown Timer**: 5-minute payment window
- ✅ **Retry Logic**: Cancel and retry failed payments
- ✅ **Phone Validation**: Kenyan number format validation
- ✅ **Visual Feedback**: Status indicators and messages
- ✅ **Cart Locking**: Automatic cart lock on success

### Payment States:
- **idle**: Ready to pay
- **processing**: Sending STK Push
- **pending**: Waiting for customer
- **completed**: Payment successful
- **failed**: Payment failed/cancelled

## 🚨 Troubleshooting

### Common Issues:

1. **"M-Pesa service not configured"**
   - Check environment variables are set
   - Verify `.env` file exists and is loaded

2. **"Invalid phone number format"**
   - Use format: 0712345678 or 254712345678
   - Remove spaces and special characters

3. **"Payment timeout"**
   - Customer has 5 minutes to complete payment
   - Use retry button to start new payment

4. **"Callback not received"**
   - Verify NEXT_PUBLIC_BASE_URL is accessible
   - Check ngrok tunnel is active
   - Ensure callback URL is whitelisted

### Debug Endpoints:

- **Auth Status**: `/api/mpesa/auth`
- **Callback Status**: `/api/mpesa/callback` (GET)
- **Status Check**: `/api/mpesa/status` (GET)

## 📊 Monitoring

### Console Logs:
- 🔐 Authentication requests
- 📱 STK Push requests
- 📞 Callback receipts
- 🔍 Status checks
- ✅/❌ Payment results

### Key Metrics:
- Payment success rate
- Average completion time
- Failed payment reasons
- Callback response times

## 🔒 Security Notes

1. **Environment Variables**: Never commit `.env` to version control
2. **HTTPS Required**: M-Pesa requires HTTPS for callbacks
3. **IP Whitelisting**: Configure in M-Pesa portal
4. **Callback Validation**: Verify callback authenticity
5. **Phone Validation**: Sanitize phone number inputs

## 🚀 Production Deployment

### Before Going Live:
1. **Switch to Production**:
   ```bash
   MPESA_ENVIRONMENT=production
   ```
2. **Update Credentials**: Use production consumer key/secret
3. **Configure Callbacks**: Set production callback URLs
4. **Test Thoroughly**: Test with real phone numbers
5. **Monitor Logs**: Set up proper logging and monitoring

### Production Checklist:
- [ ] Production M-Pesa credentials
- [ ] HTTPS callback URL configured
- [ ] Error monitoring setup
- [ ] Database backup strategy
- [ ] Payment reconciliation process
- [ ] Customer support procedures

## 📞 Support

For M-Pesa integration issues:
1. Check Safaricom Developer Portal
2. Review API documentation
3. Test with sandbox first
4. Monitor callback responses
5. Contact Safaricom support if needed

---

## 🎉 Integration Complete!

Your M-Pesa integration is now fully functional with:
- ✅ Real STK Push payments
- ✅ Automatic status verification
- ✅ Callback handling
- ✅ Error handling and retry logic
- ✅ Cart locking on payment success
- ✅ Professional user experience

Test the payment flow and monitor the console logs to ensure everything works correctly!
