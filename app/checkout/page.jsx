'use client'

import { useState, useEffect } from 'react'
import { useCart } from '../../components/CartContext'
import { useAuth } from '../../components/AuthContext'
import SimplePayment from '../../components/SimplePayment'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { jsPDF } from 'jspdf'

const checkoutStyles = `
  .checkout-container {
    padding-left: 14px !important;
    padding-right: 14px !important;
  }
  .checkout-header {
    padding-left: 14px !important;
    padding-right: 14px !important;
  }
  @media (min-width: 768px) {
    .checkout-container {
      padding-left: 16px !important;
      padding-right: 16px !important;
    }
    .checkout-header {
      padding-left: 16px !important;
      padding-right: 16px !important;
    }
  }
  
  /* Order completion modal styles */
  .order-modal-overlay {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    background-color: rgba(0, 0, 0, 0.7) !important;
    z-index: 1000 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    padding: 20px !important;
  }
  
  .order-modal-content {
    background-color: var(--card) !important;
    border: none !important;
    border-radius: 12px !important;
    padding: 16px !important;
    max-width: 400px !important;
    width: 100% !important;
    text-align: center !important;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
  }
  
  @media (max-width: 640px) {
    .order-modal-content {
      padding: 12px !important;
      max-width: 320px !important;
    }
  }
  
  .order-modal-emoji {
    font-size: clamp(32px, 8vw, 48px) !important;
    margin-bottom: 4px !important;
  }
  
  .order-modal-title {
    margin: 0 0 6px !important;
    font-size: clamp(16px, 4vw, 18px) !important;
    font-weight: 600 !important;
    color: #10b981 !important;
  }
  
  .order-modal-order-id {
    margin: 0 0 8px !important;
    font-size: clamp(12px, 3vw, 14px) !important;
    color: white !important;
  }
  
  .order-modal-description {
    margin: 0 0 16px !important;
    font-size: clamp(11px, 2.5vw, 13px) !important;
    color: white !important;
    line-height: 1.4 !important;
  }
  
  .order-modal-buttons {
    display: flex !important;
    gap: 8px !important;
    justify-content: center !important;
    flex-wrap: wrap !important;
    flex-direction: column !important;
  }
  
  @media (min-width: 640px) {
    .order-modal-buttons {
      flex-direction: row !important;
    }
  }
  
  .order-modal-button {
    padding: clamp(8px, 2vw, 10px) clamp(12px, 3vw, 20px) !important;
    font-size: clamp(12px, 3vw, 14px) !important;
    font-weight: 600 !important;
    width: 100% !important;
  }
  
  @media (min-width: 640px) {
    .order-modal-button {
      width: auto !important;
    }
  }
`

