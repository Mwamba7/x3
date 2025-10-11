# Frontend Cart Page Fix Guide

## 🚨 Issue
The `app/cart/page.jsx` file got corrupted during our M-Pesa integration updates. Here's how to fix it.

## 🛠️ Quick Fix Steps

### 1. Backup Current State
```bash
# Already done - we have page-backup.jsx
```

### 2. Key Changes Needed

Update the M-Pesa payment state in your cart component:

```javascript
const [mpesaPayment, setMpesaPayment] = useState({
  phoneNumber: '',
  isProcessing: false,
  paymentStatus: null, // null, 'processing', 'success', 'failed', 'system_busy', 'rate_limited', 'timeout', 'network_error'
  checkoutRequestId: null,
  merchantRequestId: null,
  depositPaid: false,
  errorMessage: null,
  transactionId: null,
  retryAfter: null
})
```

### 3. Enhanced Payment Handler

```javascript
const handleMpesaPayment = async () => {
  if (!mpesaPayment.phoneNumber.trim()) {
    setMpesaPayment(prev => ({
      ...prev,
      paymentStatus: 'failed',
      errorMessage: 'Please enter your M-Pesa phone number'
    }))
    return
  }

  const { depositAmount } = calculatePaymentAmounts()
  
  setMpesaPayment(prev => ({
    ...prev,
    isProcessing: true,
    paymentStatus: 'processing',
    errorMessage: null,
    retryAfter: null
  }))

  try {
    const response = await fetch('/api/mpesa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: mpesaPayment.phoneNumber,
        amount: depositAmount,
        accountReference: `ORDER-${Date.now()}`,
        transactionDesc: `20% Deposit - Order Total: Ksh ${calculatePaymentAmounts().finalTotal}`
      })
    })

    const data = await response.json()

    if (response.ok && data.success) {
      setMpesaPayment(prev => ({
        ...prev,
        checkoutRequestId: data.checkoutRequestId,
        merchantRequestId: data.merchantRequestId,
        transactionId: data.transactionId,
        paymentStatus: 'processing',
        errorMessage: null
      }))
      
      // Start polling for payment status
      setTimeout(() => pollPaymentStatus(data.checkoutRequestId), 3000)
    } else {
      handlePaymentError(data, response.status)
    }
  } catch (error) {
    setMpesaPayment(prev => ({
      ...prev,
      isProcessing: false,
      paymentStatus: 'failed',
      errorMessage: 'Network error. Please check your connection and try again.',
      depositPaid: false
    }))
  }
}
```

### 4. Error Handler

```javascript
const handlePaymentError = (data, status) => {
  let paymentStatus = 'failed'
  let errorMessage = data.message || 'Payment request failed. Please try again.'
  let retryAfter = null

  if (status === 429 || data.error === 'RATE_LIMITED') {
    paymentStatus = 'rate_limited'
    retryAfter = data.retryAfter || 60
    errorMessage = `Too many requests. Please wait ${retryAfter} seconds before trying again.`
  } else if (data.error === 'SYSTEM_BUSY') {
    paymentStatus = 'system_busy'
    retryAfter = data.retryAfter || 120
    errorMessage = 'M-Pesa system is currently busy. Please try again in 2-3 minutes.'
  } else if (data.error === 'NETWORK_ERROR' || data.error === 'TIMEOUT_ERROR') {
    paymentStatus = 'network_error'
    errorMessage = data.message
  } else if (data.error === 'VALIDATION_ERROR') {
    paymentStatus = 'validation_error'
    errorMessage = `${data.message}${data.field ? ` (${data.field})` : ''}`
  }

  setMpesaPayment(prev => ({
    ...prev,
    isProcessing: false,
    paymentStatus: paymentStatus,
    errorMessage: errorMessage,
    retryAfter: retryAfter,
    depositPaid: false
  }))
}
```

### 5. Enhanced Polling

