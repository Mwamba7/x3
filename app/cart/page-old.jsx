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
  const { items, setQty, removeItem, clear, totalAmount, totalCount, maxQtyForCondition, isCartLocked: contextCartLocked, lockCart, unlockCart } = useCart()
  
  // Convert items object to list array for compatibility
  const list = Object.values(items || {})
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
  const [whatsappClickTime, setWhatsappClickTime] = useState(null)
  const [autoClearTimer, setAutoClearTimer] = useState(null)
  const [currentTime, setCurrentTime] = useState(Date.now())
  const [showCartProtectionPopup, setShowCartProtectionPopup] = useState(false)
  const [showDeliveryProtectionPopup, setShowDeliveryProtectionPopup] = useState(false)

  // Ensure we're on the client side before accessing localStorage
  useEffect(() => {
    setIsClient(true)
    
    // Load saved payment state from localStorage
    const savedPayment = localStorage.getItem('mpesaPayment')
    const savedDelivery = localStorage.getItem('deliveryDetails')
    const savedWhatsappTime = localStorage.getItem('whatsappClickTime')
    
    if (savedPayment) {
      try {
        const parsedPayment = JSON.parse(savedPayment)
        setMpesaPayment(parsedPayment)
        setIsCartLocked(parsedPayment.depositPaid)
        
        // Sync with context cart lock state
        if (parsedPayment.depositPaid && !contextCartLocked) {
          lockCart(true)
        }
        
        // If there's a pending payment, check its status silently
        if (parsedPayment.checkoutRequestId && !parsedPayment.depositPaid) {
          // Only check if payment is in processing or pending state
          if (parsedPayment.paymentStatus === 'processing' || parsedPayment.paymentStatus === 'pending') {
            setTimeout(() => {
              checkPaymentStatusSilently(parsedPayment.checkoutRequestId)
            }, 2000)
          }
          // If payment is stuck in processing state without a valid status, reset it
          else if (parsedPayment.isProcessing && !parsedPayment.paymentStatus) {
            setMpesaPayment(prev => ({
              ...prev,
              isProcessing: false,
              paymentStatus: null,
              errorMessage: null
            }))
          }
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
    
    // Load WhatsApp click time and set up auto-clear
    if (savedWhatsappTime) {
      try {
        const clickTime = parseInt(savedWhatsappTime)
        
        // Validate the timestamp (should be within last 24 hours)
        const now = Date.now()
        const twentyFourHours = 24 * 60 * 60 * 1000
        const timeElapsed = now - clickTime
        
        // If timestamp is too old or invalid, remove it
        if (timeElapsed > twentyFourHours || clickTime > now || isNaN(clickTime)) {
          console.log('🧹 Removing invalid/old WhatsApp timestamp')
          localStorage.removeItem('whatsappClickTime')
          return
        }
        
        setWhatsappClickTime(clickTime)
        
        // Check if 15 minutes have passed
        const fifteenMinutes = 15 * 60 * 1000 // 15 minutes in milliseconds
        
        console.log(`⏰ WhatsApp timer check: ${Math.round(timeElapsed / 1000 / 60)} minutes elapsed`)
        
        if (timeElapsed >= fifteenMinutes) {
          // Check if deposit has been paid before auto-clearing
          const savedPayment = localStorage.getItem('mpesaPayment')
          let shouldClear = true
          
          if (savedPayment) {
            try {
              const paymentData = JSON.parse(savedPayment)
              if (paymentData.depositPaid === true) {
                console.log('🔒 Deposit paid - skipping auto-clear')
                shouldClear = false
              }
            } catch (error) {
              console.error('Error checking payment status for auto-clear:', error)
            }
          }
          
          // Also check if cart is empty - don't clear an empty cart
          const currentCart = localStorage.getItem('cart:v1')
          if (currentCart) {
            try {
              const cartData = JSON.parse(currentCart)
              const itemCount = Object.keys(cartData).length
              if (itemCount === 0) {
                console.log('🛒 Cart is already empty - skipping auto-clear')
                shouldClear = false
              }
            } catch (error) {
              console.error('Error checking cart contents:', error)
            }
          } else {
            console.log('🛒 No cart data found - skipping auto-clear')
            shouldClear = false
          }
          
          if (shouldClear) {
            // EXTRA PROTECTION: Double-check cart value before auto-clearing
            const currentCart = localStorage.getItem('cart:v1')
            let cartValue = 0
            if (currentCart) {
              try {
                const cartData = JSON.parse(currentCart)
                cartValue = Object.values(cartData).reduce((total, item) => {
                  return total + ((item.qty || 0) * (item.price || 0))
                }, 0)
              } catch (error) {
                console.error('Error calculating cart value:', error)
              }
            }
            
            // Don't auto-clear high-value carts (over 2000 KSh)
            if (cartValue > 2000) {
              console.log(`🛡️ PROTECTED: High-value cart (Ksh ${cartValue.toLocaleString()}) - skipping auto-clear`)
              localStorage.removeItem('whatsappClickTime')
            } else {
              console.log('🕐 Auto-clearing cart - 15 minutes have passed since WhatsApp click')
              clearCart(true) // Force override for auto-clear
            }
          } else {
            console.log('💰 Cart protected from auto-clear (deposit paid or cart empty)')
            // Clear the WhatsApp timer since it's no longer needed
            localStorage.removeItem('whatsappClickTime')
          }
        } else {
          // Set timer for remaining time, but check deposit status first
          const savedPayment = localStorage.getItem('mpesaPayment')
          let shouldSetTimer = true
          
          if (savedPayment) {
            try {
              const paymentData = JSON.parse(savedPayment)
              if (paymentData.depositPaid === true) {
                console.log('🔒 Deposit paid - canceling auto-clear timer')
                shouldSetTimer = false
                localStorage.removeItem('whatsappClickTime')
              }
            } catch (error) {
              console.error('Error checking payment status for timer:', error)
            }
          }
          
          if (shouldSetTimer) {
            const remainingTime = fifteenMinutes - timeElapsed
            console.log(`⏰ Auto-clear timer set for ${Math.round(remainingTime / 1000 / 60)} minutes`)
            const timerId = setTimeout(() => {
              // Double-check deposit status before clearing
              const currentPayment = localStorage.getItem('mpesaPayment')
              let shouldClearNow = true
              
              if (currentPayment) {
                try {
                  const paymentData = JSON.parse(currentPayment)
                  if (paymentData.depositPaid === true) {
                    console.log('🔒 Deposit paid - canceling auto-clear at execution time')
                    shouldClearNow = false
                  }
                } catch (error) {
                  console.error('Error checking payment status at clear time:', error)
                }
              }
              
              if (shouldClearNow) {
                // EXTRA PROTECTION: Check cart value before clearing
                const currentCart = localStorage.getItem('cart:v1')
                let cartValue = 0
                if (currentCart) {
                  try {
                    const cartData = JSON.parse(currentCart)
                    cartValue = Object.values(cartData).reduce((total, item) => {
                      return total + ((item.qty || 0) * (item.price || 0))
                    }, 0)
                  } catch (error) {
                    console.error('Error calculating cart value for timer:', error)
                  }
                }
                
                if (cartValue > 2000) {
                  console.log(`🛡️ PROTECTED: High-value cart (Ksh ${cartValue.toLocaleString()}) - timer canceled`)
                } else {
                  console.log('🕐 Auto-clearing cart - 15 minutes elapsed')
                  clearCart(true) // Force override for timer
                }
              } else {
                console.log('💰 Deposit paid - auto-clear canceled')
              }
            }, remainingTime)
            setAutoClearTimer(timerId)
          }
        }
      } catch (error) {
        console.error('Error loading WhatsApp click time:', error)
      }
    }
  }, [])

  // Monitor payment status and cancel auto-clear timer when deposit is paid
  useEffect(() => {
    if (isClient) {
      const savedPayment = localStorage.getItem('mpesaPayment')
      if (savedPayment) {
        try {
          const paymentData = JSON.parse(savedPayment)
          if (paymentData.depositPaid === true && autoClearTimer) {
            console.log('🔒 Deposit detected - canceling auto-clear timer')
            clearTimeout(autoClearTimer)
            setAutoClearTimer(null)
            localStorage.removeItem('whatsappClickTime')
            setWhatsappClickTime(null)
          }
        } catch (error) {
          console.error('Error checking payment status for timer cancellation:', error)
        }
      }
    }
  }, [isClient, autoClearTimer, mpesaPayment.depositPaid])

  // Cleanup effect to handle stuck processing states
  useEffect(() => {
    if (isClient && mpesaPayment.isProcessing && !mpesaPayment.checkoutRequestId) {
      // If we're in processing state but have no checkout ID, reset
      console.log('🔧 Cleaning up stuck processing state')
      setMpesaPayment(prev => ({
        ...prev,
        isProcessing: false,
        paymentStatus: null,
        errorMessage: null
      }))
    }
  }, [isClient, mpesaPayment.isProcessing, mpesaPayment.checkoutRequestId])

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

  // Save WhatsApp click time to localStorage
  useEffect(() => {
    if (isClient && whatsappClickTime) {
      localStorage.setItem('whatsappClickTime', whatsappClickTime.toString())
    }
  }, [whatsappClickTime, isClient])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoClearTimer) {
        clearTimeout(autoClearTimer)
      }
    }
  }, [autoClearTimer])

  // Update countdown timer every minute
  useEffect(() => {
    if (!whatsappClickTime) return

    const interval = setInterval(() => {
      const now = Date.now()
      const fifteenMinutes = 15 * 60 * 1000
      const timeElapsed = now - whatsappClickTime
      
      setCurrentTime(now) // Update current time to trigger re-render
      
      if (timeElapsed >= fifteenMinutes) {
        // Time's up, clear the interval
        clearInterval(interval)
      }
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [whatsappClickTime])

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

  // Clear cart function with enhanced protection
  const clearCart = (forceOverride = false) => {
    console.log('🧹 Starting cart clear process...', { forceOverride })
    
    try {
      // PROTECTION 1: Check if deposit has been paid
      const savedPayment = localStorage.getItem('mpesaPayment')
      if (savedPayment && !forceOverride) {
        try {
          const paymentData = JSON.parse(savedPayment)
          if (paymentData.depositPaid === true) {
            console.log('🔒 BLOCKED: Cannot clear cart - deposit has been paid')
            alert('⚠️ Cannot clear cart: Deposit has been paid. Please complete your order or contact support.')
            return false
          }
        } catch (error) {
          console.error('Error checking payment status for clear protection:', error)
        }
      }
      
      // PROTECTION 2: Check if cart is locked
      if (isCartLocked && !forceOverride) {
        console.log('🔒 BLOCKED: Cannot clear cart - cart is locked')
        alert('⚠️ Cannot clear cart: Cart is locked. Please complete your order first.')
        return false
      }
      
      // PROTECTION 3: Check if cart has valuable items (high total)
      const currentTotal = totalAmount
      if (currentTotal > 5000 && !forceOverride) {
        const confirmClear = confirm(`⚠️ Your cart contains items worth Ksh ${Number(currentTotal).toLocaleString('en-KE')}. Are you sure you want to clear it?`)
        if (!confirmClear) {
          console.log('🛡️ BLOCKED: User canceled high-value cart clear')
          return false
        }
      }
      
      // Clear cart items
      console.log('📦 Clearing cart items...')
      const clearResult = clear(forceOverride)
      if (clearResult === false && !forceOverride) {
        console.log('❌ Cart clear was blocked by protection')
        return false
      }
      console.log('✅ Cart items cleared')
      
      // Reset M-Pesa payment state
      console.log('💳 Resetting M-Pesa payment state...')
      setMpesaPayment({
        isProcessing: false,
        paymentStatus: null,
        checkoutRequestId: null,
        merchantRequestId: null,
        depositPaid: false,
        errorMessage: null,
        phoneNumber: '',
        depositAmount: 0
      })
      console.log('✅ M-Pesa payment state reset')
      
      // Reset delivery details
      console.log('📋 Resetting delivery details...')
      setDeliveryDetails({
        fulfillmentType: 'pickup',
        customerName: '',
        address: '',
        phone: '',
        altPhone: '',
        deliveryOption: 'standard',
        instructions: ''
      })
      console.log('✅ Delivery details reset')
      
      // Reset cart lock
      console.log('🔓 Unlocking cart...')
      setIsCartLocked(false)
      unlockCart() // Unlock cart in context
      console.log('✅ Cart unlocked')
      
      // Reset WhatsApp click time
      console.log('📱 Clearing WhatsApp timer...')
      setWhatsappClickTime(null)
      
      // Clear timer
      if (autoClearTimer) {
        console.log('⏰ Clearing auto-clear timer...')
        clearTimeout(autoClearTimer)
        setAutoClearTimer(null)
        console.log('✅ Timer cleared')
      }
      
      // Clear localStorage
      if (isClient) {
        console.log('💾 Clearing localStorage...')
        localStorage.removeItem('mpesaPayment')
        localStorage.removeItem('deliveryDetails')
        localStorage.removeItem('whatsappClickTime')
        localStorage.removeItem('cartLocked')
        console.log('✅ localStorage cleared')
      }
      
      console.log('🎉 Cart clear process completed successfully!')
      
      // Show success message
      alert('✅ Cart cleared successfully! You can now start a new order.')
      return true
      
    } catch (error) {
      console.error('❌ Error during cart clear:', error)
      alert('⚠️ There was an error clearing the cart. Please refresh the page and try again.')
      return false
    }
  }

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

  // Initiate M-Pesa deposit payment with retry logic
  const handleMpesaDeposit = async (retryCount = 0) => {
    const maxRetries = 3
    const retryDelay = 5000 // 5 seconds between retries
    
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
      errorMessage: retryCount > 0 ? `Retrying... (Attempt ${retryCount + 1}/${maxRetries + 1})` : null,
      depositAmount
    }))

    try {
      console.log('🚀 Initiating M-Pesa deposit payment...')
      console.log('📱 Phone:', mpesaPayment.phoneNumber)
      console.log('💰 Total:', finalTotal)
      console.log('🆔 Cart ID:', cartId)
      console.log('💳 Deposit Amount:', depositAmount)
      
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

      console.log('📡 Response status:', response.status)
      console.log('📡 Response ok:', response.ok)
      
      const data = await response.json()
      console.log('📥 M-Pesa API Response:', data)
      
      // Check for specific error types
      if (!response.ok) {
        console.error('❌ HTTP Error:', response.status, response.statusText)
        console.error('❌ Error details:', data)
      }

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
        
        // Start ULTRA FAST polling IMMEDIATELY
        setTimeout(() => {
          pollPaymentStatus(data.checkoutRequestId)
        }, 200) // Start in just 0.2 seconds!
        
      } else {
        // Handle error with specific messages and retry logic
        let errorMessage = data.error || 'Failed to initiate payment'
        let shouldRetry = false
        
        // Check for "System is busy" error and retry
        if (data.error && (data.error.includes('System is busy') || data.error.includes('busy'))) {
          if (retryCount < maxRetries) {
            shouldRetry = true
            console.log(`⏳ System is busy, retrying in ${retryDelay/1000} seconds... (Attempt ${retryCount + 1}/${maxRetries})`)
            
            setMpesaPayment(prev => ({
              ...prev,
              isProcessing: true,
              errorMessage: `System is busy. Retrying in ${retryDelay/1000} seconds... (${retryCount + 1}/${maxRetries})`
            }))
            
            setTimeout(() => {
              handleMpesaDeposit(retryCount + 1)
            }, retryDelay)
            return
          } else {
            errorMessage = '⏰ M-Pesa system is currently busy. Please try again in a few minutes.'
          }
        }
        // Provide specific error messages for other common issues
        else if (data.error && data.error.includes('callback')) {
          errorMessage = '🌐 Callback URL issue. Please check if ngrok is running and .env is updated.'
        } else if (data.error && data.error.includes('phone')) {
          errorMessage = '📱 Invalid phone number format. Use: 0700000000 or 254700000000'
        } else if (data.error && data.error.includes('environment')) {
          errorMessage = '⚙️ M-Pesa configuration issue. Please check environment variables.'
        } else if (response.status === 500) {
          errorMessage = '🔧 Server error. Please check M-Pesa API configuration.'
        } else if (response.status === 400) {
          errorMessage = '📝 Invalid request data. Please check phone number and amount.'
        }
        
        console.error('💥 M-Pesa initiation failed:', errorMessage)
        
        if (!shouldRetry) {
          setMpesaPayment(prev => ({
            ...prev,
            isProcessing: false,
            paymentStatus: 'failed',
            errorMessage,
            depositPaid: false
          }))
        }
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

  // Poll payment status - ULTRA FAST DETECTION
  const pollPaymentStatus = async (checkoutRequestId) => {
    let attempts = 0
    const maxAttempts = 180 // Poll for 3 minutes total
    
    console.log('⚡ Starting ULTRA FAST payment polling...')

    const poll = async () => {
      try {
        const response = await fetch(`/api/mpesa/payment-callback?checkoutRequestId=${checkoutRequestId}`)
        const data = await response.json()

        console.log(`⚡ Ultra check ${attempts + 1}: ${data.found ? 'FOUND!' : 'waiting...'}`)

        if (data.success && data.found && data.data) {
          const result = data.data
          
          if (result.status === 'success' && result.resultCode === 0) {
            console.log('🎉 PAYMENT SUCCESS - DETECTED!')
            setMpesaPayment(prev => ({
              ...prev,
              isProcessing: false,
              paymentStatus: 'success',
              depositPaid: true,
              errorMessage: null
            }))
            setIsCartLocked(true)
            lockCart(true) // Lock cart in context
            
            // Show instant success message
            alert('✅ Payment successful! Cart locked.')
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

        // Dynamic polling intervals for better performance
        attempts++
        if (attempts < maxAttempts) {
          let nextInterval
          if (attempts <= 10) {
            nextInterval = 500 // First 10 attempts: every 0.5 seconds (ultra fast)
          } else if (attempts <= 30) {
            nextInterval = 1000 // Next 20 attempts: every 1 second (fast)
          } else if (attempts <= 60) {
            nextInterval = 2000 // Next 30 attempts: every 2 seconds (normal)
          } else {
            nextInterval = 5000 // Remaining attempts: every 5 seconds (slow)
          }
          
          // Update processing message with progress
          const elapsed = Math.round((attempts * (nextInterval / 1000)) / 60 * 100) / 100
          setMpesaPayment(prev => ({
            ...prev,
            errorMessage: `Checking payment... (${attempts}/${maxAttempts} - ${elapsed}min elapsed)`
          }))
          
          setTimeout(poll, nextInterval)
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
          // Use same dynamic interval logic for error retries
          let nextInterval = attempts <= 10 ? 500 : attempts <= 30 ? 1000 : 2000
          setTimeout(poll, nextInterval)
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

  // Silent payment status check (doesn't show processing state)
  const checkPaymentStatusSilently = async (checkoutRequestId) => {
    if (!checkoutRequestId) {
      return
    }

    try {
      // First, check our callback storage
      const response = await fetch(`/api/mpesa/payment-callback?checkoutRequestId=${checkoutRequestId}`)
      const data = await response.json()

      if (data.success && data.found && data.data) {
        const result = data.data
        
        if (result.status === 'success' && result.resultCode === 0) {
          console.log('✅ Payment confirmed via callback check!')
          setMpesaPayment(prev => ({
            ...prev,
            isProcessing: false,
            paymentStatus: 'success',
            depositPaid: true,
            errorMessage: null
          }))
          setIsCartLocked(true)
          lockCart(true) // Lock cart in context
          return
          
        } else if (result.status === 'failed') {
          console.log('❌ Payment failed via callback check:', result.resultDesc)
          setMpesaPayment(prev => ({
            ...prev,
            isProcessing: false,
            paymentStatus: 'failed',
            errorMessage: result.resultDesc || 'Payment failed'
          }))
          return
        }
      }
      
      // If no callback received, query Safaricom directly
      console.log('🔍 No callback found, querying Safaricom directly...')
      const directQueryResponse = await fetch('/api/mpesa/query-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkoutRequestId })
      })
      
      if (directQueryResponse.ok) {
        const queryData = await directQueryResponse.json()
        console.log('📥 Direct query result:', queryData)
        
        if (queryData.success && queryData.data) {
          const queryResult = queryData.data
          
          if (queryResult.ResultCode === '0') {
            console.log('✅ Payment confirmed via direct query!')
            setMpesaPayment(prev => ({
              ...prev,
              isProcessing: false,
              paymentStatus: 'success',
              depositPaid: true,
              errorMessage: null
            }))
            setIsCartLocked(true)
            lockCart(true) // Lock cart in context
            return
          } else if (queryResult.ResultCode === '1032') {
            console.log('❌ Payment cancelled by user')
            setMpesaPayment(prev => ({
              ...prev,
              isProcessing: false,
              paymentStatus: 'failed',
              errorMessage: 'Payment was cancelled'
            }))
            return
          } else if (queryResult.ResultCode === '1037') {
            console.log('⏳ Payment still pending - user hasn\'t completed')
            setMpesaPayment(prev => ({
              ...prev,
              isProcessing: false,
              paymentStatus: 'pending',
              errorMessage: 'Payment is still pending. Please complete the payment on your phone.'
            }))
            return
          }
        }
      }
      
      // If we reach here, payment status is unclear
      console.log('⏳ Payment status unclear, keeping as pending')
      setMpesaPayment(prev => ({
        ...prev,
        isProcessing: false,
        paymentStatus: 'pending',
        errorMessage: 'Payment status unclear. Please use "Check Payment Status" button.'
      }))
      
    } catch (error) {
      console.error('Silent payment status check error:', error)
      // On error, ensure we're not stuck in processing state
      setMpesaPayment(prev => ({
        ...prev,
        isProcessing: false,
        paymentStatus: 'pending',
        errorMessage: 'Unable to verify payment. Please use "Check Payment Status" button.'
      }))
    }
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
          lockCart(true) // Lock cart in context
          
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
    
    // Check if deposit has been paid before setting auto-clear timer
    const savedPayment = localStorage.getItem('mpesaPayment')
    let shouldSetTimer = true
    
    if (savedPayment) {
      try {
        const paymentData = JSON.parse(savedPayment)
        if (paymentData.depositPaid === true) {
          console.log('🔒 Deposit already paid - skipping auto-clear timer')
          shouldSetTimer = false
        }
      } catch (error) {
        console.error('Error checking payment status for WhatsApp timer:', error)
      }
    }
    
    if (shouldSetTimer) {
      // Track WhatsApp click time for auto-clear
      const clickTime = Date.now()
      setWhatsappClickTime(clickTime)
      
      // Set up auto-clear timer (15 minutes)
      const fifteenMinutes = 15 * 60 * 1000 // 15 minutes in milliseconds
      const timerId = setTimeout(() => {
        // Double-check deposit status before clearing
        const currentPayment = localStorage.getItem('mpesaPayment')
        let shouldClearNow = true
        
        if (currentPayment) {
          try {
            const paymentData = JSON.parse(currentPayment)
            if (paymentData.depositPaid === true) {
              console.log('🔒 Deposit paid - canceling auto-clear at WhatsApp timer execution')
              shouldClearNow = false
            }
          } catch (error) {
            console.error('Error checking payment status at WhatsApp clear time:', error)
          }
        }
        
        if (shouldClearNow) {
          // EXTRA PROTECTION: Check cart value before WhatsApp auto-clear
          const currentCart = localStorage.getItem('cart:v1')
          let cartValue = 0
          if (currentCart) {
            try {
              const cartData = JSON.parse(currentCart)
              cartValue = Object.values(cartData).reduce((total, item) => {
                return total + ((item.qty || 0) * (item.price || 0))
              }, 0)
            } catch (error) {
              console.error('Error calculating cart value for WhatsApp clear:', error)
            }
          }
          
          if (cartValue > 2000) {
            console.log(`🛡️ PROTECTED: High-value cart (Ksh ${cartValue.toLocaleString()}) - WhatsApp auto-clear canceled`)
          } else {
            console.log('🕐 Auto-clearing cart - 15 minutes elapsed since WhatsApp click')
            clearCart(true) // Force override for WhatsApp timer
          }
        } else {
          console.log('💰 Deposit paid - WhatsApp auto-clear canceled')
        }
      }, fifteenMinutes)
      setAutoClearTimer(timerId)
      
      console.log(`📱 WhatsApp clicked - Auto-clear scheduled in 15 minutes`)
    } else {
      console.log('📱 WhatsApp clicked - No auto-clear needed (deposit paid)')
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
          <Link href="/#collection" className="btn" style={{ padding: '10px 16px', fontSize: '15px' }}>Continue Shopping</Link>
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
          <Link href="/#collection" className="btn" style={{ padding: '10px 16px', fontSize: '15px' }}>Continue Shopping</Link>
        </div>

        {list.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center', color: 'var(--muted)', padding: '48px 16px', border: '1px dashed #2a3342', borderRadius: 12 }}>
            <p style={{ margin: 0, fontSize: 16 }}>Your cart is empty.</p>
            <Link href="/#collection" className="btn btn-primary">Back to Products</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 16px 32px' }}>
          {/* Cart Items List */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h2 style={{ margin: '0 0 2px', fontSize: 16, fontWeight: 700, color: 'white' }}>🛒 STEP 1: Review Your Cart Items</h2>
            
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
                          if (isCartLocked) {
                            setShowCartProtectionPopup(true)
                            setTimeout(() => setShowCartProtectionPopup(false), 3000)
                          } else {
                            setClickedRemoveItems(prev => new Set([...prev, it.id]))
                            removeItem(it.id)
                          }
                        }} 
                        aria-label={`Remove ${it.name}`} 
                        style={{ 
                          fontSize: 11, 
                          padding: '2px 6px',
                          color: isCartLocked ? 'rgba(255, 255, 255, 0.3)' : (clickedRemoveItems.has(it.id) ? 'red' : 'inherit'),
                          cursor: 'pointer',
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
                          onQuantityChange={(isCartLocked || mpesaPayment.depositPaid) ? () => {
                            setShowCartProtectionPopup(true)
                            setTimeout(() => setShowCartProtectionPopup(false), 3000)
                          } : (newQty) => setQty(it.id, newQty)}
                          disabled={isCartLocked || mpesaPayment.depositPaid}
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
          <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h2 style={{ margin: '0 0 2px', fontSize: 16, fontWeight: 700, color: 'white' }}>📦 STEP 2: Choose Delivery Options</h2>
            
            
            <div style={{ 
              border: '1px solid #253049', 
              borderRadius: 8, 
              padding: 16, 
              backgroundColor: 'rgba(42, 51, 66, 0.05)',
              opacity: mpesaPayment.depositPaid ? 0.8 : 1
            }}>
            
            {/* Pickup vs Delivery Choice */}
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 8, display: 'block' }}>How would you like to receive your order?</label>
            
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '6px 10px', border: `1px solid ${deliveryDetails.fulfillmentType === 'pickup' ? '#007bff' : '#2a3342'}`, borderRadius: 4, backgroundColor: deliveryDetails.fulfillmentType === 'pickup' ? 'rgba(0, 123, 255, 0.1)' : 'transparent', flex: 1, opacity: mpesaPayment.depositPaid ? 0.6 : 1 }} onClick={() => {
                if (mpesaPayment.depositPaid) {
                  setShowDeliveryProtectionPopup(true)
                  setTimeout(() => setShowDeliveryProtectionPopup(false), 3000)
                }
              }}>
                <input type="radio" name="fulfillment" value="pickup" checked={deliveryDetails.fulfillmentType === 'pickup'} onChange={(e) => {
                  if (mpesaPayment.depositPaid) {
                    setShowDeliveryProtectionPopup(true)
                    setTimeout(() => setShowDeliveryProtectionPopup(false), 3000)
                  } else {
                    setDeliveryDetails(prev => ({ ...prev, fulfillmentType: e.target.value }))
                  }
                }} style={{ accentColor: '#007bff' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>🏪 Shop Pickup</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>Free - Pick up from our store</div>
                </div>
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '6px 10px', border: `1px solid ${deliveryDetails.fulfillmentType === 'delivery' ? '#007bff' : '#2a3342'}`, borderRadius: 4, backgroundColor: deliveryDetails.fulfillmentType === 'delivery' ? 'rgba(0, 123, 255, 0.1)' : 'transparent', flex: 1, opacity: mpesaPayment.depositPaid ? 0.6 : 1 }} onClick={() => {
                if (mpesaPayment.depositPaid) {
                  setShowDeliveryProtectionPopup(true)
                  setTimeout(() => setShowDeliveryProtectionPopup(false), 3000)
                }
              }}>
                <input type="radio" name="fulfillment" value="delivery" checked={deliveryDetails.fulfillmentType === 'delivery'} onChange={(e) => {
                  if (mpesaPayment.depositPaid) {
                    setShowDeliveryProtectionPopup(true)
                    setTimeout(() => setShowDeliveryProtectionPopup(false), 3000)
                  } else {
                    setDeliveryDetails(prev => ({ ...prev, fulfillmentType: e.target.value }))
                  }
                }} style={{ accentColor: '#007bff' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>🚚 Home Delivery</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>Delivered to your address</div>
                </div>
              </label>
            </div>

            {/* Contact Information - Only shown for pickup */}
            {deliveryDetails.fulfillmentType === 'pickup' && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Contact Phone Number *</label>
                <input 
                  type="tel" 
                  value={deliveryDetails.phone}
                  placeholder="e.g., +254 700 000 000"
                  style={{ padding: '8px 11px', borderRadius: 4, border: '1px solid #2a3342', background: 'transparent', color: 'var(--text)', fontSize: 13, width: '100%', boxSizing: 'border-box', opacity: mpesaPayment.depositPaid ? 0.6 : 1 }}
                  onClick={() => {
                    if (mpesaPayment.depositPaid) {
                      setShowDeliveryProtectionPopup(true)
                      setTimeout(() => setShowDeliveryProtectionPopup(false), 3000)
                    }
                  }}
                  onChange={(e) => {
                    if (mpesaPayment.depositPaid) {
                      setShowDeliveryProtectionPopup(true)
                      setTimeout(() => setShowDeliveryProtectionPopup(false), 3000)
                    } else {
                      setDeliveryDetails(prev => ({ ...prev, phone: e.target.value }))
                    }
                  }}
                />
              </div>
            )}

            {/* Delivery Details - Only shown when delivery is selected */}
            {deliveryDetails.fulfillmentType === 'delivery' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Customer Name *</label>
                <input 
                  type="text" 
                  value={deliveryDetails.customerName}
                  onChange={(e) => setDeliveryDetails(prev => ({ ...prev, customerName: e.target.value }))}
                  placeholder="Enter your full name"
                  style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid #2a3342', background: 'transparent', color: 'var(--text)', fontSize: 13, opacity: mpesaPayment.depositPaid ? 0.6 : 1 }}
                  disabled={mpesaPayment.depositPaid}
                />

                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Delivery Address *</label>
                <textarea 
                  value={deliveryDetails.address}
                  onChange={(e) => setDeliveryDetails(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter your full delivery address"
                  style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #2a3342', background: 'transparent', color: 'var(--text)', fontSize: 13, minHeight: 40, resize: 'vertical', fontFamily: 'inherit', opacity: mpesaPayment.depositPaid ? 0.6 : 1 }}
                  disabled={mpesaPayment.depositPaid}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Phone Number *</label>
                    <input 
                      type="tel" 
                      value={deliveryDetails.phone}
                      onChange={(e) => setDeliveryDetails(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="e.g., +254 700 000 000"
                      style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid #2a3342', background: 'transparent', color: 'var(--text)', fontSize: 13, width: '100%', boxSizing: 'border-box', opacity: mpesaPayment.depositPaid ? 0.6 : 1 }}
                      disabled={mpesaPayment.depositPaid}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Alternative Phone</label>
                    <input 
                      type="tel" 
                      value={deliveryDetails.altPhone}
                      onChange={(e) => setDeliveryDetails(prev => ({ ...prev, altPhone: e.target.value }))}
                      placeholder="Optional backup number"
                      style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid #2a3342', background: 'transparent', color: 'var(--text)', fontSize: 13, width: '100%', boxSizing: 'border-box', opacity: mpesaPayment.depositPaid ? 0.6 : 1 }}
                      disabled={mpesaPayment.depositPaid}
                    />
                  </div>
                </div>

                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Delivery Option</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: mpesaPayment.depositPaid ? 'not-allowed' : 'pointer', padding: '6px 8px', border: `1px solid ${deliveryDetails.deliveryOption === 'standard' ? '#007bff' : '#2a3342'}`, borderRadius: 4, backgroundColor: deliveryDetails.deliveryOption === 'standard' ? 'rgba(0, 123, 255, 0.1)' : 'transparent', opacity: mpesaPayment.depositPaid ? 0.6 : 1 }}>
                    <input 
                      type="radio" 
                      name="delivery" 
                      value="standard" 
                      checked={deliveryDetails.deliveryOption === 'standard'}
                      onChange={(e) => setDeliveryDetails(prev => ({ ...prev, deliveryOption: e.target.value }))}
                      style={{ accentColor: '#007bff' }} 
                      disabled={mpesaPayment.depositPaid}
                    />
                    <span style={{ fontSize: 13 }}>Standard Delivery (2-3 days) - Free</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: mpesaPayment.depositPaid ? 'not-allowed' : 'pointer', padding: '6px 8px', border: `1px solid ${deliveryDetails.deliveryOption === 'express' ? '#007bff' : '#2a3342'}`, borderRadius: 4, backgroundColor: deliveryDetails.deliveryOption === 'express' ? 'rgba(0, 123, 255, 0.1)' : 'transparent', opacity: mpesaPayment.depositPaid ? 0.6 : 1 }}>
                    <input 
                      type="radio" 
                      name="delivery" 
                      value="express" 
                      checked={deliveryDetails.deliveryOption === 'express'}
                      onChange={(e) => setDeliveryDetails(prev => ({ ...prev, deliveryOption: e.target.value }))}
                      style={{ accentColor: '#007bff' }} 
                      disabled={mpesaPayment.depositPaid}
                    />
                    <span style={{ fontSize: 13 }}>Express Delivery (Same day) - Ksh 300</span>
                  </label>
                </div>

                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Special Instructions (Optional)</label>
                <textarea 
                  value={deliveryDetails.instructions}
                  onChange={(e) => setDeliveryDetails(prev => ({ ...prev, instructions: e.target.value }))}
                  placeholder="Any special delivery instructions"
                  style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #2a3342', background: 'transparent', color: 'var(--text)', fontSize: 13, minHeight: 40, resize: 'vertical', fontFamily: 'inherit', opacity: mpesaPayment.depositPaid ? 0.6 : 1 }}
                  disabled={mpesaPayment.depositPaid}
                />

                <div style={{ background: 'rgba(0, 123, 255, 0.1)', border: '1px solid rgba(0, 123, 255, 0.3)', borderRadius: 6, padding: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#007bff', marginBottom: 8 }}>📦 Delivery Information</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.4 }}>
                    • Standard delivery within Nairobi: 2-3 business days (Free)<br/>
                    • Express delivery available for same-day delivery (Ksh 300)<br/>
                    • Delivery outside Nairobi: 3-5 business days (charges apply)<br/>
                    • All items are carefully packaged and insured during transit
                  </div>
                </div>
              </div>
            )}
            </div>
          </section>

          {/* M-Pesa Deposit Payment Section */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h2 style={{ margin: '0 0 2px', fontSize: 16, fontWeight: 700, color: 'white' }}>💳 STEP 3: Pay 20% Deposit via M-Pesa</h2>
            
            <div style={{ 
              border: '1px solid #2a3342', 
              borderRadius: 8, 
              padding: 12, 
              backgroundColor: 'rgba(0, 123, 255, 0.08)'
            }}>
            <div style={{ marginBottom: 8, textAlign: 'left' }}>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text)', lineHeight: 1.3, fontWeight: 500 }}>
                <strong>Required:</strong> Pay a 20% deposit to secure your order and unlock WhatsApp checkout.
              </p>
            </div>
            
            {(() => {
              const { finalTotal, depositAmount, remainingAmount } = calculatePaymentAmounts()
              
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* Payment Summary */}
                  <div style={{ 
                    background: 'rgba(0, 123, 255, 0.1)', 
                    border: '1px solid rgba(0, 123, 255, 0.3)', 
                    borderRadius: 4, 
                    padding: 8 
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
                        {mpesaPayment.paymentStatus === 'failed' && 'Payment Failed'}
                        {mpesaPayment.paymentStatus === 'timeout' && '⏱️ Payment Timeout'}
                        {mpesaPayment.paymentStatus === 'processing' && '⚡ Processing... (1-5 seconds)'}
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
                      marginBottom: 4
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'white' }}>
                          Pay 20% Deposit to Continue
                        </h3>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
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
                              padding: '10px 12px', 
                              borderRadius: 4, 
                              border: '1px solid #007bff', 
                              background: 'transparent',
                              marginTop: 4,
                              marginBottom: 8, 
                              color: 'white', 
                              fontSize: 13,
                              boxSizing: 'border-box',
                              fontWeight: 500
                            }}
                          />
                        </div>
                        
                        <button 
                          onClick={handleMpesaDeposit}
                          disabled={mpesaPayment.isProcessing || !mpesaPayment.phoneNumber.trim()}
                          style={{ 
                            width: '100%',
                            padding: '10px 14px', 
                            borderRadius: 4, 
                            border: 'none',
                            background: mpesaPayment.isProcessing || !mpesaPayment.phoneNumber.trim() ? 
                              'rgba(0, 123, 255, 0.3)' : '#007bff',
                            color: 'white', 
                            fontSize: 14, 
                            fontWeight: 500,
                            cursor: mpesaPayment.isProcessing || !mpesaPayment.phoneNumber.trim() ? 
                              'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                            transition: 'all 0.2s',
                            boxShadow: mpesaPayment.isProcessing || !mpesaPayment.phoneNumber.trim() ? 
                              'none' : '0 1px 2px rgba(0, 123, 255, 0.2)'
                          }}
                        >
                          {mpesaPayment.isProcessing ? (
                            <>
                              <span style={{ 
                                width: 14, 
                                height: 14, 
                                border: '1.5px solid rgba(255,255,255,0.3)', 
                                borderTop: '1.5px solid white', 
                                borderRadius: '50%', 
                                animation: 'spin 1s linear infinite' 
                              }}></span>
                              {mpesaPayment.errorMessage && mpesaPayment.errorMessage.includes('Checking payment') ? 
                                mpesaPayment.errorMessage : 
                                'Processing... (Usually 10-30 seconds)'
                              }
                            </>
                          ) : (
                            <>
                              💳 Pay Deposit - Ksh {Number(depositAmount).toLocaleString('en-KE')}
                            </>
                          )}
                        </button>
                        
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


                </div>
              )
            })()}
            </div>
          </section>

          {/* Order Summary */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h2 style={{ margin: '0 0 2px', fontSize: 16, fontWeight: 700, color: 'white' }}>📋 STEP 4: Order Summary & Checkout</h2>
            
            <div style={{ 
              border: '1px solid #253049', 
              borderRadius: 6, 
              padding: 10, 
              backgroundColor: 'rgba(37, 48, 73, 0.1)'
            }}>
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
                  <div style={{ height: 1, background: '#253049', margin: '8px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14, fontWeight: 700 }}>
                    <span>Total</span>
                    <strong style={{ color: 'green', fontSize: 13 }}>Ksh {Number(finalTotal).toLocaleString('en-KE')}</strong>
                  </div>
                  
                  {/* Deposit and Balance Information */}
                  {mpesaPayment.depositPaid && (
                    <>
                      <div style={{ height: 1, background: '#253049', margin: '8px 0' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13, color: '#28a745' }}>
                        <span>✅ Deposit Paid (20%)</span>
                        <strong style={{ fontSize: 14 }}>Ksh {Number(Math.round(finalTotal * 0.2)).toLocaleString('en-KE')}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, color: '#ffc107' }}>
                        <span>⏳ Balance Due (80%)</span>
                        <strong style={{ color: 'white' }}>Ksh {Number(Math.round(finalTotal * 0.8)).toLocaleString('en-KE')}</strong>
                      </div>
                    </>
                  )}
                  
                  {!mpesaPayment.depositPaid && (
                    <>
                      <div style={{ height: 1, background: '#253049', margin: '8px 0' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13, color: '#6c757d' }}>
                        <span>Required Deposit (20%)</span>
                        <strong>Ksh {Number(Math.round(finalTotal * 0.2)).toLocaleString('en-KE')}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, color: '#6c757d' }}>
                        <span>Balance After Deposit (80%)</span>
                        <strong>Ksh {Number(Math.round(finalTotal * 0.8)).toLocaleString('en-KE')}</strong>
                      </div>
                    </>
                  )}
                </>
              )
            })()}
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <input type="text" placeholder="Promo Code" style={{ flex: 1, borderRadius: 6, border: '1px solid #2a3342', background: 'transparent', color: 'var(--text)', padding: '8px 10px', fontSize: 13 }} />
              <button className="btn btn-small" style={{ fontSize: 12, padding: '6px 8px' }}>Apply</button>
            </div>
            {/* Auto-clear timer info */}
            {whatsappClickTime && (
              <div style={{ 
                background: 'rgba(255, 193, 7, 0.1)', 
                border: '1px solid #ffc107', 
                borderRadius: 6, 
                padding: '8px 12px', 
                marginBottom: 8,
                fontSize: 12,
                color: '#ffc107'
              }}>
                ⏰ Cart will auto-clear in {Math.max(0, Math.round((whatsappClickTime + (15 * 60 * 1000) - currentTime) / 1000 / 60))} minutes to make room for new orders
              </div>
            )}
            
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
                onClick={() => {
                  console.log('🗑️ New Order button clicked!')
                  console.log('Current cart state:', { 
                    isCartLocked, 
                    depositPaid: mpesaPayment.depositPaid,
                    totalAmount,
                    itemCount: totalCount
                  })
                  
                  try {
                    if (confirm('🛒 Start a new order?\n\nThis will clear your current cart and reset payment status.')) {
                      console.log('✅ User confirmed cart clear')
                      const result = clearCart()
                      console.log('🧹 Clear cart result:', result)
                      if (result === false) {
                        console.log('❌ Cart clear was blocked by protection')
                        // Try force clear if user really wants to
                        if (confirm('⚠️ Protected Cart Detected\n\nYour cart has a paid deposit. Force clear anyway?\n\n⚠️ This action cannot be undone.')) {
                          console.log('🔓 User requested force clear')
                          clearCart(true) // Force override
                        }
                      }
                    } else {
                      console.log('❌ User canceled cart clear')
                    }
                  } catch (error) {
                    console.error('💥 Error in New Order button:', error)
                    alert('Error clearing cart: ' + error.message)
                  }
                }}
                style={{ 
                  fontSize: 12, 
                  padding: '8px 10px',
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                🗑️ New Order
              </button>
            </div>
            </div>
          </section>
        </div>
      )}

      </div>

      {/* Cart Protection Popup */}
      {showCartProtectionPopup && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(40, 167, 69, 0.95)',
          border: '2px solid #28a745',
          borderRadius: 0,
          padding: window.innerWidth <= 768 ? '20px 16px' : '30px 40px',
          zIndex: 1000,
          width: window.innerWidth <= 768 ? 'calc(100vw - 32px)' : '50vw',
          maxWidth: window.innerWidth <= 768 ? '400px' : '500px',
          minWidth: window.innerWidth <= 768 ? '280px' : '400px',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          margin: '0 auto'
        }}>
          <div style={{ fontSize: window.innerWidth <= 768 ? 16 : 18, fontWeight: 700, color: 'white', marginBottom: window.innerWidth <= 768 ? 8 : 12, textAlign: 'center' }}>
            🔒 Cart Protected - Deposit Paid
          </div>
          <div style={{ fontSize: window.innerWidth <= 768 ? 13 : 15, color: 'rgba(255, 255, 255, 0.95)', lineHeight: 1.5, textAlign: 'center' }}>
            Your cart is now locked and protected. Items cannot be removed or modified because you have successfully paid the 20% deposit. This ensures your order is secured and ready for WhatsApp checkout.
          </div>
        </div>
      )}

      {/* Delivery Protection Popup */}
      {showDeliveryProtectionPopup && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(34, 197, 94, 0.95)',
          border: '2px solid #22c55e',
          borderRadius: 0,
          padding: window.innerWidth <= 768 ? '20px 16px' : '30px 40px',
          zIndex: 1000,
          width: window.innerWidth <= 768 ? 'calc(100vw - 32px)' : '60vw',
          maxWidth: window.innerWidth <= 768 ? '400px' : '600px',
          minWidth: window.innerWidth <= 768 ? '280px' : '450px',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          margin: '0 auto'
        }}>
          <div style={{ fontSize: window.innerWidth <= 768 ? 16 : 18, fontWeight: 700, color: 'white', marginBottom: window.innerWidth <= 768 ? 8 : 12, textAlign: 'center' }}>
            🔒 Delivery Options Locked
          </div>
          <div style={{ fontSize: window.innerWidth <= 768 ? 13 : 15, color: 'rgba(255, 255, 255, 0.95)', lineHeight: 1.5, textAlign: 'center' }}>
            Delivery options are locked after payment. Contact support to make changes to your delivery preferences.
          </div>
        </div>
      )}
    </>
  )
}