export default function CheckoutPage() {
  const { items, totalAmount, totalCount, unlockCart, clear } = useCart()
  const list = Object.values(items || {})
  const { user, isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const [paymentCompleted, setPaymentCompleted] = useState(false)
  const [orderCompleted, setOrderCompleted] = useState(false)
  const [paymentPhoneNumber, setPaymentPhoneNumber] = useState('')
  const [promoCode, setPromoCode] = useState('')
  const [promoError, setPromoError] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)
  const [promoDiscount, setPromoDiscount] = useState(0)

  // Initialize delivery details with user's saved delivery address or empty values
  const initializeDeliveryDetails = () => {
    if (user?.deliveryAddress) {
      return {
        fulfillmentType: 'delivery',
        customerName: user.deliveryAddress.fullName || user.name || '',
        phone: user.deliveryAddress.phone || user.phone || '',
        street: user.deliveryAddress.street || '',
        city: user.deliveryAddress.city || '',
        region: user.deliveryAddress.region || '',
        deliveryOption: 'standard',
        deliveryInstructions: user.deliveryAddress.additionalInstructions || ''
      }
    } else {
      return {
        fulfillmentType: 'delivery',
        customerName: user?.name || '',
        phone: user?.phone || '',
        street: '',
        city: '',
        region: '',
        deliveryOption: 'standard',
        deliveryInstructions: ''
      }
    }
  }

  const [deliveryDetails, setDeliveryDetails] = useState(initializeDeliveryDetails)

  const [isClient, setIsClient] = useState(false)
  const [orderProcessing, setOrderProcessing] = useState(false)
  const [completedOrderId, setCompletedOrderId] = useState(null)
  const [showWhatsAppSection, setShowWhatsAppSection] = useState(false)
  const [receiptDownloaded, setReceiptDownloaded] = useState(false)
  const [whatsappSent, setWhatsappSent] = useState(false)
  const [showPopup, setShowPopup] = useState(false)
  
  // Debug log to check default state
  console.log('🔍 Current fulfillmentType:', deliveryDetails.fulfillmentType)
  

  // Fetch delivery address from API
  const fetchDeliveryAddress = async () => {
    try {
      console.log('🔄 Fetching delivery address from database...')
      const response = await fetch('/api/user/delivery-address')
      
      if (response.ok) {
        const data = await response.json()
        const address = data.deliveryAddress
        
        if (address) {
          const addressInfo = {
            fulfillmentType: 'delivery',
            customerName: address.fullName || user?.name || '',
            phone: address.phone || user?.phone || '',
            street: address.street || '',
            city: address.city || '',
            region: address.region || '',
            deliveryOption: 'standard',
            deliveryInstructions: address.additionalInstructions || ''
          }
          
          setDeliveryDetails(addressInfo)
          console.log('📍 Delivery address loaded and set:', addressInfo)
        }
      } else {
        console.log('No delivery address found, using user basic info')
        // Fall back to basic user info
        setDeliveryDetails(prev => ({
          ...prev,
          customerName: user?.name || '',
          phone: user?.phone || ''
        }))
      }
    } catch (error) {
      console.error('❌ Error fetching delivery address:', error)
      // Fall back to basic user info
      setDeliveryDetails(prev => ({
        ...prev,
        customerName: user?.name || '',
        phone: user?.phone || ''
      }))
    }
  }

  // Update delivery details when user data changes
  useEffect(() => {
    if (user) {
      fetchDeliveryAddress()
    }
  }, [user])

  // Authentication check
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, loading, router])

  // Auto-populate user information from auth context
  useEffect(() => {
    if (user && !deliveryDetails.customerName && !deliveryDetails.phone) {
      setDeliveryDetails(prev => ({
        ...prev,
        customerName: user.name || '',
        phone: user.phone || ''
      }))
      console.log('👤 Auto-populated user info from auth context')
    }
  }, [user, deliveryDetails.customerName, deliveryDetails.phone])

  useEffect(() => {
    setIsClient(true)
    
    // Check for active payments and clear everything if no payment is active
    // This ensures we start fresh with default state on page refresh
    const checkAndResetToDefault = () => {
      try {
        const savedPaymentState = localStorage.getItem('checkoutPaymentState')
        const savedOrderState = localStorage.getItem('orderCompletionState')
        let hasActivePayment = false
        let hasActiveOrder = false
        
        // Check if there's an active payment
        if (savedPaymentState) {
          const parsed = JSON.parse(savedPaymentState)
          hasActivePayment = parsed.paymentCompleted === true
        }
        
        // Check if there's an active order
        if (savedOrderState) {
          const parsed = JSON.parse(savedOrderState)
          hasActiveOrder = parsed.orderCompleted === true && !parsed.receiptDownloaded
        }
        
        // Only clear if there's NO active payment AND NO active order
        // If there's any active payment or order, preserve the state
        if (!hasActivePayment && !hasActiveOrder) {
          // Clear localStorage only if no active sessions
          localStorage.removeItem('checkoutPaymentState')
          localStorage.removeItem('orderCompletionState')
          
          console.log('🔄 Page refreshed with no active payments - will reset to default state')
          // Note: States will be reset to default by initial useState values
          // No need to explicitly set them here as restoration won't run
        } else {
          console.log('💳 Active payment/order found - preserving state for restoration')
          // Don't clear localStorage - let restoration logic handle it
        }
        
      } catch (e) {
        // If any parsing errors, clear everything to start fresh
        localStorage.removeItem('checkoutPaymentState')
        localStorage.removeItem('orderCompletionState')
        
        // Reset all states to default
        setPaymentCompleted(false)
        setOrderCompleted(false)
        setCompletedOrderId(null)
        setShowWhatsAppSection(false)
        setReceiptDownloaded(false)
        setPaymentPhoneNumber('')
        setWhatsappSent(false)
        setShowPopup(false)
        
        setDeliveryDetails({
          fulfillmentType: 'pickup',
          customerName: '',
          address: '',
          phone: '',
          altPhone: '',
          deliveryOption: 'standard',
          instructions: ''
        })
        
        console.log('🧹 Cleared all data due to parsing error - reset to default')
      }
    }
    checkAndResetToDefault()
    
    // Restore order completion state from localStorage
    const savedOrderState = localStorage.getItem('orderCompletionState')
    if (savedOrderState) {
      const { orderCompleted, completedOrderId, receiptDownloaded, deliveryDetails: savedDeliveryDetails, whatsappSent } = JSON.parse(savedOrderState)
      
      setOrderCompleted(orderCompleted || false)
      setCompletedOrderId(completedOrderId || null)
      setReceiptDownloaded(receiptDownloaded || false)
      setWhatsappSent(whatsappSent || false)
      
      // Restore delivery details if order is completed but receipt not downloaded
      if (orderCompleted && !receiptDownloaded && savedDeliveryDetails) {
        setDeliveryDetails(savedDeliveryDetails)
      }
    }
    
    // Restore payment state from localStorage
    const savedPaymentState = localStorage.getItem('checkoutPaymentState')
    if (savedPaymentState) {
      const { 
        paymentCompleted, 
        deliveryDetails: savedDeliveryDetails, 
        showWhatsAppSection: savedShowWhatsApp, 
        paymentPhoneNumber: savedPaymentPhone,
        orderCompleted: savedOrderCompleted,
        completedOrderId: savedCompletedOrderId,
        receiptDownloaded: savedReceiptDownloaded,
        whatsappSent: savedWhatsappSent
      } = JSON.parse(savedPaymentState)
      
      setPaymentCompleted(paymentCompleted || false)
      setShowWhatsAppSection(savedShowWhatsApp || false)
      setPaymentPhoneNumber(savedPaymentPhone || '')
      setOrderCompleted(savedOrderCompleted || false)
      setCompletedOrderId(savedCompletedOrderId || null)
      setReceiptDownloaded(savedReceiptDownloaded || false)
      setWhatsappSent(savedWhatsappSent || false)
      
      // Restore delivery details if payment completed
      if (paymentCompleted && savedDeliveryDetails) {
        setDeliveryDetails({
          ...savedDeliveryDetails,
          fulfillmentType: savedDeliveryDetails.fulfillmentType || 'pickup' // Default to pickup if not set
        })
      }
      
      console.log('🔄 Restored payment and order states from localStorage')
    }
  }, [])

  // Force pickup as default only on initial mount (not when user changes it)
  useEffect(() => {
    // Only force pickup on initial load if no payment is active
    const hasActivePayment = localStorage.getItem('checkoutPaymentState')
    if (!hasActivePayment && deliveryDetails.fulfillmentType !== 'pickup') {
      console.log('🔧 Setting pickup as initial default fulfillment type')
      setDeliveryDetails(prev => ({
        ...prev,
        fulfillmentType: 'pickup'
      }))
    }
  }, []) // Remove dependency to only run once on mount

  // Save payment state to localStorage when payment is completed
  useEffect(() => {
    if (paymentCompleted) {
      const paymentState = {
        paymentCompleted: true,
        deliveryDetails: deliveryDetails,
        showWhatsAppSection: showWhatsAppSection,
        paymentPhoneNumber: paymentPhoneNumber,
        orderCompleted: orderCompleted,
        completedOrderId: completedOrderId,
        receiptDownloaded: receiptDownloaded,
        whatsappSent: whatsappSent
      }
      localStorage.setItem('checkoutPaymentState', JSON.stringify(paymentState))
      console.log('💳 Payment state saved to localStorage')
    }
  }, [paymentCompleted, deliveryDetails, showWhatsAppSection, paymentPhoneNumber, orderCompleted, completedOrderId, receiptDownloaded, whatsappSent])

  // Save delivery details to localStorage when they change (if payment completed)
  useEffect(() => {
    if (paymentCompleted) {
      const paymentState = {
        paymentCompleted: true,
        deliveryDetails: deliveryDetails,
        showWhatsAppSection: showWhatsAppSection,
        paymentPhoneNumber: paymentPhoneNumber,
        orderCompleted: orderCompleted,
        completedOrderId: completedOrderId,
        receiptDownloaded: receiptDownloaded,
        whatsappSent: whatsappSent
      }
      localStorage.setItem('checkoutPaymentState', JSON.stringify(paymentState))
    }
  }, [deliveryDetails, paymentCompleted, showWhatsAppSection, paymentPhoneNumber, orderCompleted, completedOrderId, receiptDownloaded, whatsappSent])

  // Auto-complete order when WhatsApp section becomes visible
  useEffect(() => {
    if (showWhatsAppSection && !orderCompleted) {
      const autoCompleteOrder = async () => {
        const orderId = await completeOrder()
        if (orderId) {
          setCompletedOrderId(orderId)
          setOrderCompleted(true)
        }
      }
      autoCompleteOrder()
    }
  }, [showWhatsAppSection, orderCompleted])

  // Prevent body scrolling when modal is shown
  useEffect(() => {
    if (showWhatsAppSection) {
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.top = '0'
      document.body.style.left = '0'
      document.body.style.width = '100%'
    } else {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.width = ''
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.width = ''
    }
  }, [showWhatsAppSection])

  // Function to complete order and unlock cart
  const completeOrder = async () => {
    try {
      setOrderProcessing(true)
      
      // Validate required fields
      if (!deliveryDetails.customerName || !deliveryDetails.phone) {
        throw new Error('Please fill in your name and phone number')
      }
      
      if (deliveryDetails.fulfillmentType === 'delivery' && !deliveryDetails.address) {
        throw new Error('Please provide your delivery address')
      }
      
      // Prepare order data
      console.log('🛒 Cart items:', Object.values(items))
      console.log('📋 Delivery details:', deliveryDetails)
      
      const orderData = {
        customer: {
          name: deliveryDetails.customerName,
          phone: deliveryDetails.phone,
          email: '', // Add email field if needed
          address: deliveryDetails.fulfillmentType === 'delivery' ? {
            street: deliveryDetails.address,
            city: 'Nairobi',
            area: '',
            instructions: deliveryDetails.instructions
          } : null
        },
        items: Object.values(items),
        subtotalAmount: totalAmount,
        deliveryFee: deliveryFee,
        totalAmount: finalTotal,
        delivery: {
          method: deliveryDetails.fulfillmentType,
          estimatedDate: deliveryDetails.fulfillmentType === 'delivery' 
            ? (deliveryDetails.deliveryOption === 'express' 
                ? new Date(Date.now() + 24 * 60 * 60 * 1000) // Same day
                : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)) // 3 days
            : new Date(Date.now() + 4 * 60 * 60 * 1000) // 4 hours for pickup
        },
        transactionId: localStorage.getItem('lastPaymentId') || 'MANUAL_PAYMENT'
      }

      console.log('📤 Sending order data:', JSON.stringify(orderData, null, 2))

      // Save order to database
      const response = await fetch('/api/orders/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      })

      const result = await response.json()

      if (response.ok && result.success) {
        console.log('✅ Order completed successfully:', result.orderId)
        
        // Set order as completed
        setOrderCompleted(true)
        setCompletedOrderId(result.orderId)
        setReceiptDownloaded(false)
        
        // Save order completion state to localStorage
        const orderState = {
          orderCompleted: true,
          completedOrderId: result.orderId,
          receiptDownloaded: false,
          deliveryDetails: deliveryDetails,
          whatsappSent: whatsappSent
        }
        localStorage.setItem('orderCompletionState', JSON.stringify(orderState))
        
        // Clear payment state since order is now completed
        localStorage.removeItem('checkoutPaymentState')
        
        // Don't automatically unlock cart - wait for receipt download
        console.log('📋 Order completed, cart remains locked until receipt is downloaded')
        
        return result.orderId
      } else {
        console.error('❌ API Error:', result)
        throw new Error(result.error || `Server error: ${response.status}`)
      }
    } catch (error) {
      console.error('❌ Error completing order:', error)
      
      // Show more specific error message
      const errorMessage = error.message.includes('fetch') 
        ? 'Network error. Please check your connection and try again.'
        : `Order completion failed: ${error.message}`
      
      alert(errorMessage)
      return null
    } finally {
      setOrderProcessing(false)
    }
  }

  // Download receipt as PDF
  const downloadReceiptAsPDF = async () => {
    if (!completedOrderId) return
    
    const doc = new jsPDF()
    
    // Set font
    doc.setFont('courier', 'normal')
    
    // Header with website title
    doc.setFontSize(18)
    doc.text('SUPER TWICE RESELLERS', 105, 15, { align: 'center' })
    doc.setFontSize(16)
    doc.text('ORDER RECEIPT', 105, 25, { align: 'center' })
    doc.setFontSize(12)
    doc.text(`Order ID: ${completedOrderId}`, 105, 35, { align: 'center' })
    
    // Customer name
    if (deliveryDetails.customerName) {
      doc.setFontSize(10)
      doc.text(`Customer: ${deliveryDetails.customerName}`, 20, 45)
    }
    
    // Line separator
    doc.line(20, 50, 190, 50)
    
    let yPosition = 60
    
    // Order Details Section
    doc.setFontSize(14)
    doc.text('ORDER DETAILS:', 20, yPosition)
    yPosition += 10
    
    doc.setFontSize(10)
    
    // Process each item with image
    for (let index = 0; index < list.length; index++) {
      const item = list[index]
      
      // Add product image if available
      if (item.img) {
        try {
          // Convert image to base64 and add to PDF
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          const img = new Image()
          
          await new Promise((resolve) => {
            img.onload = () => {
              canvas.width = 50
              canvas.height = 40
              ctx.drawImage(img, 0, 0, 50, 40)
              const imgData = canvas.toDataURL('image/jpeg', 0.8)
              doc.addImage(imgData, 'JPEG', 25, yPosition - 5, 20, 16)
              resolve()
            }
            img.onerror = () => resolve() // Skip image if error
            img.crossOrigin = 'anonymous'
            img.src = item.img
          })
          
          // Product details next to image
          doc.text(`${index + 1}. ${item.name} (${item.condition || 'good'})`, 50, yPosition)
          yPosition += 5
          doc.text(`   Qty: ${item.qty} × Ksh ${Number(item.price).toLocaleString('en-KE')} = Ksh ${Number(item.qty * item.price).toLocaleString('en-KE')}`, 50, yPosition)
          yPosition += 15
        } catch (error) {
          // Fallback without image
          doc.text(`${index + 1}. ${item.name} (${item.condition || 'good'})`, 25, yPosition)
          yPosition += 5
          doc.text(`   Qty: ${item.qty} × Ksh ${Number(item.price).toLocaleString('en-KE')} = Ksh ${Number(item.qty * item.price).toLocaleString('en-KE')}`, 25, yPosition)
          yPosition += 8
        }
      } else {
        // No image available
        doc.text(`${index + 1}. ${item.name} (${item.condition || 'good'})`, 25, yPosition)
        yPosition += 5
        doc.text(`   Qty: ${item.qty} × Ksh ${Number(item.price).toLocaleString('en-KE')} = Ksh ${Number(item.qty * item.price).toLocaleString('en-KE')}`, 25, yPosition)
        yPosition += 8
      }
    }
    
    yPosition += 5
    
    // Payment Summary Section
    doc.setFontSize(14)
    doc.text('PAYMENT SUMMARY:', 20, yPosition)
    yPosition += 10
    
    doc.setFontSize(10)
    doc.text(`Subtotal: Ksh ${Number(totalAmount).toLocaleString('en-KE')}`, 25, yPosition)
    yPosition += 5
    
    if (deliveryFee > 0) {
      doc.text(`Delivery Fee: Ksh ${Number(deliveryFee).toLocaleString('en-KE')}`, 25, yPosition)
      yPosition += 5
    }
    
    doc.setFontSize(12)
    doc.text(`Total: Ksh ${Number(finalTotal).toLocaleString('en-KE')}`, 25, yPosition)
    yPosition += 7
    
    doc.setFontSize(10)
    const depositAmount = Math.round(finalTotal * 0.2)
    const remainingAmount = finalTotal - depositAmount
    doc.text(`Deposit Paid: Ksh ${Number(depositAmount).toLocaleString('en-KE')} ✓`, 25, yPosition)
    yPosition += 5
    doc.text(`Remaining: Ksh ${Number(remainingAmount).toLocaleString('en-KE')} (Cash on Delivery)`, 25, yPosition)
    
    // Footer
    yPosition += 15
    doc.line(20, yPosition, 190, yPosition)
    yPosition += 10
    doc.setFontSize(8)
    doc.text(`Generated on: ${new Date().toLocaleString('en-KE')}`, 105, yPosition, { align: 'center' })
    
    // Download the PDF
    doc.save(`receipt-${completedOrderId}.pdf`)
    
    // Mark receipt as downloaded and immediately clear cart
    setReceiptDownloaded(true)
    
    // Clear cart immediately when download button is clicked
    unlockCart()
    clear(true) // Force override to bypass cart lock protection
    console.log('🛒 Cart cleared immediately after receipt download')
    
    // Auto-close modal immediately after download starts
    setShowWhatsAppSection(false)
    console.log('🎉 Order completion modal closed after receipt download')
    
    // Clear all checkout states after receipt download
    setTimeout(() => {
      // Reset all order states
      setOrderCompleted(false)
      setCompletedOrderId(null)
      setPaymentCompleted(false)
      setShowWhatsAppSection(false)
      
      // Reset delivery details to initial state
      setDeliveryDetails({
        fulfillmentType: 'pickup',
        deliveryOption: 'standard',
        customerName: '',
        phone: '',
        address: '',
        street: '',
        city: '',
        region: '',
        instructions: ''
      })
      
      // Clear all localStorage
      localStorage.removeItem('orderCompletionState')
      localStorage.removeItem('checkoutPaymentState')
      
      console.log('📄 Receipt downloaded, page cleared for fresh order')
      
      // Redirect to products page after clearing everything
      setTimeout(() => {
        window.location.href = '/'
      }, 500)
    }, 1000) // Small delay to ensure download starts first
  }

  // Get hardcoded delivery fees (since admin configuration is removed)
  const getDeliveryFees = () => {
    return {
      nairobiStandard: 100,
      nairobiExpress: 250,
      surroundingStandard: 300,
      surroundingExpress: 500,
      otherStandard: 350,
      otherExpress: 600,
      freeDeliveryThreshold: 5000
    }
  }

  // Location-based delivery fee calculation using hardcoded fees
  const calculateDeliveryFee = () => {
    if (deliveryDetails.fulfillmentType === 'pickup') {
      return 0
    }
    
    const region = deliveryDetails.region?.toLowerCase()
    const deliveryOption = deliveryDetails.deliveryOption
    const subtotal = totalAmount
    
    // Get hardcoded delivery fees
    const fees = getDeliveryFees()
    
    // Free delivery for orders above threshold
    if (subtotal >= fees.freeDeliveryThreshold) {
      return 0
    }
    
    // Location-based delivery fees
    if (region?.includes('nairobi')) {
      return deliveryOption === 'express' ? fees.nairobiExpress : fees.nairobiStandard
    } else if (region?.includes('kiambu') || region?.includes('kajiado') || 
               region?.includes('machakos') || region?.includes('muranga') || 
               region?.includes('nyandarua')) {
      return deliveryOption === 'express' ? fees.surroundingExpress : fees.surroundingStandard
    } else {
      // Naivasha and all other regions are treated as Other Regions
      return deliveryOption === 'express' ? fees.otherExpress : fees.otherStandard
    }
  }
  
  const deliveryFee = calculateDeliveryFee()
  const finalTotal = totalAmount + deliveryFee
  const isFreeDelivery = deliveryFee === 0 && deliveryDetails.fulfillmentType === 'delivery'
  
  // Get current fees for display
  const currentFees = getDeliveryFees()

  // Check if all required delivery fields are filled
  const isDeliveryComplete = () => {
    if (!deliveryDetails.customerName || !deliveryDetails.phone) {
      return false
    }
    
    if (deliveryDetails.fulfillmentType === 'delivery') {
      // Check detailed address fields
      if (!deliveryDetails.street || !deliveryDetails.city || !deliveryDetails.region) {
        return false
      }
    }
    
    return true
  }

  const deliveryFieldsComplete = isDeliveryComplete()

  if (!isClient || !list || list.length === 0) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
        <h1>Checkout</h1>
        <p>Your cart is empty. <Link href="/#collection">Continue shopping</Link></p>
      </div>
    )
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: checkoutStyles }} />
      <div style={{ maxWidth: 1200, margin: '0 auto', paddingTop: '20px' }}>
        <div className="checkout-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Checkout</h1>
          <Link href="/cart" className="btn" style={{ padding: '8px 12px', fontSize: '13px' }}>Back to Cart</Link>
        </div>

        <div className="checkout-container" style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: '32px' }}>
        
        {/* Delivery Options */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>📦 Delivery Options</h2>
          </div>
          <div style={{ border: '1px solid #253049', borderRadius: 6, padding: 12, backgroundColor: 'var(--card)' }}>
          
            <div style={{ display: 'grid', gap: 8 }}>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Fulfillment Method</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ 
                    border: deliveryDetails.fulfillmentType === 'pickup' ? '2px solid var(--primary)' : '1px solid #2a3342', 
                    borderRadius: 4, 
                    padding: '10px 12px', 
                    backgroundColor: paymentCompleted ? '#374151' : 'var(--surface)', 
                    flex: '1', 
                    minWidth: '140px',
                    outline: deliveryDetails.fulfillmentType === 'pickup' ? '2px solid rgba(57, 217, 138, 0.3)' : 'none',
                    outlineOffset: '2px',
                    opacity: paymentCompleted ? 0.7 : 1
                  }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: paymentCompleted ? 'not-allowed' : 'pointer' }}>
                      <input 
                        type="radio" 
                        name="fulfillment" 
                        value="pickup"
                        checked={deliveryDetails.fulfillmentType === 'pickup'}
                        onChange={(e) => setDeliveryDetails(prev => ({ ...prev, fulfillmentType: e.target.value }))}
                        disabled={paymentCompleted}
                      />
                      Store Pickup <span className="hide-on-mobile">(Free)</span>
                    </label>
                  </div>
                  <div style={{ 
                    border: deliveryDetails.fulfillmentType === 'delivery' ? '2px solid var(--primary)' : '1px solid #2a3342', 
                    borderRadius: 4, 
                    padding: '10px 12px', 
                    backgroundColor: paymentCompleted ? '#374151' : 'var(--surface)', 
                    flex: '1', 
                    minWidth: '120px',
                    outline: deliveryDetails.fulfillmentType === 'delivery' ? '2px solid rgba(57, 217, 138, 0.3)' : 'none',
                    outlineOffset: '2px',
                    opacity: paymentCompleted ? 0.7 : 1
                  }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: paymentCompleted ? 'not-allowed' : 'pointer' }}>
                      <input 
                        type="radio" 
                        name="fulfillment" 
                        value="delivery"
                        checked={deliveryDetails.fulfillmentType === 'delivery'}
                        onChange={(e) => setDeliveryDetails(prev => ({ ...prev, fulfillmentType: e.target.value }))}
                        disabled={paymentCompleted}
                      />
                      Home Delivery
                    </label>
                  </div>
                </div>
              </div>

              {/* Delivery Speed Options - Only show when delivery is selected */}
              {deliveryDetails.fulfillmentType === 'delivery' && (
                <>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--primary)' }}>Delivery Speed</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div 
                      style={{ 
                        border: deliveryDetails.deliveryOption === 'standard' ? '2px solid var(--primary)' : '1px solid #2a3342', 
                        borderRadius: 4, 
                        padding: '8px', 
                        backgroundColor: deliveryDetails.deliveryOption === 'standard' ? 'rgba(57, 217, 138, 0.1)' : 'var(--surface)',
                        cursor: paymentCompleted ? 'not-allowed' : 'pointer'
                      }}
                      onClick={() => !paymentCompleted && setDeliveryDetails(prev => ({ ...prev, deliveryOption: 'standard' }))}
                    >
                      <div style={{ fontSize: 12, cursor: paymentCompleted ? 'not-allowed' : 'pointer' }}>
                        <strong>Standard</strong> - {isFreeDelivery ? 'FREE' : `Ksh ${calculateDeliveryFee().toLocaleString('en-KE')}`}
                      </div>
                    </div>
                    <div 
                      style={{ 
                        border: deliveryDetails.deliveryOption === 'express' ? '2px solid var(--primary)' : '1px solid #2a3342', 
                        borderRadius: 4, 
                        padding: '8px', 
                        backgroundColor: deliveryDetails.deliveryOption === 'express' ? 'rgba(57, 217, 138, 0.1)' : 'var(--surface)',
                        cursor: paymentCompleted ? 'not-allowed' : 'pointer'
                      }}
                      onClick={() => !paymentCompleted && setDeliveryDetails(prev => ({ ...prev, deliveryOption: 'express' }))}
                    >
                      <div style={{ fontSize: 12, cursor: paymentCompleted ? 'not-allowed' : 'pointer' }}>
                        <strong>Express</strong> - Ksh {calculateDeliveryFee() > 0 ? 
                          (deliveryDetails.region?.toLowerCase().includes('nairobi') ? 
                            (deliveryDetails.region?.toLowerCase().includes('karen') || deliveryDetails.region?.toLowerCase().includes('embakasi') ? 300 : 250) :
                            deliveryDetails.region?.toLowerCase().includes('kiambu') || deliveryDetails.region?.toLowerCase().includes('kajiado') ? 450 : 600) : 0}
                      </div>
                    </div>
                  </div>
                  
                  {/* Free Delivery Progress Indicator */}
                  {!isFreeDelivery && (
                    <div style={{ marginTop: '8px', padding: '6px', backgroundColor: '#1e293b', borderRadius: '4px', border: '1px solid #374151' }}>
                      <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '2px' }}>
                        Add Ksh {(currentFees.freeDeliveryThreshold - totalAmount).toLocaleString('en-KE')} more for FREE delivery
                      </div>
                      <div style={{ 
                        width: '100%', 
                        height: '4px', 
                        backgroundColor: '#374151', 
                        borderRadius: '2px', 
                        overflow: 'hidden' 
                      }}>
                        <div style={{ 
                          width: `${Math.min((totalAmount / currentFees.freeDeliveryThreshold) * 100, 100)}%`, 
                          height: '100%', 
                          backgroundColor: '#10b981', 
                          transition: 'width 0.3s ease' 
                        }} />
                      </div>
                      <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '1px', textAlign: 'right' }}>
                        {Math.round((totalAmount / currentFees.freeDeliveryThreshold) * 100)}% to free delivery
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Delivery Options Explanation - Only show when delivery is selected */}
              {deliveryDetails.fulfillmentType === 'delivery' && (
                <>
                  <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: 'white' }}>📋 Delivery Information</h3>
                  
                  <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>
                    <p style={{ margin: '0 0 12px', fontWeight: 600 }}>
                      <strong style={{ color: 'var(--primary)' }}>Home Delivery Selected</strong>
                    </p>
                    {isFreeDelivery ? (
                      <div style={{ 
                        padding: '12px', 
                        backgroundColor: '#065f46', 
                        border: '1px solid #10b981', 
                        borderRadius: '6px', 
                        marginBottom: '12px' 
                      }}>
                        <strong style={{ color: '#10b981' }}>🎉 FREE Delivery!</strong>
                        <div style={{ color: '#86efac', fontSize: '12px', marginTop: '4px' }}>
                          Your order qualifies for free delivery (Orders above Ksh {currentFees.freeDeliveryThreshold})
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ 
                          padding: '8px', 
                          backgroundColor: '#1e293b', 
                          border: '1px solid #374151', 
                          borderRadius: '6px', 
                          marginBottom: '12px' 
                        }}>
                          <strong>Current Delivery Fee: Ksh {deliveryFee.toLocaleString('en-KE')}</strong>
                          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                            Based on your location: {deliveryDetails.region || 'Select region to see exact fee'}
                          </div>
                        </div>
                        <ul style={{ margin: '0', paddingLeft: '20px', listStyleType: 'disc' }}>
                          <li style={{ marginBottom: '6px' }}><strong>Nairobi Regions:</strong> Ksh {currentFees.nairobiStandard} (Standard), Ksh {currentFees.nairobiExpress} (Express)</li>
                          <li style={{ marginBottom: '6px' }}><strong>Other Regions:</strong> Ksh {currentFees.otherStandard} (Standard), Ksh {currentFees.otherExpress} (Express)</li>
                          <li style={{ marginBottom: '6px' }}><strong>FREE Delivery:</strong> Orders above Ksh {currentFees.freeDeliveryThreshold}</li>
                          <li style={{ marginBottom: '6px' }}>Delivery hours: Monday-Saturday, 9:00 AM - 6:00 PM</li>
                          <li style={{ marginBottom: '6px' }}>You'll receive SMS/WhatsApp updates on delivery status</li>
                          <li>Someone must be available to receive the package</li>
                        </ul>
                      </>
                    )}
                  </div>
                </>
              )}

              {deliveryDetails.fulfillmentType === 'pickup' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: '12px' }}>
                    <div style={{ border: '1px solid #2a3342', borderRadius: 4, padding: '8px', backgroundColor: 'var(--surface)' }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--primary)' }}>Full Name <span style={{ color: '#dc3545' }}>*</span></label>
                      <input 
                        type="text" 
                        value={deliveryDetails.customerName}
                        onChange={(e) => setDeliveryDetails(prev => ({ ...prev, customerName: e.target.value }))}
                        placeholder="Enter your full name"
                        disabled={paymentCompleted}
                        readOnly
                        style={{ 
                          width: '100%', 
                          padding: '12px 10px', 
                          borderRadius: 4, 
                          border: '1px solid #3a465c', 
                          background: paymentCompleted ? '#374151' : '#374151', 
                          color: 'white', 
                          fontSize: '13px', 
                          boxSizing: 'border-box',
                          cursor: 'not-allowed'
                        }}
                      />
                    </div>
                    <div style={{ border: '1px solid #2a3342', borderRadius: 4, padding: '8px', backgroundColor: 'var(--surface)' }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--primary)' }}>Phone Number <span style={{ color: '#dc3545' }}>*</span></label>
                      <input 
                        type="tel" 
                        value={deliveryDetails.phone}
                        onChange={(e) => setDeliveryDetails(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="0712345678"
                        disabled={paymentCompleted}
                        readOnly
                        style={{ 
                          width: '100%', 
                          padding: '12px 10px', 
                          borderRadius: 4, 
                          border: '1px solid #3a465c', 
                          background: paymentCompleted ? '#374151' : '#374151', 
                          color: 'white', 
                          fontSize: '13px', 
                          boxSizing: 'border-box',
                          cursor: 'not-allowed'
                        }}
                      />
                    </div>
                  </div>
                </>
              )}

              {deliveryDetails.fulfillmentType === 'delivery' && (
                <>
                  {/* Account-based Delivery Info */}
                  <div style={{ 
                    marginTop: '12px', 
                    padding: '12px', 
                    backgroundColor: 'rgba(34, 197, 94, 0.1)', 
                    border: '1px solid rgba(34, 197, 94, 0.3)', 
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: 'var(--text)'
                  }}>
                    ✅ <strong>Delivery information from your account profile</strong> - All delivery details are fetched from your account settings. 
                    <Link href="/account" style={{ color: '#22c55e', textDecoration: 'none', marginLeft: '4px' }}>
                      Update your information in account settings
                    </Link>
                  </div>

                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: '12px' }}>
                    <div style={{ border: '1px solid #2a3342', borderRadius: 4, padding: '8px', backgroundColor: 'var(--surface)' }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--primary)' }}>Full Name <span style={{ color: '#dc3545' }}>*</span></label>
                      <input 
                        type="text" 
                        value={deliveryDetails.customerName}
                        onChange={(e) => setDeliveryDetails(prev => ({ ...prev, customerName: e.target.value }))}
                        placeholder="Enter your full name"
                        disabled={paymentCompleted}
                        readOnly
                        style={{ 
                          width: '100%', 
                          padding: '8px 10px', 
                          borderRadius: 4, 
                          border: '1px solid #3a465c', 
                          background: paymentCompleted ? '#374151' : '#374151', 
                          color: 'white', 
                          fontSize: '13px', 
                          boxSizing: 'border-box',
                          cursor: 'not-allowed'
                        }}
                      />
                    </div>
                    <div style={{ border: '1px solid #2a3342', borderRadius: 4, padding: '8px', backgroundColor: 'var(--surface)' }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--primary)' }}>Phone Number <span style={{ color: '#dc3545' }}>*</span></label>
                      <input 
                        type="tel" 
                        value={deliveryDetails.phone}
                        onChange={(e) => setDeliveryDetails(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="0712345678"
                        disabled={paymentCompleted}
                        readOnly
                        style={{ 
                          width: '100%', 
                          padding: '8px 10px', 
                          borderRadius: 4, 
                          border: '1px solid #3a465c', 
                          background: paymentCompleted ? '#374151' : '#374151', 
                          color: 'white', 
                          fontSize: '13px', 
                          boxSizing: 'border-box',
                          cursor: 'not-allowed'
                        }}
                      />
                    </div>
                  </div>

                  {/* Street Address */}
                  <div style={{ border: '1px solid #2a3342', borderRadius: 4, padding: '8px', backgroundColor: 'var(--surface)', marginTop: '12px' }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--primary)' }}>Street Address <span style={{ color: '#dc3545' }}>*</span></label>
                    <input 
                      type="text"
                      value={deliveryDetails.street}
                      onChange={(e) => setDeliveryDetails(prev => ({ ...prev, street: e.target.value }))}
                      placeholder="Enter street address"
                      disabled={paymentCompleted}
                      readOnly
                      style={{ 
                        width: '100%', 
                        padding: '8px 10px', 
                        borderRadius: 4, 
                        border: '1px solid #3a465c', 
                        background: paymentCompleted ? '#374151' : '#374151', 
                        color: 'white', 
                        fontSize: '13px', 
                        boxSizing: 'border-box',
                        cursor: 'not-allowed'
                      }}
                    />
                  </div>

                  {/* City and Region */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: '12px' }}>
                    <div style={{ border: '1px solid #2a3342', borderRadius: 4, padding: '8px', backgroundColor: 'var(--surface)' }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--primary)' }}>City/Town <span style={{ color: '#dc3545' }}>*</span></label>
                      <input 
                        type="text"
                        value={deliveryDetails.city}
                        onChange={(e) => setDeliveryDetails(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="Enter city"
                        disabled={paymentCompleted}
                        readOnly
                        style={{ 
                          width: '100%', 
                          padding: '8px 10px', 
                          borderRadius: 4, 
                          border: '1px solid #3a465c', 
                          background: paymentCompleted ? '#374151' : '#374151', 
                          color: 'white', 
                          fontSize: '13px', 
                          boxSizing: 'border-box',
                          cursor: 'not-allowed'
                        }}
                      />
                    </div>
                    <div style={{ border: '1px solid #2a3342', borderRadius: 4, padding: '8px', backgroundColor: 'var(--surface)' }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--primary)' }}>Region/County <span style={{ color: '#dc3545' }}>*</span></label>
                      <input 
                        type="text"
                        value={deliveryDetails.region}
                        onChange={(e) => setDeliveryDetails(prev => ({ ...prev, region: e.target.value }))}
                        placeholder="Enter region"
                        disabled={paymentCompleted}
                        readOnly
                        style={{ 
                          width: '100%', 
                          padding: '8px 10px', 
                          borderRadius: 4, 
                          border: '1px solid #3a465c', 
                          background: paymentCompleted ? '#374151' : '#374151', 
                          color: 'white', 
                          fontSize: '13px', 
                          boxSizing: 'border-box',
                          cursor: 'not-allowed'
                        }}
                      />
                    </div>
                  </div>

                  {/* Delivery Instructions */}
                  <div style={{ border: '1px solid #2a3342', borderRadius: 4, padding: '8px', backgroundColor: 'var(--surface)', marginTop: '12px' }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--primary)' }}>Delivery Instructions</label>
                    <textarea 
                      value={deliveryDetails.deliveryInstructions}
                      onChange={(e) => setDeliveryDetails(prev => ({ ...prev, deliveryInstructions: e.target.value }))}
                      placeholder="Special instructions (optional)"
                      disabled={paymentCompleted}
                      style={{ 
                        width: '100%', 
                        padding: '10px', 
                        borderRadius: 4, 
                        border: '1px solid #3a465c', 
                        background: paymentCompleted ? '#374151' : 'var(--bg)', 
                        color: paymentCompleted ? '#9ca3af' : 'var(--text)', 
                        fontSize: '13px', 
                        boxSizing: 'border-box',
                        cursor: paymentCompleted ? 'not-allowed' : 'text',
                        minHeight: '80px',
                        resize: 'vertical',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Payment Section - Always visible until receipt is downloaded */}
        <section>
          <h2 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700 }}>📋 Complete Your Order</h2>
          <div style={{ border: '1px solid #253049', borderRadius: 6, padding: 12, backgroundColor: 'var(--card)' }}>
          
          {/* Order Summary */}
          <div style={{ backgroundColor: 'rgba(42, 51, 66, 0.1)', padding: 8, borderRadius: 4, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
              <span>Subtotal ({totalCount} items):</span>
              <span>Ksh {Number(totalAmount).toLocaleString('en-KE')}</span>
            </div>
            {deliveryFee > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                <span>Delivery Fee:</span>
                <span>Ksh {Number(deliveryFee).toLocaleString('en-KE')}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13, fontWeight: 600 }}>
              <span>Total:</span>
              <span style={{ color: '#22c55e' }}>Ksh {Number(finalTotal).toLocaleString('en-KE')}</span>
            </div>
          </div>

          {/* Promo Code Section */}
          <div style={{ border: '1px solid #2a3342', borderRadius: 4, padding: '12px', backgroundColor: 'var(--surface)', marginTop: '12px' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: 'var(--primary)' }}>🎟️ Promo Code</h3>
            <div style={{ display: 'flex', gap: 8, alignItems: 'end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--muted)' }}>Enter promo code</label>
                <input 
                  type="text" 
                  placeholder="Enter code"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: '1px solid #3a465c', background: 'var(--bg)', color: 'var(--text)', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
              <button 
                className="btn"
                style={{ padding: '8px 16px', fontSize: 12, whiteSpace: 'nowrap', fontWeight: 600, height: 'fit-content' }}
              >
                Apply
              </button>
            </div>
          </div>

          {/* Payment Section */}
          {!deliveryFieldsComplete && (
            <div style={{ 
              fontSize: 12, 
              color: '#856404', 
              marginBottom: 12, 
              padding: '12px', 
              backgroundColor: '#fff3cd', 
              border: '1px solid #ffc107', 
              borderRadius: 4
            }}>
              ⚠️ <strong>Complete Delivery Details:</strong> Please fill in all required delivery information above before proceeding to payment.
              <ul style={{ margin: '8px 0 0 16px', padding: 0 }}>
                {!deliveryDetails.customerName && <li>Full Name is required</li>}
                {!deliveryDetails.phone && <li>Phone Number is required</li>}
                {deliveryDetails.fulfillmentType === 'delivery' && !deliveryDetails.address && <li>Delivery Address is required</li>}
              </ul>
            </div>
          )}
          
          {!orderCompleted && (
            <div style={{ 
              opacity: deliveryFieldsComplete ? 1 : 0.5,
              pointerEvents: deliveryFieldsComplete ? 'auto' : 'none'
            }}>
              <SimplePayment 
                totalAmount={finalTotal}
                subtotalAmount={totalAmount}
                deliveryFee={deliveryFee}
                totalCount={totalCount}
                paymentCompleted={paymentCompleted}
                savedPaymentPhone={paymentPhoneNumber}
                onPaymentComplete={(paymentData) => {
                  if (paymentData && paymentData.depositPaid && !orderCompleted) {
                    setPaymentCompleted(true)
                    
                    // Save the phone number used for payment if available
                    if (paymentData.phoneNumber) {
                      setPaymentPhoneNumber(paymentData.phoneNumber)
                    }

                  // Persist transaction/reference for order saving
                  try {
                    const txId = paymentData.transactionId || paymentData.reference || paymentData.id
                    if (txId) {
                      localStorage.setItem('lastPaymentId', String(txId))
                    }
                  } catch {}
                  
                  // Show completion section, but do NOT mark order as completed yet.
                  // completeOrder() (useEffect) will save to DB and then set orderCompleted.
                  setShowWhatsAppSection(true)
                }
              }}
              disabled={!deliveryFieldsComplete}
            />
          </div>
          )}


          {/* Order Completion Modal */}
          {showWhatsAppSection && (
            <>
              {/* Background overlay */}
              <div className="order-modal-overlay">
                {/* Modal content */}
                <div className="order-modal-content">
                  <div style={{ marginBottom: 12 }}>
                    <div className="order-modal-emoji">🎉</div>
                    <h3 className="order-modal-title">
                      Order Completed Successfully!
                    </h3>
                  </div>
                  
                  <p className="order-modal-order-id">
                    Order ID: <strong>{completedOrderId || 'Processing...'}</strong>
                  </p>
                  <p className="order-modal-description">
                    Your order has been successfully processed and submitted. Please download your receipt for your records.
                  </p>
                  
                  <div className="order-modal-buttons">
                    <button
                      onClick={(e) => {
                        // Prevent any default behavior and event propagation
                        e.preventDefault()
                        e.stopPropagation()
                        
                        try {
                          // Only generate message and open WhatsApp - no state changes
                          const currentDate = new Date()
                          const formattedDate = `${currentDate.getDate().toString().padStart(2, '0')}/${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getFullYear()}`
                          const formattedTime = `${currentDate.getHours().toString().padStart(2, '0')}:${currentDate.getMinutes().toString().padStart(2, '0')}:${currentDate.getSeconds().toString().padStart(2, '0')}`
                          
                          const orderDetails = `🆕 *NEW ORDER REQUEST*
📋 *Order ID:* ${completedOrderId}

👤 *CUSTOMER DETAILS:*
Name: ${deliveryDetails.customerName}
Phone: ${deliveryDetails.phone}
${deliveryDetails.fulfillmentType === 'delivery' ? `Address: ${deliveryDetails.address}` : 'Pickup: Customer will collect from store'}

📋 *ORDER DETAILS:*
${Object.values(items).map((item, index) => `${index + 1}. ${item.name} (${item.condition || 'good'})
   Qty: ${item.qty} × Ksh ${Number(item.price).toLocaleString('en-KE')} = Ksh ${Number(item.price * item.qty).toLocaleString('en-KE')}`).join('\n\n')}

💰 *PAYMENT SUMMARY:*
Subtotal: Ksh ${Number(totalAmount).toLocaleString('en-KE')}${deliveryFee > 0 ? `\nDelivery Fee: Ksh ${Number(deliveryFee).toLocaleString('en-KE')}` : ''}
Total: Ksh ${Number(finalTotal).toLocaleString('en-KE')}
Deposit Paid: Ksh ${Math.round(finalTotal * 0.2).toLocaleString('en-KE')} ✅
Remaining: Ksh ${(finalTotal - Math.round(finalTotal * 0.2)).toLocaleString('en-KE')} (Cash on Delivery)

🕐 *Order Time:* ${formattedDate}, ${formattedTime}
💾 *Order saved to system*
📦 *Customer can track order at:* /my-orders

⚡ *PRIORITY REVIEW REQUESTED*`

                          const whatsappUrl = `https://wa.me/254718176584?text=${encodeURIComponent(orderDetails)}`
                          
                          // Only open WhatsApp - no other actions
                          window.open(whatsappUrl, '_blank')
                          
                          // Mark WhatsApp as sent to enable download button
                          setWhatsappSent(true)
                          
                          console.log('📱 WhatsApp message sent to admin - download button now enabled')
                        } catch (error) {
                          console.error('Error opening WhatsApp:', error)
                          // Fail silently - don't affect page state
                        }
                      }}
                      className="btn order-modal-button"
                      style={{
                        backgroundColor: '#25d366',
                        borderColor: '#25d366',
                        color: 'white'
                      }}
                    >
                      📱 Send to Admin
                    </button>
                    
                    <button
                      onClick={(e) => {
                        console.log('Download button clicked, whatsappSent:', whatsappSent)
                        if (!whatsappSent) {
                          e.preventDefault()
                          console.log('Setting popup to true')
                          setShowPopup(true)
                          return
                        }
                        downloadReceiptAsPDF()
                      }}
                      className="btn order-modal-button"
                      style={{
                        backgroundColor: whatsappSent ? '#dc2626' : '#9ca3af',
                        borderColor: whatsappSent ? '#dc2626' : '#9ca3af',
                        cursor: whatsappSent ? 'pointer' : 'not-allowed',
                        opacity: whatsappSent ? 1 : 0.6
                      }}
                    >
                      📄 Download Receipt
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Custom Popup Modal */}
          {showPopup && (
            <div 
              onClick={() => setShowPopup(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999
              }}>
              <div 
                onClick={(e) => e.stopPropagation()}
                style={{
                  backgroundColor: 'white',
                  padding: '24px',
                  borderRadius: '8px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
                  maxWidth: '400px',
                  width: '90%',
                  textAlign: 'center'
                }}>
                <div style={{
                  fontSize: '48px',
                  marginBottom: '16px'
                }}>📋</div>
                <h3 style={{
                  margin: '0 0 12px',
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#dc2626'
                }}>Order Confirmation Required</h3>
                <p style={{
                  margin: '0 0 20px',
                  fontSize: '14px',
                  color: '#374151',
                  lineHeight: '1.6'
                }}>To ensure faster processing of your order, please first confirm your order details with our admin team via WhatsApp. Once confirmed, you can return here to download your official receipt.</p>
                <div style={{
                  backgroundColor: '#f3f4f6',
                  padding: '12px',
                  borderRadius: '6px',
                  marginBottom: '20px',
                  fontSize: '13px',
                  color: '#6b7280',
                  fontStyle: 'italic'
                }}>💡 This helps us verify your order and expedite delivery</div>
                <button
                  onClick={() => setShowPopup(false)}
                  style={{
                    backgroundColor: '#dc2626',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >OK, Got it!</button>
              </div>
            </div>
          )}

          </div>
        </section>
      </div>
    </div>
    </>
  )
}
