'use client'

import { useState, useEffect } from 'react'
import { useCart } from '../../components/CartContext'
import QuantitySelector from '../../components/QuantitySelector'
import Link from 'next/link'

export default function CartPage() {
  // Add CSS for spinning animation
  if (typeof document !== 'undefined') {
    const style = document.createElement('style')
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `
    if (!document.head.querySelector('style[data-spin-animation]')) {
      style.setAttribute('data-spin-animation', 'true')
      document.head.appendChild(style)
    }
  }
  const { items, setQty, removeItem, clear, totalAmount, totalCount, maxQtyForCondition } = useCart()
  const [clickedRemoveItems, setClickedRemoveItems] = useState(new Set())
  const [isClient, setIsClient] = useState(false)
  const [deliveryDetails, setDeliveryDetails] = useState({
    fulfillmentType: 'pickup', // 'pickup' or 'delivery'
    customerName: '',
    address: '',
    phone: '',
    altPhone: '',
    deliveryOption: 'standard',
    instructions: ''
  })
  const [mpesaPayment, setMpesaPayment] = useState({
    isProcessing: false,
    paymentStatus: null, // null, 'processing', 'success', 'failed'
    checkoutRequestId: null,
    merchantRequestId: null,
    depositPaid: false,
    errorMessage: null,
    phoneNumber: '',
    depositAmount: 0
  })
  const [isCartLocked, setIsCartLocked] = useState(false)
  const list = Object.values(items)

  // Ensure we're on the client side before accessing localStorage
  useEffect(() => {
    setIsClient(true)
    
    // Load saved payment state from localStorage
    const savedPayment = localStorage.getItem('mpesaPayment')
    const savedDelivery = localStorage.getItem('deliveryDetails')
    
    if (savedPayment) {
      try {
        const parsedPayment = JSON.parse(savedPayment)
        setMpesaPayment(parsedPayment)
        setIsCartLocked(parsedPayment.depositPaid)
        
        // If there's a pending payment, check its status
        if (parsedPayment.checkoutRequestId && !parsedPayment.depositPaid) {
          setTimeout(() => {
            checkPaymentStatus(parsedPayment.checkoutRequestId)
          }, 2000)
        }
      } catch (error) {
        console.error('Error loading saved payment state:', error)
      }
    }
    
    if (savedDelivery) {
      try {
        const parsedDelivery = JSON.parse(savedDelivery)
        setDeliveryDetails(parsedDelivery)
      } catch (error) {
        console.error('Error loading saved delivery details:', error)
      }
    }
  }, [])

  // Save payment state to localStorage
  useEffect(() => {
    if (isClient) {
      localStorage.setItem('mpesaPayment', JSON.stringify(mpesaPayment))
    }
  }, [mpesaPayment, isClient])

  // Save delivery details to localStorage
  useEffect(() => {
    if (isClient) {
      localStorage.setItem('deliveryDetails', JSON.stringify(deliveryDetails))
    }
  }, [deliveryDetails, isClient])

  // Prevent cart clearing when locked
  useEffect(() => {
    if (isCartLocked && isClient) {
      // Store cart lock status
      localStorage.setItem('cartLocked', 'true')
    } else if (!isCartLocked && isClient) {
      localStorage.removeItem('cartLocked')
    }
  }, [isCartLocked, isClient])

  // Check if cart was locked on page load
  useEffect(() => {
    if (isClient) {
      const wasLocked = localStorage.getItem('cartLocked') === 'true'
      if (wasLocked && !isCartLocked) {
        // Cart was locked but state is not set, restore lock
        setIsCartLocked(true)
      }
    }
  }, [isClient, isCartLocked])


  // Validate delivery details
  const validateDeliveryDetails = () => {
    if (deliveryDetails.fulfillmentType === 'pickup') {
      // For pickup, only phone is required
      if (!deliveryDetails.phone.trim()) {
        return { isValid: false, message: 'Please provide your phone number for pickup.' }
      }
    } else if (deliveryDetails.fulfillmentType === 'delivery') {
      // For delivery, customer name, phone and address are required
      if (!deliveryDetails.customerName.trim()) {
        return { isValid: false, message: 'Please provide your name for delivery.' }
      }
      if (!deliveryDetails.phone.trim()) {
        return { isValid: false, message: 'Please provide your phone number for delivery.' }
      }
      if (!deliveryDetails.address.trim()) {
        return { isValid: false, message: 'Please provide your delivery address.' }
      }
    }
    return { isValid: true, message: '' }
  }

  // Generate unique cart ID
  const generateCartId = () => {
    return `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Calculate payment amounts
  const calculatePaymentAmounts = () => {
    const deliveryCost = deliveryDetails.fulfillmentType === 'pickup' ? 0 : (deliveryDetails.deliveryOption === 'express' ? 300 : 0)
    const finalTotal = totalAmount + deliveryCost
    const depositAmount = Math.round(finalTotal * 0.2) // 20% deposit
    const remainingAmount = finalTotal - depositAmount
    
    return { finalTotal, depositAmount, remainingAmount, deliveryCost }
  }

  // Initiate M-Pesa deposit payment
  const handleMpesaDeposit = async () => {
    if (!mpesaPayment.phoneNumber.trim()) {
      setMpesaPayment(prev => ({
        ...prev,
        paymentStatus: 'failed',
        errorMessage: 'Please enter your M-Pesa phone number'
      }))
      return
    }

    const { finalTotal, depositAmount } = calculatePaymentAmounts()
    const cartId = generateCartId()

    setMpesaPayment(prev => ({
      ...prev,
      isProcessing: true,
      paymentStatus: 'processing',
      errorMessage: null,
      depositAmount
    }))

    try {
      console.log('Initiating M-Pesa deposit payment...')
      
      const response = await fetch('/api/mpesa/initiate-deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: mpesaPayment.phoneNumber,
          cartTotal: finalTotal,
          cartId: cartId
        })
      })

      const data = await response.json()
      console.log('M-Pesa API Response:', data)

      if (response.ok && data.success) {
        // STK Push sent successfully
        setMpesaPayment(prev => ({
          ...prev,
          checkoutRequestId: data.checkoutRequestId,
          merchantRequestId: data.merchantRequestId,
          paymentStatus: 'processing',
          errorMessage: null
        }))
        
        console.log('STK Push sent successfully!')
        
        // Start polling for payment status IMMEDIATELY
        setTimeout(() => {
          pollPaymentStatus(data.checkoutRequestId)
        }, 1000) // Reduced from 3 seconds to 1 second
        
      } else {
        // Handle error
        setMpesaPayment(prev => ({
          ...prev,
          isProcessing: false,
          paymentStatus: 'failed',
          errorMessage: data.error || 'Failed to initiate payment',
          depositPaid: false
        }))
      }

    } catch (error) {
      console.error('Payment request failed:', error)
      setMpesaPayment(prev => ({
        ...prev,
        isProcessing: false,
        paymentStatus: 'failed',
        errorMessage: 'Network error. Please check your connection and try again.',
        depositPaid: false
      }))
    }
  }

  // Poll payment status - OPTIMIZED FOR FASTER DETECTION
  const pollPaymentStatus = async (checkoutRequestId) => {
    let attempts = 0
    const maxAttempts = 60 // Poll for 2 minutes total
    let pollInterval = 2000 // Start with 2 second intervals

    console.log('Starting payment status polling...')

    const poll = async () => {
      try {
        const response = await fetch(`/api/mpesa/payment-callback?checkoutRequestId=${checkoutRequestId}`)
        const data = await response.json()

        console.log(`Status check ${attempts + 1}/${maxAttempts}:`, data)

        if (data.success && data.found && data.data) {
          const result = data.data
          
          if (result.status === 'success' && result.resultCode === 0) {
            console.log('Payment confirmed successfully!')
            setMpesaPayment(prev => ({
              ...prev,
              isProcessing: false,
              paymentStatus: 'success',
              depositPaid: true,
              errorMessage: null
            }))
            setIsCartLocked(true)
            
            return
          } else if (result.status === 'failed') {
            console.log('❌ Payment failed:', result.resultDesc)
            setMpesaPayment(prev => ({
              ...prev,
              isProcessing: false,
              paymentStatus: 'failed',
              errorMessage: result.resultDesc || 'Payment was not completed successfully.',
              depositPaid: false
            }))
            return
          }
        }

        // Continue polling with adaptive intervals
        attempts++
        if (attempts < maxAttempts) {
          // Increase interval gradually: 2s -> 3s -> 5s
          if (attempts > 10) pollInterval = 3000
          if (attempts > 20) pollInterval = 5000
          
          setTimeout(poll, pollInterval)
        } else {
          // Timeout reached
          setMpesaPayment(prev => ({
            ...prev,
            isProcessing: false,
            paymentStatus: 'timeout',
            errorMessage: 'Payment verification timed out. Use "Check Payment Status" to verify manually.'
          }))
        }

      } catch (error) {
        console.error('Status polling error:', error)
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(poll, pollInterval)
        } else {
          setMpesaPayment(prev => ({
            ...prev,
            isProcessing: false,
            paymentStatus: 'timeout',
            errorMessage: 'Unable to verify payment status. Please try again.'
          }))
        }
      }
    }

    // Start polling immediately (no delay)
    poll()
  }

  // Manual payment status check
  const checkPaymentStatus = async (checkoutRequestId) => {
    if (!checkoutRequestId) {
      console.error('No checkout request ID available')
      setMpesaPayment(prev => ({
        ...prev,
        errorMessage: 'No payment request found to check'
      }))
      return
    }

    console.log('🔍 Manually checking payment status for:', checkoutRequestId)

    setMpesaPayment(prev => ({
      ...prev,
      isProcessing: true,
      paymentStatus: 'processing',
      errorMessage: 'Checking payment status...'
    }))

    try {
      const response = await fetch(`/api/mpesa/payment-callback?checkoutRequestId=${checkoutRequestId}`)
      const data = await response.json()

      console.log('📊 Manual status check response:', data)

      if (data.success && data.found && data.data) {
        const result = data.data
        
        if (result.status === 'success' && result.resultCode === 0) {
          console.log('✅ Payment confirmed via manual check!')
          setMpesaPayment(prev => ({
            ...prev,
            isProcessing: false,
            paymentStatus: 'success',
            depositPaid: true,
            errorMessage: null
          }))
          setIsCartLocked(true)
          
          // Show success message
          alert('✅ Payment confirmed! Your cart is now locked and ready for WhatsApp checkout.')
          
        } else if (result.status === 'failed') {
          console.log('❌ Payment failed via manual check:', result.resultDesc)
          setMpesaPayment(prev => ({
            ...prev,
            isProcessing: false,
            paymentStatus: 'failed',
            errorMessage: result.resultDesc || 'Payment was not completed successfully.',
            depositPaid: false
          }))
        }
      } else {
        console.log('⏳ No payment result found yet, starting polling...')
        // No result yet, start polling
        pollPaymentStatus(checkoutRequestId)
      }

    } catch (error) {
      console.error('Manual status check failed:', error)
      setMpesaPayment(prev => ({
        ...prev,
        isProcessing: false,
        paymentStatus: 'failed',
        errorMessage: 'Unable to check payment status. Please try again.'
      }))
    }
  }

  // Generate WhatsApp message
  const generateWhatsAppMessage = () => {
    const { finalTotal, depositAmount, remainingAmount, deliveryCost } = calculatePaymentAmounts()
    
    let message = `🛒 *NEW ORDER REQUEST*\n\n`
    
    // Order items
    message += `📦 *ORDER DETAILS:*\n`
    list.forEach((item, index) => {
      message += `${index + 1}. ${item.name} (${item.condition || 'N/A'})\n`
      message += `   Qty: ${item.qty} × Ksh ${item.price.toLocaleString('en-KE')} = Ksh ${(item.qty * item.price).toLocaleString('en-KE')}\n`
    })
    
    // Payment summary
    message += `\n💰 *PAYMENT SUMMARY:*\n`
    message += `Subtotal: Ksh ${totalAmount.toLocaleString('en-KE')}\n`
    if (deliveryCost > 0) {
      message += `Delivery: Ksh ${deliveryCost.toLocaleString('en-KE')}\n`
    }
    message += `*Total: Ksh ${finalTotal.toLocaleString('en-KE')}*\n\n`
    
    // Deposit payment confirmation
    if (mpesaPayment.depositPaid) {
      message += `✅ *DEPOSIT PAYMENT CONFIRMED*\n`
      message += `Deposit Paid: Ksh ${depositAmount.toLocaleString('en-KE')} (20%)\n`
      message += `Remaining Balance: Ksh ${remainingAmount.toLocaleString('en-KE')}\n`
      message += `Payment Method: M-Pesa\n\n`
    }
    
    // Customer details
    if (deliveryDetails.fulfillmentType === 'pickup') {
      message += `🏪 *PICKUP DETAILS:*\n`
      message += `Method: Store Pickup\n`
      message += `Contact: ${deliveryDetails.phone}\n`
      message += `Note: Please bring this order confirmation when picking up\n`
    } else {
      message += `🚚 *DELIVERY DETAILS:*\n`
      message += `Name: ${deliveryDetails.customerName}\n`
      message += `Address: ${deliveryDetails.address}\n`
      message += `Phone: ${deliveryDetails.phone}\n`
      if (deliveryDetails.altPhone) {
        message += `Alt Phone: ${deliveryDetails.altPhone}\n`
      }
      message += `Delivery Option: ${deliveryDetails.deliveryOption === 'express' ? 'Express (Same day)' : 'Standard (2-3 days)'}\n`
      if (deliveryDetails.instructions) {
        message += `Instructions: ${deliveryDetails.instructions}\n`
      }
    }
    
    message += `\n🕒 *Order Time:* ${new Date().toLocaleString('en-KE')}`
    
    return message
  }

  // Handle checkout button click
  const handleCheckout = () => {
    // Check if deposit is paid
    if (!mpesaPayment.depositPaid) {
      alert('Please pay the 20% deposit first to proceed with your order.')
      return
    }

    const validation = validateDeliveryDetails()
    if (!validation.isValid) {
      alert(validation.message)
      return
    }
    
    // Generate WhatsApp message and redirect
    const message = generateWhatsAppMessage()
    const whatsappUrl = `https://wa.me/254718176584?text=${encodeURIComponent(message)}`
    
    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank')
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



  return (
    <>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
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
            <h2 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 700, color: '#007bff' }}>🛒 STEP 1: Review Your Cart Items</h2>
            
            {/* Cart Lock Status */}
            {isCartLocked && (
              <div style={{ 
                background: 'rgba(40, 167, 69, 0.1)', 
                border: '2px solid #28a745', 
                borderRadius: 8, 
                padding: 16,
                marginBottom: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 600, color: '#28a745', marginBottom: 8 }}>
                  🔒 Cart Protected - Deposit Paid
                </div>
                <div style={{ fontSize: 14, color: 'var(--muted)' }}>
                  Your cart is now locked and protected. Items cannot be removed or modified because you have successfully paid the 20% deposit. 
                  This ensures your order is secured and ready for WhatsApp checkout.
                </div>
              </div>
            )}
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
                          if (!isCartLocked) {
                            setClickedRemoveItems(prev => new Set([...prev, it.id]))
                            removeItem(it.id)
                          }
                        }} 
                        disabled={isCartLocked}
                        aria-label={`Remove ${it.name}`} 
                        style={{ 
                          fontSize: 11, 
                          padding: '2px 6px',
                          color: isCartLocked ? 'rgba(255, 255, 255, 0.3)' : (clickedRemoveItems.has(it.id) ? 'red' : 'inherit'),
                          cursor: isCartLocked ? 'not-allowed' : 'pointer',
                          opacity: isCartLocked ? 0.5 : 1
                        }}
                      >
                        {isCartLocked ? '🔒' : 'Remove'}
                      </button>
                    </div>
                    <div style={{ flex: 1 }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'blue', marginTop: '-4px' }}>Qty:</span>
                        <QuantitySelector
                          quantity={it.qty}
                          maxQuantity={max}
                          onQuantityChange={isCartLocked ? () => {} : (newQty) => setQty(it.id, newQty)}
                          disabled={isCartLocked}
                        />
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'green' }}>Ksh {Number(lineTotal).toLocaleString('en-KE')}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </section>

          {/* Delivery Options */}
          <section style={{ 
            border: '1px solid #253049', 
            borderRadius: 8, 
            padding: 16, 
            backgroundColor: 'rgba(42, 51, 66, 0.05)',
            position: 'relative',
            zIndex: 2
          }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 700, color: '#007bff' }}>📦 STEP 2: Choose Delivery Options</h2>
            
            {/* Pickup vs Delivery Choice */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--text)' }}>
                How would you like to receive your order?
              </label>
              <div style={{ display: 'flex', gap: 16, width: '100%' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 12, 
                  cursor: 'pointer',
                  padding: '12px 16px',
                  border: `2px solid ${deliveryDetails.fulfillmentType === 'pickup' ? '#007bff' : '#2a3342'}`,
                  borderRadius: 8,
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
                    <div style={{ fontSize: 14, fontWeight: 600 }}>🏪 Shop Pickup</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>Free - Pick up from our store</div>
                  </div>
                </label>
                
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 12, 
                  cursor: 'pointer',
                  padding: '12px 16px',
                  border: `2px solid ${deliveryDetails.fulfillmentType === 'delivery' ? '#007bff' : '#2a3342'}`,
                  borderRadius: 8,
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
                    <div style={{ fontSize: 14, fontWeight: 600 }}>🚚 Home Delivery</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>Delivered to your address</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Contact Information - Only shown for pickup */}
            {deliveryDetails.fulfillmentType === 'pickup' && (
              <div style={{ marginBottom: 0 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--text)' }}>
                  Contact Phone Number *
                </label>
                <input 
                  type="tel" 
                  value={deliveryDetails.phone}
                  onChange={(e) => setDeliveryDetails(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="e.g., +254 700 000 000"
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px', 
                    borderRadius: 8, 
                    border: '1px solid #2a3342', 
                    background: 'transparent', 
                    color: 'var(--text)', 
                    fontSize: 14,
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            )}

            {/* Delivery Details - Only shown when delivery is selected */}
            {deliveryDetails.fulfillmentType === 'delivery' && (
              <div style={{ display: 'grid', gap: 20, width: '100%', boxSizing: 'border-box' }}>
                {/* Customer Name */}
                <div style={{ width: '100%', position: 'relative' }}>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--text)' }}>
                    Customer Name *
                  </label>
                  <input 
                    type="text" 
                    value={deliveryDetails.customerName}
                    onChange={(e) => setDeliveryDetails(prev => ({ ...prev, customerName: e.target.value }))}
                    placeholder="Enter your full name"
                    style={{ 
                      width: '100%', 
                      padding: '12px 16px', 
                      borderRadius: 8, 
                      border: '1px solid #2a3342', 
                      background: 'transparent', 
                      color: 'var(--text)', 
                      fontSize: 14,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Delivery Address */}
                <div style={{ width: '100%', position: 'relative' }}>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--text)' }}>
                    Delivery Address *
                  </label>
                  <textarea 
                    value={deliveryDetails.address}
                    onChange={(e) => setDeliveryDetails(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Enter your full delivery address including building name, floor, and any landmarks"
                    style={{ 
                      width: '100%', 
                      minHeight: 80, 
                      padding: '12px 16px', 
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
                        padding: '12px 16px', 
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
                        padding: '12px 16px', 
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
                      minHeight: 80, 
                      padding: '12px 16px', 
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
                  padding: 16 
                }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#007bff' }}>
                    📦 Delivery Information
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: 'var(--muted)' }}>
                    <li>Standard delivery within Nairobi: 2-3 business days (Free)</li>
                    <li>Express delivery available for same-day delivery (Ksh 300)</li>
                    <li>Delivery outside Nairobi: 3-5 business days (charges apply)</li>
                    <li>All items are carefully packaged and insured during transit</li>
                  </ul>
                </div>
              </div>
            )}
          </section>

          {/* M-Pesa Deposit Payment Section */}
          <section style={{ 
            border: '3px solid #007bff', 
            borderRadius: 12, 
            padding: 20, 
            backgroundColor: 'rgba(0, 123, 255, 0.08)',
            position: 'relative',
            zIndex: 3,
            boxShadow: '0 4px 20px rgba(0, 123, 255, 0.15)'
          }}>
            <div style={{ marginBottom: 20, textAlign: 'center' }}>
              <h2 style={{ margin: '0 0 12px', fontSize: 24, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#007bff' }}>
                💳 STEP 3: Pay 20% Deposit via M-Pesa
              </h2>
              <p style={{ margin: 0, fontSize: 16, color: 'var(--text)', lineHeight: 1.5, fontWeight: 500 }}>
                🔒 <strong>Required:</strong> Pay a 20% deposit to secure your order and unlock WhatsApp checkout.
                <br />
                The remaining balance will be collected upon delivery/pickup.
              </p>
            </div>
            
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
                      <span>Deposit Required (20%):</span>
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
                        mpesaPayment.paymentStatus === 'timeout' ? 'rgba(255, 193, 7, 0.1)' :
                        mpesaPayment.paymentStatus === 'processing' ? 'rgba(0, 123, 255, 0.1)' :
                        'rgba(0, 123, 255, 0.1)',
                      border: `1px solid ${
                        mpesaPayment.paymentStatus === 'success' ? 'rgba(40, 167, 69, 0.3)' :
                        mpesaPayment.paymentStatus === 'failed' ? 'rgba(220, 53, 69, 0.3)' :
                        mpesaPayment.paymentStatus === 'timeout' ? 'rgba(255, 193, 7, 0.3)' :
                        mpesaPayment.paymentStatus === 'processing' ? 'rgba(0, 123, 255, 0.3)' :
                        'rgba(0, 123, 255, 0.3)'
                      }`
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600 }}>
                        {mpesaPayment.paymentStatus === 'success' && '✅ Deposit Payment Successful!'}
                        {mpesaPayment.paymentStatus === 'failed' && '❌ Payment Failed'}
                        {mpesaPayment.paymentStatus === 'timeout' && '⏱️ Payment Timeout'}
                        {mpesaPayment.paymentStatus === 'processing' && '⏳ Processing Payment...'}
                      </div>
                      {mpesaPayment.paymentStatus === 'success' && (
                        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--muted)' }}>
                          Your 20% deposit has been received. You can now proceed with your order via WhatsApp.
                        </p>
                      )}
                      {mpesaPayment.paymentStatus === 'processing' && (
                        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--muted)' }}>
                          Please check your phone and enter your M-Pesa PIN to complete the payment.
                        </p>
                      )}
                      {(mpesaPayment.paymentStatus === 'failed' || mpesaPayment.paymentStatus === 'timeout') && (
                        <div>
                          <p style={{ margin: '4px 0 8px', fontSize: 12, color: 'var(--muted)' }}>
                            {mpesaPayment.errorMessage || 'Payment was not completed. Please try again.'}
                          </p>
                          <button 
                            onClick={() => setMpesaPayment(prev => ({ 
                              ...prev, 
                              paymentStatus: null, 
                              isProcessing: false,
                              errorMessage: null
                            }))}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 4,
                              border: '1px solid #007bff',
                              background: 'transparent',
                              color: '#007bff',
                              fontSize: 12,
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            🔄 Try Again
                          </button>
                        </div>
                      )}
                    </div>
                  )}


                  {/* Payment Form - Always show if deposit not paid */}
                  {!mpesaPayment.depositPaid && (
                    <div style={{ 
                      background: 'rgba(0, 123, 255, 0.1)', 
                      border: '2px solid #007bff', 
                      borderRadius: 8, 
                      padding: 20,
                      marginBottom: 16
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <span style={{ fontSize: 24 }}>💳</span>
                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#007bff' }}>
                          Pay 20% Deposit to Continue
                        </h3>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--text)' }}>
                            Enter your M-Pesa phone number to pay deposit:
                          </label>
                          <input 
                            type="tel" 
                            value={mpesaPayment.phoneNumber}
                            onChange={(e) => setMpesaPayment(prev => ({ ...prev, phoneNumber: e.target.value }))}
                            placeholder="Enter phone number (e.g., 0700000000)"
                            disabled={mpesaPayment.isProcessing}
                            style={{ 
                              width: '100%', 
                              padding: '14px 16px', 
                              borderRadius: 8, 
                              border: '2px solid #007bff', 
                              background: mpesaPayment.isProcessing ? 'rgba(42, 51, 66, 0.1)' : 'white', 
                              color: '#333', 
                              fontSize: 16,
                              boxSizing: 'border-box',
                              fontWeight: 500
                            }}
                          />
                          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                            Supported formats: 0700000000, 254700000000, +254700000000
                          </div>
                        </div>
                        
                        <button 
                          onClick={handleMpesaDeposit}
                          disabled={mpesaPayment.isProcessing || !mpesaPayment.phoneNumber.trim()}
                          style={{ 
                            width: '100%',
                            padding: '16px 20px', 
                            borderRadius: 8, 
                            border: 'none',
                            background: mpesaPayment.isProcessing || !mpesaPayment.phoneNumber.trim() ? 
                              'rgba(0, 123, 255, 0.3)' : '#007bff',
                            color: 'white', 
                            fontSize: 16, 
                            fontWeight: 700,
                            cursor: mpesaPayment.isProcessing || !mpesaPayment.phoneNumber.trim() ? 
                              'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 10,
                            transition: 'all 0.2s',
                            boxShadow: mpesaPayment.isProcessing || !mpesaPayment.phoneNumber.trim() ? 
                              'none' : '0 4px 12px rgba(0, 123, 255, 0.3)'
                          }}
                        >
                          {mpesaPayment.isProcessing ? (
                            <>
                              <span style={{ 
                                width: 20, 
                                height: 20, 
                                border: '3px solid rgba(255,255,255,0.3)', 
                                borderTop: '3px solid white', 
                                borderRadius: '50%', 
                                animation: 'spin 1s linear infinite' 
                              }}></span>
                              Processing Payment...
                            </>
                          ) : (
                            <>
                              💳 Pay Deposit - Ksh {Number(depositAmount).toLocaleString('en-KE')}
                            </>
                          )}
                        </button>
                        
                        <div style={{ 
                          background: 'rgba(255, 193, 7, 0.1)', 
                          border: '1px solid rgba(255, 193, 7, 0.3)', 
                          borderRadius: 6, 
                          padding: 12,
                          fontSize: 13,
                          color: 'var(--muted)'
                        }}>
                          <strong>💡 How it works:</strong>
                          <br />
                          1. Enter your M-Pesa phone number above
                          <br />
                          2. Click "Pay Deposit" to receive STK Push on your phone
                          <br />
                          3. Enter your M-Pesa PIN to complete payment
                          <br />
                          4. Once paid, your cart will be locked and WhatsApp checkout unlocked
                        </div>
                      </div>
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
                        Your cart is now locked. You can proceed to send your order via WhatsApp.
                        <br />
                        Remaining balance: Ksh {Number(remainingAmount).toLocaleString('en-KE')}
                      </div>
                    </div>
                  )}

                  {/* Manual Status Check Button */}
                  {mpesaPayment.checkoutRequestId && !mpesaPayment.depositPaid && !mpesaPayment.isProcessing && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button 
                          onClick={() => checkPaymentStatus(mpesaPayment.checkoutRequestId)}
                          style={{
                            padding: '8px 16px',
                            fontSize: 12,
                            background: '#17a2b8',
                            color: 'white',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                            flex: 1
                          }}
                        >
                          🔍 Check Payment Status
                        </button>
                        <button 
                          onClick={() => {
                            console.log('🔧 Debug Info:')
                            console.log('- Checkout Request ID:', mpesaPayment.checkoutRequestId)
                            console.log('- Payment Status:', mpesaPayment.paymentStatus)
                            console.log('- Deposit Paid:', mpesaPayment.depositPaid)
                            console.log('- Cart Locked:', isCartLocked)
                            console.log('- Error Message:', mpesaPayment.errorMessage)
                            console.log('- Full Payment State:', mpesaPayment)
                            alert('Debug info logged to console. Press F12 to view.')
                          }}
                          style={{
                            padding: '8px 12px',
                            fontSize: 12,
                            background: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer'
                          }}
                          title="Log debug information to console"
                        >
                          🔧
                        </button>
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
            <h2 style={{ margin: '0 0 12px', fontSize: 20, fontWeight: 700, color: '#007bff' }}>📋 STEP 4: Order Summary & Checkout</h2>
            {(() => {
              const deliveryCost = deliveryDetails.fulfillmentType === 'pickup' ? 0 : (deliveryDetails.deliveryOption === 'express' ? 300 : 0)
              const finalTotal = totalAmount + deliveryCost
              
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
                </>
              )
            })()}
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <input type="text" placeholder="Promo Code" style={{ flex: 1, borderRadius: 6, border: '1px solid #2a3342', background: 'transparent', color: 'var(--text)', padding: '6px 8px', fontSize: 13 }} />
              <button className="btn btn-small" style={{ fontSize: 12, padding: '6px 8px' }}>Apply</button>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <button 
                className="btn btn-primary"
                onClick={handleCheckout}
                disabled={!mpesaPayment.depositPaid}
                style={{ 
                  flex: 1, 
                  textAlign: 'center', 
                  fontSize: 13, 
                  padding: '8px 12px',
                  background: mpesaPayment.depositPaid ? '#25D366' : 'rgba(37, 211, 102, 0.3)',
                  color: mpesaPayment.depositPaid ? 'white' : 'rgba(255, 255, 255, 0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  cursor: mpesaPayment.depositPaid ? 'pointer' : 'not-allowed',
                  opacity: mpesaPayment.depositPaid ? 1 : 0.6
                }}
              >
                {mpesaPayment.depositPaid ? '📱 Send Order via WhatsApp' : '🔒 Pay Deposit to Unlock'}
              </button>
              <button 
                className="btn" 
                onClick={isCartLocked ? () => {} : clear} 
                disabled={isCartLocked}
                style={{ 
                  fontSize: 12, 
                  padding: '8px 10px',
                  opacity: isCartLocked ? 0.5 : 1,
                  cursor: isCartLocked ? 'not-allowed' : 'pointer'
                }}
              >
                {isCartLocked ? '🔒 Locked' : 'Clear Cart'}
              </button>
            </div>
          </section>
        </div>
      )}

      </div>
    </>
  )
}