```javascript
const pollPaymentStatus = async (checkoutRequestId) => {
  let attempts = 0
  const maxAttempts = 36 // 3 minutes

  const poll = async () => {
    try {
      // First check callback results
      const callbackResponse = await fetch(`/api/mpesa/callback?checkoutRequestId=${checkoutRequestId}`)
      const callbackData = await callbackResponse.json()

      if (callbackData.success && callbackData.found && callbackData.data) {
        const result = callbackData.data
        
        if (result.status === 'success' && result.ResultCode === 0) {
          setMpesaPayment(prev => ({
            ...prev,
            isProcessing: false,
            paymentStatus: 'success',
            depositPaid: true,
            errorMessage: null
          }))
          return
        } else if (result.status === 'failed') {
          setMpesaPayment(prev => ({
            ...prev,
            isProcessing: false,
            paymentStatus: 'failed',
            errorMessage: result.ResultDesc || 'Payment was not completed successfully.',
            depositPaid: false
          }))
          return
        }
      }

      // If no callback, query directly
      const response = await fetch(`/api/mpesa?checkoutRequestId=${checkoutRequestId}`)
      const data = await response.json()

      if (data.success && data.data && data.data.ResultCode === 0) {
        setMpesaPayment(prev => ({
          ...prev,
          isProcessing: false,
          paymentStatus: 'success',
          depositPaid: true,
          errorMessage: null
        }))
        return
      }

      // Continue polling
      attempts++
      if (attempts < maxAttempts) {
        setTimeout(poll, 5000)
      } else {
        setMpesaPayment(prev => ({
          ...prev,
          isProcessing: false,
          paymentStatus: 'timeout',
          errorMessage: 'Payment verification timed out. Use "Check Payment Status" to verify manually.'
        }))
      }
    } catch (error) {
      attempts++
      if (attempts < maxAttempts) {
        setTimeout(poll, 5000)
      }
    }
  }

  setTimeout(poll, 3000)
}
```

### 6. UI Updates for New Error States

Add these UI components for the new error states:

```jsx
{/* Rate Limited */}
{mpesaPayment.paymentStatus === 'rate_limited' && (
  <div style={{ color: '#ffc107', fontSize: 12, marginTop: 8 }}>
    <p>{mpesaPayment.errorMessage}</p>
    <button onClick={() => setMpesaPayment(prev => ({ ...prev, paymentStatus: null }))}>
      ⏱️ Try Again After {mpesaPayment.retryAfter}s
    </button>
  </div>
)}

{/* System Busy */}
{mpesaPayment.paymentStatus === 'system_busy' && (
  <div style={{ color: '#17a2b8', fontSize: 12, marginTop: 8 }}>
    <p>{mpesaPayment.errorMessage}</p>
    <button onClick={() => setMpesaPayment(prev => ({ ...prev, paymentStatus: null }))}>
      🔄 Try Again in 2 Minutes
    </button>
  </div>
)}

{/* Network Error */}
{mpesaPayment.paymentStatus === 'network_error' && (
  <div style={{ color: '#dc3545', fontSize: 12, marginTop: 8 }}>
    <p>{mpesaPayment.errorMessage}</p>
    <button onClick={() => setMpesaPayment(prev => ({ ...prev, paymentStatus: null }))}>
      🔄 Retry
    </button>
  </div>
)}

{/* Manual Check Button */}
{mpesaPayment.paymentStatus === 'timeout' && (
  <button onClick={checkPaymentStatus} style={{ marginTop: 8 }}>
    🔍 Check Payment Status
  </button>
)}
```

## 🎯 Alternative: Use Working Template

If rebuilding is complex, you can:

1. Start with a clean cart page template
2. Copy the working M-Pesa section from `page-new.jsx` (if it exists)
3. Integrate the new payment handlers above

## ✅ Verification

After fixing:
1. Test STK Push initiation
2. Test error handling (try invalid phone)
3. Test rate limiting (multiple rapid requests)
4. Test payment completion flow
5. Verify WhatsApp button unlocks on success

The backend is fully functional, so once the frontend is fixed, your M-Pesa integration will be complete!
