'use client'

import { useState, useEffect } from 'react'
import { useCart } from '../../components/CartContext'
import QuantitySelector from '../../components/QuantitySelector'
import Link from 'next/link'

export default function CartPage() {
  const { items, setQty, removeItem, clear, totalAmount, totalCount, maxQtyForCondition } = useCart()
  const [clickedRemoveItems, setClickedRemoveItems] = useState(new Set())
  const [deliveryDetails, setDeliveryDetails] = useState({
    fulfillmentType: 'pickup', // 'pickup' or 'delivery'
    customerName: '',
    address: '',
    phone: '',
    altPhone: '',
    deliveryOption: 'standard',
    instructions: ''
  })
  const [showValidationPopup, setShowValidationPopup] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [mpesaPayment, setMpesaPayment] = useState({
    phoneNumber: '',
    isProcessing: false,
    paymentStatus: null, // null, 'pending', 'processing', 'success', 'failed', 'cancelled', 'timeout'
    checkoutRequestId: null,
    depositPaid: false,
    errorMessage: null
  })
  const list = Object.values(items)

  // Ensure we're on the client side before accessing localStorage
  useEffect(() => {
    setIsClient(true)
    
    // Load saved fulfillment details
    const savedDetails = localStorage.getItem('fulfillmentDetails')
    if (savedDetails) {
      try {
        const parsedDetails = JSON.parse(savedDetails)
        setDeliveryDetails(parsedDetails)
      } catch (error) {
        console.error('Error loading saved fulfillment details:', error)
      }
    }
    
    // Load saved M-Pesa payment state
    const savedPayment = localStorage.getItem('mpesaPayment')
    if (savedPayment) {
      try {
        const parsedPayment = JSON.parse(savedPayment)
        setMpesaPayment(parsedPayment)
        console.log('🔄 Restored payment state:', parsedPayment)
        
        // If there's a pending payment that's not successful, check its status
        if (parsedPayment.checkoutRequestId && 
            parsedPayment.paymentStatus !== 'success' && 
            !parsedPayment.isProcessing) {
          console.log('🔍 Found pending payment, will check status automatically...')
          // Set a flag to check payment status after component is ready
          setTimeout(() => {
            if (parsedPayment.checkoutRequestId) {
              console.log('🔍 Auto-checking payment status for:', parsedPayment.checkoutRequestId)
              pollPaymentStatus(parsedPayment.checkoutRequestId)
            }
          }, 3000) // Check after 3 seconds
        }
      } catch (error) {
        console.error('Error loading saved payment state:', error)
      }
    }
  }, [])

  // Save fulfillment details to localStorage whenever they change (only on client)
  useEffect(() => {
    if (isClient) {
      localStorage.setItem('fulfillmentDetails', JSON.stringify(deliveryDetails))
    }
  }, [deliveryDetails, isClient])

  // Save M-Pesa payment state to localStorage whenever it changes (only on client)
  useEffect(() => {
    if (isClient) {
      localStorage.setItem('mpesaPayment', JSON.stringify(mpesaPayment))
      console.log('💾 Saved payment state:', mpesaPayment)
    }
  }, [mpesaPayment, isClient])

  // Check if payment has been made by verifying existing payment state
  const checkExistingPayment = () => {
    if (mpesaPayment.checkoutRequestId && mpesaPayment.paymentStatus !== 'success') {
      console.log('🔍 Checking existing payment status...')
      pollPaymentStatus(mpesaPayment.checkoutRequestId)
    }
  }

  // Don't render dynamic content until after hydration to prevent mismatch
  if (!isClient) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, padding: '24px 16px 0' }}>
          <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Your Cart</h1>
          <Link href="/#collection" className="btn">Continue Shopping</Link>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center', color: 'var(--muted)', padding: '48px 16px' }}>
          <p style={{ margin: 0, fontSize: 16 }}>Loading cart...</p>
        </div>
      </div>
    )
  }

  const validateFulfillmentDetails = () => {
    if (deliveryDetails.fulfillmentType === 'pickup') {
      // For pickup, only phone is required
      if (!deliveryDetails.phone.trim()) {
        return { isValid: false, message: 'Please provide your phone number to proceed with pickup.' }
      }
    } else if (deliveryDetails.fulfillmentType === 'delivery') {
      // For delivery, customer name, phone and address are required
      if (!deliveryDetails.customerName.trim()) {
        return { isValid: false, message: 'Please provide your Address details to proceed with delivery.' }
      }
      if (!deliveryDetails.phone.trim()) {
        return { isValid: false, message: 'Please provide your Address details to proceed with delivery.' }
      }
      if (!deliveryDetails.address.trim()) {
        return { isValid: false, message: 'Please provide your Address details to proceed with delivery.' }
      }
    }
    return { isValid: true, message: '' }
  }

  const handleWhatsAppCheckout = (e) => {
    const validation = validateFulfillmentDetails()
    if (!validation.isValid) {
      e.preventDefault()
      setShowValidationPopup(true)
      setTimeout(() => setShowValidationPopup(false), 4000) // Auto hide after 4 seconds
      return false
    }
    // If validation passes, the link will work normally
    return true
  }

  // Calculate deposit and remaining amounts
  const calculatePaymentAmounts = () => {
    const deliveryCost = deliveryDetails.fulfillmentType === 'pickup' ? 0 : (deliveryDetails.deliveryOption === 'express' ? 300 : 0)
    const finalTotal = totalAmount + deliveryCost
    const depositAmount = Math.round(finalTotal * 0.2) // 20% deposit
    const remainingAmount = finalTotal - depositAmount
    
    return { finalTotal, depositAmount, remainingAmount, deliveryCost }
  }

  // Handle M-Pesa payment
  const handleMpesaPayment = async () => {
    const depositAmount = calculatePaymentAmounts().depositAmount
    
    // Validate phone number format
    const phoneRegex = /^(254[710]\d{8}|0[710]\d{8}|[710]\d{8})$/
    const cleanedPhone = mpesaPayment.phoneNumber.replace(/\s+/g, '')
    
    if (!phoneRegex.test(cleanedPhone)) {
      setMpesaPayment(prev => ({ 
        ...prev, 
        paymentStatus: 'failed',
        errorMessage: 'Invalid phone number format. Please use a valid Kenyan mobile number (e.g., 0708374149 or 254708374149).'
      }))
      return
    }
    
    console.log('🚀 Starting M-Pesa payment:', {
      phoneNumber: cleanedPhone,
      amount: depositAmount
    })
    
    setMpesaPayment(prev => ({ ...prev, isProcessing: true, paymentStatus: 'pending' }))

    try {
      const requestData = {
        phoneNumber: cleanedPhone,
        amount: depositAmount,
        accountReference: `ORDER-${Date.now()}`,
        transactionDesc: `20% Deposit Payment - Order Total: Ksh ${calculatePaymentAmounts().finalTotal}`
      }
      
      console.log('📤 Sending request:', requestData)
      
      const response = await fetch('/api/mpesa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      console.log('📥 Response status:', response.status)
      const data = await response.json()
      console.log('📋 Response data:', data)

      if (data.success) {
        setMpesaPayment(prev => ({
          ...prev,
          checkoutRequestId: data.checkoutRequestId,
          paymentStatus: 'processing',
          errorMessage: null
        }))
        
        // Show success notification for STK push sent
        console.log('✅ STK Push sent successfully!')
        
        // Start polling for payment status after a short delay to show success message
        setTimeout(() => {
          pollPaymentStatus(data.checkoutRequestId)
        }, 2000) // 2 second delay
      } else {
        console.log('❌ Payment failed - API returned success: false')
        
        // Get specific error message from M-Pesa response
        let errorMessage = 'Payment failed. Please try again.'
        if (data.message) {
          if (data.message.includes('Invalid Access Token')) {
            errorMessage = 'M-Pesa service temporarily unavailable. Please try again in a few minutes.'
          } else if (data.message.includes('Invalid phone number')) {
            errorMessage = 'Invalid phone number format. Please use format: 0700000000 or 254700000000'
          } else if (data.message.includes('Insufficient funds')) {
            errorMessage = 'Insufficient M-Pesa balance. Please top up and try again.'
          } else if (data.message.includes('Request cancelled')) {
            errorMessage = 'Payment request was cancelled. Please try again.'
          } else if (data.message.includes('timeout')) {
            errorMessage = 'Payment request timed out. Please check your network and try again.'
          } else {
            errorMessage = data.message
          }
        }
        
        setMpesaPayment(prev => ({ 
          ...prev, 
          isProcessing: false, 
          paymentStatus: 'failed',
          errorMessage: errorMessage,
          depositPaid: false
        }))
        console.error('M-Pesa STK Push failed:', data)
      }
    } catch (error) {
      console.error('❌ Payment error (catch block):', error)
      setMpesaPayment(prev => ({ 
        ...prev, 
        isProcessing: false, 
        paymentStatus: 'failed',
        errorMessage: 'Network error. Please check your connection and try again.',
        depositPaid: false
      }))
    }
  }

  // Poll payment status
  const pollPaymentStatus = async (checkoutRequestId) => {
    let attempts = 0
    const maxAttempts = 30 // Poll for 2.5 minutes (5s intervals)
    const gracePeriod = 6 // 30 seconds grace period before showing any failures

    console.log('🔍 Starting payment verification...')
    
    // Start polling immediately but with grace period for failures
    setMpesaPayment(prev => ({ ...prev, paymentStatus: 'pending', isProcessing: true }))
    
    // Start polling after 3 seconds
    setTimeout(() => {
      poll()
    }, 3000)

    const poll = async () => {
      try {
        const response = await fetch(`/api/mpesa?checkoutRequestId=${checkoutRequestId}`)
        const data = await response.json()

        if (data.success && data.data) {
          const { ResultCode, ResultDesc } = data.data
          console.log('Payment status check:', { ResultCode, ResultDesc })

          // Handle undefined or null ResultCode
          if (ResultCode === undefined || ResultCode === null) {
            console.log('ResultCode is undefined, continuing to poll...')
            // Continue polling if no result code yet
            attempts++
            if (attempts < maxAttempts) {
              setTimeout(poll, 5000)
            } else {
              setMpesaPayment(prev => ({ 
                ...prev, 
                isProcessing: false, 
                paymentStatus: 'timeout',
                errorMessage: 'Payment verification timed out. Please check your M-Pesa messages or try again.'
              }))
            }
            return
          }

          // Convert ResultCode to string for comparison
          const resultCode = String(ResultCode)

          if (resultCode === '0') {
            // Payment successful
            console.log('🎉 Payment successful! Enabling WhatsApp button...')
            setMpesaPayment(prev => {
              const newState = { 
                ...prev, 
                isProcessing: false, 
                paymentStatus: 'success',
                depositPaid: true,
                errorMessage: null
              }
              console.log('🔄 Updated payment state:', newState)
              return newState
            })
            return
          } else if (resultCode === '1032' || resultCode === '4999') {
            // Payment still processing (1032 = pending, 4999 = under processing)
            console.log(`⏳ Payment still processing (Code ${resultCode})... Attempt ${attempts + 1}/${maxAttempts}`)
            
            // Show processing status with timer
            setMpesaPayment(prev => ({ 
              ...prev, 
              paymentStatus: 'processing',
              errorMessage: `Transaction processing... (${(attempts + 1) * 5}s). Please complete the payment on your phone.`
            }))
            
            // Continue polling
            attempts++
            if (attempts < maxAttempts) {
              setTimeout(poll, 5000)
            } else {
              // After timeout, stop processing but don't mark as failed - let user check manually
              setMpesaPayment(prev => ({ 
                ...prev, 
                isProcessing: false, 
                paymentStatus: 'timeout',
                errorMessage: 'Payment verification timed out. Use "Check Payment Status" button to verify if payment was completed.'
              }))
            }
            return
          } else if (resultCode) {
            // Payment failed (other codes)
            console.log('Payment failed with code:', resultCode, 'Description:', ResultDesc)
            
            // Get user-friendly error message based on result code
            let errorMessage = ResultDesc || 'Payment failed. Please try again.'
            
            // Determine payment status based on result code
            let paymentStatus = 'failed'
            
            // Common M-Pesa result codes and user-friendly messages
            switch (resultCode) {
              case '1':
                errorMessage = 'Insufficient M-Pesa balance. Please top up your account and try again.'
                break
              case '2':
                errorMessage = 'Invalid amount. Please check the payment amount.'
                break
              case '4':
                errorMessage = 'Invalid phone number. Please check your M-Pesa number.'
                break
              case '8':
                errorMessage = 'Account not found. Please check your M-Pesa number.'
                break
              case '17':
                errorMessage = 'Payment was cancelled by user.'
                paymentStatus = 'cancelled'
                break
              case '26':
                errorMessage = 'System busy. Please try again in a few minutes.'
                break
              case '1001':
                errorMessage = 'Unable to lock subscriber. Please try again.'
                break
              case '1019':
                errorMessage = 'Transaction expired. Please try again.'
                break
              case '1025':
                errorMessage = 'Payment was cancelled by user.'
                paymentStatus = 'cancelled'
                break
              // Note: 1032 is handled explicitly above, so it won't reach this switch
              case '1037':
                errorMessage = 'Payment timeout. Please try again.'
                break
              default:
                // Check if the description indicates cancellation
                if (ResultDesc && (
                  ResultDesc.toLowerCase().includes('cancel') || 
                  ResultDesc.toLowerCase().includes('abort') ||
                  ResultDesc.toLowerCase().includes('reject')
                )) {
                  errorMessage = 'Payment was cancelled. Please try again.'
                  paymentStatus = 'cancelled'
                } else if (ResultDesc) {
                  // Use the original ResultDesc if available
                  errorMessage = ResultDesc
                } else {
                  // Generic message without showing undefined code
                  errorMessage = 'Payment failed. Please try again.'
                }
            }
            
            // If payment is still processing, don't stop polling yet
            if (paymentStatus === 'processing') {
              setMpesaPayment(prev => ({ 
                ...prev, 
                paymentStatus: 'processing',
                errorMessage: errorMessage
              }))
              // Continue polling for processing payments
              return
            } else {
              // For failed or cancelled payments, only show after grace period
              if (attempts >= gracePeriod) {
                setMpesaPayment(prev => ({ 
                  ...prev, 
                  isProcessing: false, 
                  paymentStatus: paymentStatus,
                  errorMessage: errorMessage,
                  depositPaid: false 
                }))
                return
              } else {
                // Still in grace period, continue polling
                console.log(`⏳ In grace period (${attempts + 1}/${gracePeriod}), continuing to poll...`)
                setMpesaPayment(prev => ({ 
                  ...prev, 
                  paymentStatus: 'processing',
                  errorMessage: `Verifying payment... (${(attempts + 1) * 5}s)`
                }))
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
                return
              }
            }
          }
          // If ResultCode is 1032, continue polling (still pending)
        } else {
          // No data received or API returned success: false
          console.log('No payment data received, continuing to poll...')
          // Continue polling if no data yet
          attempts++
          if (attempts < maxAttempts) {
            setTimeout(poll, 5000)
          } else {
            setMpesaPayment(prev => ({ 
              ...prev, 
              isProcessing: false, 
              paymentStatus: 'timeout',
              errorMessage: 'Payment verification timed out. Please check your M-Pesa messages or try again.'
            }))
          }
          return
        }

        // Continue polling if still pending
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000) // Poll every 5 seconds
        } else {
          // Timeout
          setMpesaPayment(prev => ({ 
            ...prev, 
            isProcessing: false, 
            paymentStatus: 'timeout',
            errorMessage: 'Payment verification timed out after 2.5 minutes. Your payment may still be processing. Please check your M-Pesa messages or try again.'
          }))
        }
      } catch (error) {
        console.error('Polling error:', error)
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000)
        } else {
          setMpesaPayment(prev => ({ 
            ...prev, 
            isProcessing: false, 
            paymentStatus: 'timeout',
            errorMessage: 'Unable to verify payment status. Please check your M-Pesa messages or contact support if money was deducted.'
          }))
        }
      }
    }

    poll()
  }

  const generateWhatsAppMessage = () => {
    const orderItems = list.map(i => `${i.name} x${i.qty}`).join(', ')
    const { finalTotal, depositAmount, remainingAmount, deliveryCost } = calculatePaymentAmounts()
    
    let fulfillmentInfo = ''
    if (deliveryDetails.fulfillmentType === 'pickup') {
      fulfillmentInfo = 'Shop Pickup - Free'
    } else {
      fulfillmentInfo = deliveryDetails.deliveryOption === 'express' ? 'Express Delivery (Same day) - Ksh 300' : 'Standard Delivery (2-3 days) - Free'
    }
    
    let message = `🛒 *ORDER DETAILS*\n`
    message += `Items: ${orderItems}\n`
    message += `Subtotal: Ksh ${Number(totalAmount).toLocaleString('en-KE')}\n`
    message += `Fulfillment: ${fulfillmentInfo}\n`
    message += `*Total: Ksh ${Number(finalTotal).toLocaleString('en-KE')}*\n\n`
    
    // Add payment information
    if (mpesaPayment.depositPaid) {
      message += `💳 *PAYMENT STATUS*\n`
      message += `Deposit Paid: Ksh ${Number(depositAmount).toLocaleString('en-KE')} ✅\n`
      message += `Remaining Balance: Ksh ${Number(remainingAmount).toLocaleString('en-KE')}\n\n`
    }
    
    if (deliveryDetails.fulfillmentType === 'pickup') {
      message += `🏪 *PICKUP DETAILS*\n`
      message += `Method: Shop Pickup\n`
      message += `Contact: ${deliveryDetails.phone || 'Not provided'}\n`
      message += `Note: Please bring this order confirmation when picking up\n`
    } else {
      message += `📍 *DELIVERY DETAILS*\n`
      message += `Name: ${deliveryDetails.customerName || 'Not provided'}\n`
      message += `Address: ${deliveryDetails.address || 'Not provided'}\n`
      message += `Phone: ${deliveryDetails.phone || 'Not provided'}\n`
      if (deliveryDetails.altPhone) {
        message += `Alt Phone: ${deliveryDetails.altPhone}\n`
      }
      if (deliveryDetails.instructions) {
        message += `Instructions: ${deliveryDetails.instructions}\n`
      }
    }
    
    return message
  }

  return (
    <>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, padding: '24px 16px 0' }}>
        <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Your Cart</h1>
        <Link href="/#collection" className="btn">Continue Shopping</Link>
      </div>

      {list.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center', color: 'var(--muted)', padding: '48px 16px', border: '1px dashed #2a3342', borderRadius: 12 }}>
          <p style={{ margin: 0, fontSize: 16 }}>Your cart is empty.</p>
          <Link href="/#collection" className="btn btn-primary">Back to Products</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32, padding: '0 16px 32px' }}>
          {/* Cart Items List */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {list.map(it => {
              const max = maxQtyForCondition(it.condition)
              const lineTotal = (it.qty || 0) * (it.price || 0)
              return (
                <div key={it.id} style={{ display: 'flex', gap: 8, padding: 8, border: '1px solid #253049', borderRadius: 8 }}>
                  <img src={it.img} alt={it.name} width={60} height={48} style={{ objectFit: 'cover', borderRadius: 6 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{it.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{it.condition || '—'}</div>
                      </div>
                      <button 
                        className="btn btn-small" 
                        onClick={() => {
                          setClickedRemoveItems(prev => new Set([...prev, it.id]))
                          removeItem(it.id)
                        }} 
                        aria-label={`Remove ${it.name}`} 
                        style={{ 
                          fontSize: 11, 
                          padding: '2px 6px',
                          color: clickedRemoveItems.has(it.id) ? 'red' : 'inherit'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                    <div style={{ flex: 1 }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'blue', marginTop: '-4px' }}>Qty:</span>
                        <QuantitySelector
                          quantity={it.qty}
                          maxQuantity={max}
                          onQuantityChange={(newQty) => setQty(it.id, newQty)}
                        />
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'green' }}>Ksh {Number(lineTotal).toLocaleString('en-KE')}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </section>

          {/* Fulfillment Options */}
          <section style={{ 
            border: '1px solid #253049', 
            borderRadius: 8, 
            padding: 12, 
            backgroundColor: 'rgba(42, 51, 66, 0.05)',
            position: 'relative',
            zIndex: 2
          }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700 }}>Fulfillment Options</h2>
            
            {/* Pickup vs Delivery Choice */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text)' }}>
                How would you like to receive your order?
              </label>
              <div style={{ display: 'flex', gap: 12, width: '100%' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8, 
                  cursor: 'pointer',
                  padding: '8px 12px',
                  border: `2px solid ${deliveryDetails.fulfillmentType === 'pickup' ? '#007bff' : '#2a3342'}`,
                  borderRadius: 6,
                  backgroundColor: deliveryDetails.fulfillmentType === 'pickup' ? 'rgba(0, 123, 255, 0.1)' : 'transparent',
                  transition: 'all 0.2s',
                  flex: 1
                }}>
                  <input 
                    type="radio" 
                    name="fulfillment" 
                    value="pickup" 
                    checked={deliveryDetails.fulfillmentType === 'pickup'}
                    onChange={(e) => setDeliveryDetails(prev => ({ ...prev, fulfillmentType: e.target.value }))}
                    style={{ accentColor: '#007bff' }} 
                  />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>🏪 Shop Pickup</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>Free - Pick up from our store</div>
                  </div>
                </label>
                
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8, 
                  cursor: 'pointer',
                  padding: '8px 12px',
                  border: `2px solid ${deliveryDetails.fulfillmentType === 'delivery' ? '#007bff' : '#2a3342'}`,
                  borderRadius: 6,
                  backgroundColor: deliveryDetails.fulfillmentType === 'delivery' ? 'rgba(0, 123, 255, 0.1)' : 'transparent',
                  transition: 'all 0.2s',
                  flex: 1
                }}>
                  <input 
                    type="radio" 
                    name="fulfillment" 
                    value="delivery" 
                    checked={deliveryDetails.fulfillmentType === 'delivery'}
                    onChange={(e) => setDeliveryDetails(prev => ({ ...prev, fulfillmentType: e.target.value }))}
                    style={{ accentColor: '#007bff' }} 
                  />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>🚚 Home Delivery</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>Delivered to your address</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Contact Information - Only shown for pickup */}
            {deliveryDetails.fulfillmentType === 'pickup' && (
              <div style={{ marginBottom: 0 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>
                  Contact Phone Number *
                </label>
                <input 
                  type="tel" 
                  value={deliveryDetails.phone}
                  onChange={(e) => setDeliveryDetails(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="e.g., +254 700 000 000"
                  style={{ 
                    width: '100%', 
                    padding: '8px 10px', 
                    borderRadius: 6, 
                    border: '1px solid #2a3342', 
                    background: 'transparent', 
                    color: 'var(--text)', 
                    fontSize: 13,
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            )}

            {/* Delivery Details - Only shown when delivery is selected */}
            {deliveryDetails.fulfillmentType === 'delivery' && (
              <div style={{ display: 'grid', gap: 20, width: '100%', boxSizing: 'border-box' }}>
              {/* Delivery Address */}
              <div style={{ width: '100%', position: 'relative' }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>
                  Delivery Address *
                </label>
                <textarea 
                  value={deliveryDetails.address}
                  onChange={(e) => setDeliveryDetails(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter your full delivery address including building name, floor, and any landmarks"
                  style={{ 
                    width: '100%', 
                    minHeight: 60, 
                    padding: '8px 10px', 
                    borderRadius: 6, 
                    border: '1px solid #2a3342', 
                    background: 'transparent', 
                    color: 'var(--text)', 
                    fontSize: 13,
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Customer Name */}
              <div style={{ width: '100%', position: 'relative' }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>
                  Customer Name *
                </label>
                <input 
                  type="text" 
                  value={deliveryDetails.customerName}
                  onChange={(e) => setDeliveryDetails(prev => ({ ...prev, customerName: e.target.value }))}
                  placeholder="Enter your full name"
                  style={{ 
                    width: '100%', 
                    padding: '8px 10px', 
                    borderRadius: 6, 
                    border: '1px solid #2a3342', 
                    background: 'transparent', 
                    color: 'var(--text)', 
                    fontSize: 13,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Contact Information */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, width: '100%' }}>
                <div style={{ position: 'relative' }}>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--text)' }}>
                    Phone Number *
                  </label>
                  <input 
                    type="tel" 
                    value={deliveryDetails.phone}
                    onChange={(e) => setDeliveryDetails(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="e.g., +254 700 000 000"
                    style={{ 
                      width: '100%', 
                      padding: '10px 12px', 
                      borderRadius: 8, 
                      border: '1px solid #2a3342', 
                      background: 'transparent', 
                      color: 'var(--text)', 
                      fontSize: 14,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div style={{ position: 'relative' }}>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--text)' }}>
                    Alternative Phone
                  </label>
                  <input 
                    type="tel" 
                    value={deliveryDetails.altPhone}
                    onChange={(e) => setDeliveryDetails(prev => ({ ...prev, altPhone: e.target.value }))}
                    placeholder="Optional backup number"
                    style={{ 
                      width: '100%', 
                      padding: '10px 12px', 
                      borderRadius: 8, 
                      border: '1px solid #2a3342', 
                      background: 'transparent', 
                      color: 'var(--text)', 
                      fontSize: 14,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Delivery Options */}
              <div style={{ width: '100%', position: 'relative' }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--text)' }}>
                  Delivery Option
                </label>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', width: '100%' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="delivery" 
                      value="standard" 
                      checked={deliveryDetails.deliveryOption === 'standard'}
                      onChange={(e) => setDeliveryDetails(prev => ({ ...prev, deliveryOption: e.target.value }))}
                      style={{ accentColor: '#007bff' }} 
                    />
                    <span style={{ fontSize: 14 }}>Standard Delivery (2-3 days) - Free</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="delivery" 
                      value="express" 
                      checked={deliveryDetails.deliveryOption === 'express'}
                      onChange={(e) => setDeliveryDetails(prev => ({ ...prev, deliveryOption: e.target.value }))}
                      style={{ accentColor: '#007bff' }} 
                    />
                    <span style={{ fontSize: 14 }}>Express Delivery (Same day) - Ksh 300</span>
                  </label>
                </div>
              </div>

              {/* Special Instructions */}
              <div style={{ width: '100%', position: 'relative' }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--text)' }}>
                  Special Instructions (Optional)
                </label>
                <textarea 
                  value={deliveryDetails.instructions}
                  onChange={(e) => setDeliveryDetails(prev => ({ ...prev, instructions: e.target.value }))}
                  placeholder="Any special delivery instructions, preferred delivery time, or notes for the delivery person"
                  style={{ 
                    width: '100%', 
                    minHeight: 60, 
                    padding: '12px', 
                    borderRadius: 8, 
                    border: '1px solid #2a3342', 
                    background: 'transparent', 
                    color: 'var(--text)', 
                    fontSize: 14,
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Delivery Info */}
              <div style={{ 
                background: 'rgba(0, 123, 255, 0.1)', 
                border: '1px solid rgba(0, 123, 255, 0.3)', 
                borderRadius: 8, 
                padding: 12 
              }}>
                <h4 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: '#007bff' }}>
                  📦 Delivery Information
                </h4>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, color: 'var(--muted)' }}>
                  <li>Standard delivery within Nairobi: 2-3 business days (Free)</li>
                  <li>Express delivery available for same-day delivery (Ksh 300)</li>
                  <li>Delivery outside Nairobi: 3-5 business days (charges apply)</li>
                  <li>All items are carefully packaged and insured during transit</li>
                </ul>
              </div>
              </div>
            )}
          </section>

          {/* M-Pesa Payment Section */}
          <section style={{ 
            border: '1px solid #253049', 
            borderRadius: 8, 
            padding: 16, 
            backgroundColor: 'rgba(0, 123, 255, 0.05)',
            position: 'relative',
            zIndex: 3
          }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              💳 M-Pesa Payment - 20% Deposit
            </h2>
            
            {(() => {
              const { finalTotal, depositAmount, remainingAmount } = calculatePaymentAmounts()
              
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Payment Summary */}
                  <div style={{ 
                    background: 'rgba(0, 123, 255, 0.1)', 
                    border: '1px solid rgba(0, 123, 255, 0.3)', 
                    borderRadius: 6, 
                    padding: 12 
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                      <span>Order Total:</span>
                      <strong>Ksh {Number(finalTotal).toLocaleString('en-KE')}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, color: '#007bff' }}>
                      <span>Deposit (20%):</span>
                      <strong>Ksh {Number(depositAmount).toLocaleString('en-KE')}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--muted)' }}>
                      <span>Remaining Balance:</span>
                      <strong>Ksh {Number(remainingAmount).toLocaleString('en-KE')}</strong>
                    </div>
                  </div>

                  {/* Payment Status */}
                  {mpesaPayment.paymentStatus && (
                    <div style={{ 
                      padding: 12, 
                      borderRadius: 6,
                      backgroundColor: 
                        mpesaPayment.paymentStatus === 'success' ? 'rgba(40, 167, 69, 0.1)' :
                        mpesaPayment.paymentStatus === 'failed' ? 'rgba(220, 53, 69, 0.1)' :
                        mpesaPayment.paymentStatus === 'cancelled' ? 'rgba(255, 193, 7, 0.1)' :
                        mpesaPayment.paymentStatus === 'timeout' ? 'rgba(255, 193, 7, 0.1)' :
                        mpesaPayment.paymentStatus === 'processing' ? 'rgba(40, 167, 69, 0.1)' :
                        'rgba(0, 123, 255, 0.1)',
                      border: `1px solid ${
                        mpesaPayment.paymentStatus === 'success' ? 'rgba(40, 167, 69, 0.3)' :
                        mpesaPayment.paymentStatus === 'failed' ? 'rgba(220, 53, 69, 0.3)' :
                        mpesaPayment.paymentStatus === 'cancelled' ? 'rgba(255, 193, 7, 0.3)' :
                        mpesaPayment.paymentStatus === 'timeout' ? 'rgba(255, 193, 7, 0.3)' :
                        mpesaPayment.paymentStatus === 'processing' ? 'rgba(40, 167, 69, 0.3)' :
                        'rgba(0, 123, 255, 0.3)'
                      }`
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600 }}>
                        {mpesaPayment.paymentStatus === 'success' && '✅ Payment Made Successfully!'}
                        {mpesaPayment.paymentStatus === 'failed' && '❌ Payment Failed'}
                        {mpesaPayment.paymentStatus === 'cancelled' && '🚫 Payment Cancelled'}
                        {mpesaPayment.paymentStatus === 'timeout' && '⏱️ Payment Timeout'}
                        {mpesaPayment.paymentStatus === 'processing' && '✅ Transaction Made Successfully'}
                        {mpesaPayment.paymentStatus === 'pending' && '⏳ Processing Payment...'}
                      </div>
                      {mpesaPayment.paymentStatus === 'success' && (
                        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--muted)' }}>
                          Your 20% deposit has been received. You can now proceed with your order.
                        </p>
                      )}
                      {mpesaPayment.paymentStatus === 'processing' && (
                        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--muted)' }}>
                          The transaction is still under processing. Please check your phone and enter your M-Pesa PIN to complete the payment.
                        </p>
                      )}
                      {mpesaPayment.paymentStatus === 'cancelled' && (
                        <div>
                          <p style={{ margin: '4px 0 8px', fontSize: 12, color: 'var(--muted)' }}>
                            {mpesaPayment.errorMessage || 'Payment was cancelled. Please try again.'}
                          </p>
                          <button 
                            onClick={() => setMpesaPayment(prev => ({ 
                              ...prev, 
                              paymentStatus: null, 
                              isProcessing: false,
                              // Keep depositPaid if it was successful before
                              depositPaid: false,
                              errorMessage: null
                            }))}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 4,
                              border: '1px solid #ffc107',
                              background: 'transparent',
                              color: '#ffc107',
                              fontSize: 12,
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => {
                              e.target.style.background = '#ffc107'
                              e.target.style.color = 'black'
                            }}
                            onMouseOut={(e) => {
                              e.target.style.background = 'transparent'
                              e.target.style.color = '#ffc107'
                            }}
                          >
                            🔄 Try Again
                          </button>
                        </div>
                      )}
                      {mpesaPayment.paymentStatus === 'failed' && (
                        <div>
                          <p style={{ margin: '4px 0 8px', fontSize: 12, color: 'var(--muted)' }}>
                            {mpesaPayment.errorMessage || 'Payment was cancelled or failed. Please try again.'}
                          </p>
                          <button 
                            onClick={() => setMpesaPayment(prev => ({ 
                              ...prev, 
                              paymentStatus: null, 
                              isProcessing: false,
                              depositPaid: false,
                              errorMessage: null
                            }))}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 4,
                              border: '1px solid #dc3545',
                              background: 'transparent',
                              color: '#dc3545',
                              fontSize: 12,
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => {
                              e.target.style.background = '#dc3545'
                              e.target.style.color = 'white'
                            }}
                            onMouseOut={(e) => {
                              e.target.style.background = 'transparent'
                              e.target.style.color = '#dc3545'
                            }}
                          >
                            🔄 Try Again
                          </button>
                        </div>
                      )}
                      {mpesaPayment.paymentStatus === 'timeout' && (
                        <div>
                          <p style={{ margin: '4px 0 8px', fontSize: 12, color: 'var(--muted)' }}>
                            {mpesaPayment.errorMessage || 'Payment request timed out. Please try again.'}
                          </p>
                          <button 
                            onClick={() => setMpesaPayment(prev => ({ 
                              ...prev, 
                              paymentStatus: null, 
                              isProcessing: false,
                              depositPaid: false,
                              errorMessage: null
                            }))}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 4,
                              border: '1px solid #ffc107',
                              background: 'transparent',
                              color: '#ffc107',
                              fontSize: 12,
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => {
                              e.target.style.background = '#ffc107'
                              e.target.style.color = 'black'
                            }}
                            onMouseOut={(e) => {
                              e.target.style.background = 'transparent'
                              e.target.style.color = '#ffc107'
                            }}
                          >
                            🔄 Try Again
                          </button>
                        </div>
                      )}
                      {mpesaPayment.paymentStatus === 'pending' && (
                        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--muted)' }}>
                          Verifying payment... Please check your phone and enter your M-Pesa PIN to complete the payment.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Payment Form */}
                  {!mpesaPayment.depositPaid && mpesaPayment.paymentStatus !== 'success' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>
                          M-Pesa Phone Number *
                        </label>
                        <input 
                          type="tel" 
                          value={mpesaPayment.phoneNumber}
                          onChange={(e) => setMpesaPayment(prev => ({ ...prev, phoneNumber: e.target.value }))}
                          placeholder="e.g., 0700000000 or 254700000000"
                          disabled={mpesaPayment.isProcessing}
                          style={{ 
                            width: '100%', 
                            padding: '10px 12px', 
                            borderRadius: 6, 
                            border: '1px solid #2a3342', 
                            background: mpesaPayment.isProcessing ? 'rgba(42, 51, 66, 0.1)' : 'transparent', 
                            color: 'var(--text)', 
                            fontSize: 14,
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                      
                      <button 
                        onClick={handleMpesaPayment}
                        disabled={mpesaPayment.isProcessing || !mpesaPayment.phoneNumber.trim()}
                        style={{ 
                          width: '100%',
                          padding: '12px 16px', 
                          borderRadius: 6, 
                          border: 'none',
                          background: mpesaPayment.isProcessing || !mpesaPayment.phoneNumber.trim() ? 
                            'rgba(0, 123, 255, 0.3)' : '#007bff',
                          color: 'white', 
                          fontSize: 14, 
                          fontWeight: 600,
                          cursor: mpesaPayment.isProcessing || !mpesaPayment.phoneNumber.trim() ? 
                            'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          transition: 'all 0.2s'
                        }}
                      >
                        {mpesaPayment.isProcessing ? (
                          <>
                            <span style={{ 
                              width: 16, 
                              height: 16, 
                              border: '2px solid rgba(255,255,255,0.3)', 
                              borderTop: '2px solid white', 
                              borderRadius: '50%', 
                              animation: 'spin 1s linear infinite' 
                            }}></span>
                            Processing...
                          </>
                        ) : (
                          <>
                            📱 Pay Ksh {Number(depositAmount).toLocaleString('en-KE')} Deposit
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Success Message */}
                  {mpesaPayment.depositPaid && mpesaPayment.paymentStatus === 'success' && (
                    <div style={{ 
                      background: 'rgba(40, 167, 69, 0.1)', 
                      border: '1px solid rgba(40, 167, 69, 0.3)', 
                      borderRadius: 6, 
                      padding: 12,
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: 16, fontWeight: 600, color: '#28a745', marginBottom: 4 }}>
                        ✅ Deposit Payment Complete!
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                        Your 20% deposit of Ksh {Number(depositAmount).toLocaleString('en-KE')} has been received.
                        <br />
                        Remaining balance: Ksh {Number(remainingAmount).toLocaleString('en-KE')}
                      </div>
                    </div>
                  )}

                </div>
              )
            })()}
          </section>

          {/* Order Summary */}
          <section style={{ 
            border: '1px solid #253049', 
            borderRadius: 8, 
            padding: 12, 
            backgroundColor: 'rgba(37, 48, 73, 0.1)',
            position: 'relative',
            zIndex: 1
          }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700 }}>Order Summary</h2>
            {(() => {
              const { finalTotal, depositAmount, remainingAmount, deliveryCost } = calculatePaymentAmounts()
              
              return (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                    <span>Subtotal ({totalCount} items)</span>
                    <strong>Ksh {Number(totalAmount).toLocaleString('en-KE')}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                    <span>{deliveryDetails.fulfillmentType === 'pickup' ? 'Pickup' : 'Delivery'}</span>
                    <strong>Ksh {Number(deliveryCost).toLocaleString('en-KE')}</strong>
                  </div>
                  <div style={{ height: 1, background: '#253049', margin: '12px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14, fontWeight: 700 }}>
                    <span>Total</span>
                    <strong style={{ color: 'green' }}>Ksh {Number(finalTotal).toLocaleString('en-KE')}</strong>
                  </div>
                  
                  {/* Payment Status in Order Summary */}
                  {mpesaPayment.depositPaid && (
                    <>
                      <div style={{ height: 1, background: '#28a745', margin: '8px 0' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13, color: '#28a745' }}>
                        <span>✅ Deposit Paid (20%)</span>
                        <strong>Ksh {Number(depositAmount).toLocaleString('en-KE')}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 13, fontWeight: 600 }}>
                        <span>Remaining Balance</span>
                        <strong style={{ color: '#ffc107' }}>Ksh {Number(remainingAmount).toLocaleString('en-KE')}</strong>
                      </div>
                    </>
                  )}
                </>
              )
            })()}
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <input type="text" placeholder="Promo Code" style={{ flex: 1, borderRadius: 6, border: '1px solid #2a3342', background: 'transparent', color: 'var(--text)', padding: '6px 8px', fontSize: 13 }} />
              <button className="btn btn-small" style={{ fontSize: 12, padding: '6px 8px' }}>Apply</button>
            </div>
            {/* Payment verification button - only show if there's a pending payment */}
            {mpesaPayment.checkoutRequestId && mpesaPayment.paymentStatus !== 'success' && !mpesaPayment.isProcessing && (
              <div style={{ marginBottom: 8 }}>
                <button 
                  onClick={checkExistingPayment}
                  style={{
                    padding: '6px 12px',
                    fontSize: 12,
                    background: '#17a2b8',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  🔍 Check Payment Status
                </button>
                <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--muted)', textAlign: 'center' }}>
                  Click to verify if your payment has been processed
                </p>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              {mpesaPayment.depositPaid && mpesaPayment.paymentStatus === 'success' ? (
                <a 
                  className="btn btn-primary"
                  href={`https://wa.me/254718176584?text=${encodeURIComponent(generateWhatsAppMessage())}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={handleWhatsAppCheckout}
                  style={{ 
                    flex: 1, 
                    textAlign: 'center', 
                    fontSize: 13, 
                    padding: '8px 12px',
                    background: '#28a745',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4
                  }}
                >
                  ✅ Complete Order via WhatsApp
                </a>
              ) : (
                <button 
                  disabled
                  style={{ 
                    flex: 1, 
                    textAlign: 'center', 
                    fontSize: 13, 
                    padding: '8px 12px',
                    background: 'rgba(0, 123, 255, 0.3)',
                    color: 'rgba(255, 255, 255, 0.6)',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4
                  }}
                >
                  🔒 Pay Deposit First to Checkout
                </button>
              )}
              <button className="btn" onClick={clear} style={{ fontSize: 12, padding: '8px 10px' }}>Clear Cart</button>
            </div>
          </section>
        </div>
      )}

      {/* Validation Popup */}
      {showValidationPopup && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#ff4444',
          color: 'white',
          padding: '16px 24px',
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          zIndex: 1000,
          maxWidth: '90%',
          textAlign: 'center',
          fontSize: 14,
          fontWeight: 600
        }}>
          <div style={{ marginBottom: 8, fontSize: 15 }}>⚠️ Missing Information</div>
          <div style={{ fontSize: 13 }}>{validateFulfillmentDetails().message}</div>
        </div>
      )}

      {/* Popup Backdrop */}
      {showValidationPopup && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999
          }}
          onClick={() => setShowValidationPopup(false)}
        />
      )}
      </div>
    </>
  )
}
