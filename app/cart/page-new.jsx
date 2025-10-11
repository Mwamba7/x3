// This file contains the updated M-Pesa integration for the frontend
// I'll create a complete rewrite with proper error handling

const MpesaPaymentSection = ({ calculatePaymentAmounts }) => {
  const [mpesaPayment, setMpesaPayment] = useState({
    phoneNumber: '',
    isProcessing: false,
    paymentStatus: null, // null, 'processing', 'success', 'failed', 'system_busy', 'rate_limited', 'timeout'
    checkoutRequestId: null,
    merchantRequestId: null,
    depositPaid: false,
    errorMessage: null,
    transactionId: null,
    retryAfter: null
  })

  // Load saved payment state on component mount
  useEffect(() => {
    const savedPayment = localStorage.getItem('mpesaPayment')
    if (savedPayment) {
      try {
        const parsedPayment = JSON.parse(savedPayment)
        setMpesaPayment(prev => ({ ...prev, ...parsedPayment }))
        
        // Auto-check pending payments
        if (parsedPayment.checkoutRequestId && 
            parsedPayment.paymentStatus !== 'success' && 
            !parsedPayment.isProcessing) {
          console.log('🔍 Auto-checking pending payment...')
          setTimeout(() => {
            checkPaymentStatus(parsedPayment.checkoutRequestId)
          }, 2000)
        }
      } catch (error) {
        console.error('Failed to parse saved payment:', error)
        localStorage.removeItem('mpesaPayment')
      }
    }
  }, [])

  // Save payment state to localStorage
  useEffect(() => {
    if (mpesaPayment.checkoutRequestId || mpesaPayment.paymentStatus) {
      localStorage.setItem('mpesaPayment', JSON.stringify(mpesaPayment))
    }
  }, [mpesaPayment])

  // Handle M-Pesa payment initiation
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
      console.log('🚀 Initiating M-Pesa payment...')
      
      const response = await fetch('/api/mpesa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: mpesaPayment.phoneNumber,
          amount: depositAmount,
          accountReference: `ORDER-${Date.now()}`,
          transactionDesc: `20% Deposit - Order Total: Ksh ${calculatePaymentAmounts().finalTotal}`
        })
      })

      const data = await response.json()
      console.log('📥 M-Pesa API Response:', data)

      if (response.ok && data.success) {
        // STK Push sent successfully
        setMpesaPayment(prev => ({
          ...prev,
          checkoutRequestId: data.checkoutRequestId,
          merchantRequestId: data.merchantRequestId,
          transactionId: data.transactionId,
          paymentStatus: 'processing',
          errorMessage: null
        }))
        
        console.log('✅ STK Push sent successfully!')
        
        // Start polling for payment status
        setTimeout(() => {
          pollPaymentStatus(data.checkoutRequestId)
        }, 3000)
        
      } else {
        // Handle different error types
        handlePaymentError(data, response.status)
      }

    } catch (error) {
      console.error('❌ Payment request failed:', error)
      setMpesaPayment(prev => ({
        ...prev,
        isProcessing: false,
        paymentStatus: 'failed',
        errorMessage: 'Network error. Please check your connection and try again.',
        depositPaid: false
      }))
    }
  }

  // Handle payment errors with proper categorization
  const handlePaymentError = (data, status) => {
    let paymentStatus = 'failed'
    let errorMessage = data.message || 'Payment request failed. Please try again.'
    let retryAfter = null

    // Categorize errors
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

  // Poll payment status with enhanced logic
  const pollPaymentStatus = async (checkoutRequestId) => {
    let attempts = 0
    const maxAttempts = 36 // Poll for 3 minutes (5s intervals)
    const gracePeriod = 6 // 30 seconds grace period

    console.log('🔍 Starting payment status polling...')

    const poll = async () => {
      try {
        const response = await fetch(`/api/mpesa?checkoutRequestId=${checkoutRequestId}`)
        const data = await response.json()

        console.log(`📊 Status check ${attempts + 1}/${maxAttempts}:`, data)

        // Handle rate limiting
        if (response.status === 429) {
          console.log('⚠️ Status query rate limited, waiting longer...')
          attempts++
          if (attempts < maxAttempts) {
            setTimeout(poll, 15000) // Wait 15 seconds if rate limited
          } else {
            setMpesaPayment(prev => ({
              ...prev,
              isProcessing: false,
              paymentStatus: 'timeout',
              errorMessage: 'Payment verification timed out. Use "Check Payment Status" to verify manually.'
            }))
          }
          return
        }

        if (data.success && data.data) {
          const { ResultCode, ResultDesc } = data.data

          // Handle successful payment
          if (ResultCode === 0) {
            console.log('🎉 Payment confirmed successful!')
            setMpesaPayment(prev => ({
              ...prev,
              isProcessing: false,
              paymentStatus: 'success',
              depositPaid: true,
              errorMessage: null
            }))
            return
          }

          // Handle failed payment (after grace period)
          if (ResultCode && ResultCode !== 1032 && ResultCode !== 4999) {
            if (attempts >= gracePeriod) {
              console.log('❌ Payment failed:', ResultDesc)
              setMpesaPayment(prev => ({
                ...prev,
                isProcessing: false,
                paymentStatus: 'failed',
                errorMessage: ResultDesc || 'Payment was not completed successfully.',
                depositPaid: false
              }))
              return
            }
          }

          // Payment still processing (1032 = pending, 4999 = under processing)
          if (ResultCode === 1032 || ResultCode === 4999 || !ResultCode) {
            console.log(`⏳ Payment still processing... (${(attempts + 1) * 5}s)`)
            setMpesaPayment(prev => ({
              ...prev,
              paymentStatus: 'processing',
              errorMessage: `Verifying payment... (${(attempts + 1) * 5}s). Please complete the payment on your phone.`
            }))
          }
        }

        // Continue polling
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000)
        } else {
          // Timeout reached
          setMpesaPayment(prev => ({
            ...prev,
            isProcessing: false,
            paymentStatus: 'timeout',
            errorMessage: 'Payment verification timed out. Use "Check Payment Status" to verify if payment was completed.'
          }))
        }

      } catch (error) {
        console.error('❌ Status polling error:', error)
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000)
        } else {
          setMpesaPayment(prev => ({
            ...prev,
            isProcessing: false,
            paymentStatus: 'timeout',
            errorMessage: 'Unable to verify payment status. Use "Check Payment Status" to verify manually.'
          }))
        }
      }
    }

    // Start polling after initial delay
    setTimeout(poll, 3000)
  }

  // Manual payment status check
  const checkPaymentStatus = async (checkoutRequestId) => {
    if (!checkoutRequestId) {
      console.error('No checkout request ID available')
      return
    }

    setMpesaPayment(prev => ({
      ...prev,
      isProcessing: true,
      paymentStatus: 'processing',
      errorMessage: 'Checking payment status...'
    }))

    try {
      // First check callback results
      const callbackResponse = await fetch(`/api/mpesa/callback?checkoutRequestId=${checkoutRequestId}`)
      const callbackData = await callbackResponse.json()

      if (callbackData.success && callbackData.found && callbackData.data) {
        const result = callbackData.data
        
        if (result.status === 'success' && result.ResultCode === 0) {
          console.log('✅ Payment confirmed via callback!')
          setMpesaPayment(prev => ({
            ...prev,
            isProcessing: false,
            paymentStatus: 'success',
            depositPaid: true,
            errorMessage: null
          }))
          return
        } else if (result.status === 'failed') {
          console.log('❌ Payment failed via callback:', result.ResultDesc)
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

      // If no callback result, query directly
      pollPaymentStatus(checkoutRequestId)

    } catch (error) {
      console.error('❌ Manual status check failed:', error)
      setMpesaPayment(prev => ({
        ...prev,
        isProcessing: false,
        paymentStatus: 'failed',
        errorMessage: 'Unable to check payment status. Please try again.'
      }))
    }
  }

  // Reset payment state
  const resetPaymentState = () => {
    setMpesaPayment({
      phoneNumber: mpesaPayment.phoneNumber, // Keep phone number
      isProcessing: false,
      paymentStatus: null,
      checkoutRequestId: null,
      merchantRequestId: null,
      depositPaid: false,
      errorMessage: null,
      transactionId: null,
      retryAfter: null
    })
    localStorage.removeItem('mpesaPayment')
  }

  return { 
    mpesaPayment, 
    setMpesaPayment,
    handleMpesaPayment, 
    checkPaymentStatus: () => checkPaymentStatus(mpesaPayment.checkoutRequestId),
    resetPaymentState
  }
}

export default MpesaPaymentSection
