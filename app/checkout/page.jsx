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
  @media (min-width: 1024px) {
    .checkout-container {
      padding-left: 16px !important;
      padding-right: 16px !important;
    }
    .checkout-header {
      padding-left: 16px !important;
      padding-right: 16px !important;
    }
  }
  @media (min-width: 1200px) {
    .checkout-container {
      padding-left: 16px !important;
      padding-right: 16px !important;
    }
    .checkout-header {
      padding-left: 16px !important;
      padding-right: 16px !important;
    }
  }
`

export default function CheckoutPage() {
  const { items, totalAmount, totalCount, isCartLocked, unlockCart, clear } = useCart()
  const { isAuthenticated, user, loading } = useAuth()
  const router = useRouter()
  const list = Object.values(items || {})
  const [isClient, setIsClient] = useState(false)
  const [paymentCompleted, setPaymentCompleted] = useState(false)
  const [orderProcessing, setOrderProcessing] = useState(false)
  const [orderCompleted, setOrderCompleted] = useState(false)
  const [completedOrderId, setCompletedOrderId] = useState(null)
  const [showWhatsAppSection, setShowWhatsAppSection] = useState(false)
  const [receiptDownloaded, setReceiptDownloaded] = useState(false)
  const [paymentPhoneNumber, setPaymentPhoneNumber] = useState('')
  const [whatsappSent, setWhatsappSent] = useState(false)
  const [showPopup, setShowPopup] = useState(false)
  
  const [deliveryDetails, setDeliveryDetails] = useState({
    fulfillmentType: 'pickup',
    customerName: '',
    address: '',
    street: '',
    city: '',
    region: '',
    phone: '',
    altPhone: '',
    deliveryOption: 'standard',
    instructions: ''
  })
  
  const [savedAddress, setSavedAddress] = useState(null)
  const [loadingAddress, setLoadingAddress] = useState(false)
  const [showAddressOptions, setShowAddressOptions] = useState(false)
  
  // Debug log to check default state
  console.log('🔍 Current fulfillmentType:', deliveryDetails.fulfillmentType)
  

  // Authentication check
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, loading, router])

  // Fetch saved delivery address
  const fetchSavedAddress = async () => {
    if (!isAuthenticated) return
    
    setLoadingAddress(true)
    try {
      const response = await fetch('/api/user/delivery-address')
      if (response.ok) {
        const data = await response.json()
        if (data.deliveryAddress && data.deliveryAddress.fullName) {
          setSavedAddress(data.deliveryAddress)
          console.log('📍 Saved address loaded:', data.deliveryAddress)
        }
      }
    } catch (error) {
      console.error('Error fetching saved address:', error)
    } finally {
      setLoadingAddress(false)
    }
  }

  // Use saved address to populate delivery details
  const useSavedAddress = () => {
    if (!savedAddress) return
    
    // Populate both the combined address and individual fields
    const fullAddress = `${savedAddress.street}, ${savedAddress.city}, ${savedAddress.region}${savedAddress.additionalInstructions ? '\n' + savedAddress.additionalInstructions : ''}`
    
    setDeliveryDetails(prev => ({
      ...prev,
      customerName: savedAddress.fullName,
      phone: savedAddress.phone,
      address: fullAddress, // Keep for backward compatibility
      street: savedAddress.street,
      city: savedAddress.city,
      region: savedAddress.region,
      instructions: savedAddress.additionalInstructions || '',
      fulfillmentType: 'delivery' // Switch to delivery when using saved address
    }))
    
    setShowAddressOptions(false)
    console.log('✅ Used saved address for delivery:', savedAddress)
  }

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

  // Fetch saved address when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchSavedAddress()
    }
  }, [isAuthenticated, user])

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

  // Calculate totals
  const deliveryFee = deliveryDetails.fulfillmentType === 'delivery' ? 
    (deliveryDetails.deliveryOption === 'express' ? 300 : 100) : 0
  const finalTotal = totalAmount + deliveryFee

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

  if (!isClient || list.length === 0) {
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
                      🏪 Store Pickup <span className="hide-on-mobile">(Free)</span>
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
                      🚚 Home Delivery
                    </label>
                  </div>
                </div>
              </div>

              {/* Delivery Options Explanation - Only show when delivery is selected */}
              {deliveryDetails.fulfillmentType === 'delivery' && (
                <div style={{ 
                  marginTop: '16px', 
                  padding: '16px', 
                  backgroundColor: 'var(--card)', 
                  borderRadius: 8, 
                  border: '1px solid #253049',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}>
                  <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: 'var(--primary)' }}>📋 Delivery Information</h3>
                  
                  <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>
                    <p style={{ margin: '0 0 12px', fontWeight: 600 }}>
                      <strong style={{ color: 'var(--primary)' }}>🚚 Home Delivery Selected</strong>
                    </p>
                    <ul style={{ margin: '0', paddingLeft: '20px', listStyleType: 'disc' }}>
                      <li style={{ marginBottom: '6px' }}><strong>Standard Delivery (Ksh 100):</strong> 2-3 business days delivery within Nairobi and surrounding areas</li>
                      <li style={{ marginBottom: '6px' }}><strong>Express Delivery (Ksh 300):</strong> Same day delivery for urgent orders</li>
                      <li style={{ marginBottom: '6px' }}>Delivery hours: Monday-Saturday, 9:00 AM - 6:00 PM</li>
                      <li style={{ marginBottom: '6px' }}>You'll receive SMS/WhatsApp updates on delivery status</li>
                      <li>Someone must be available to receive the package</li>
                    </ul>
                  </div>
                </div>
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
                        style={{ 
                          width: '100%', 
                          padding: '12px 10px', 
                          borderRadius: 4, 
                          border: '1px solid #3a465c', 
                          background: paymentCompleted ? '#374151' : 'var(--bg)', 
                          color: paymentCompleted ? '#9ca3af' : 'var(--text)', 
                          fontSize: '13px', 
                          boxSizing: 'border-box',
                          cursor: paymentCompleted ? 'not-allowed' : 'text'
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
                        style={{ 
                          width: '100%', 
                          padding: '12px 10px', 
                          borderRadius: 4, 
                          border: '1px solid #3a465c', 
                          background: paymentCompleted ? '#374151' : 'var(--bg)', 
                          color: paymentCompleted ? '#9ca3af' : 'var(--text)', 
                          fontSize: '13px', 
                          boxSizing: 'border-box',
                          cursor: paymentCompleted ? 'not-allowed' : 'text'
                        }}
                      />
                    </div>
                  </div>
                </>
              )}

              {deliveryDetails.fulfillmentType === 'delivery' && (
                <>
                  {/* Saved Address Option */}
                  {savedAddress && (
                    <div style={{ 
                      marginTop: '12px', 
                      padding: '8px', 
                      backgroundColor: 'rgba(34, 197, 94, 0.1)', 
                      border: '1px solid rgba(34, 197, 94, 0.3)', 
                      borderRadius: '6px' 
                    }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600', color: '#22c55e' }}>
                          📍 Saved Delivery Address
                        </h4>
                        <div style={{ fontSize: '12px', color: 'var(--text)', lineHeight: '1.4', marginBottom: '6px' }}>
                          <div><strong>{savedAddress.fullName}</strong> • {savedAddress.phone}</div>
                          <div>{savedAddress.street}</div>
                          <div>{savedAddress.city}, {savedAddress.region}</div>
                          {savedAddress.additionalInstructions && (
                            <div style={{ fontStyle: 'italic', marginTop: '4px' }}>
                              Note: {savedAddress.additionalInstructions}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            onClick={useSavedAddress}
                            disabled={paymentCompleted}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#22c55e',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: paymentCompleted ? 'not-allowed' : 'pointer',
                              opacity: paymentCompleted ? 0.6 : 1,
                              whiteSpace: 'nowrap'
                            }}
                          >
                            Use This Address
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* No Saved Address - Encourage to save */}
                  {!savedAddress && !loadingAddress && (
                    <div style={{ 
                      marginTop: '12px', 
                      padding: '8px 12px', 
                      backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                      border: '1px solid rgba(59, 130, 246, 0.3)', 
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: 'var(--text)'
                    }}>
                      💡 <Link href="/account" style={{ color: '#3b82f6', textDecoration: 'none' }}>
                        Save your delivery address
                      </Link> in your account to speed up future checkouts
                    </div>
                  )}

                  <div style={{ marginTop: '12px' }}>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Delivery Speed</label>
                    <select 
                      value={deliveryDetails.deliveryOption}
                      onChange={(e) => setDeliveryDetails(prev => ({ ...prev, deliveryOption: e.target.value }))}
                      disabled={paymentCompleted}
                      style={{ 
                        width: '100%', 
                        padding: '10px 10px', 
                        borderRadius: 4, 
                        border: '1px solid #2a3342', 
                        background: paymentCompleted ? '#374151' : 'var(--card)', 
                        color: paymentCompleted ? '#9ca3af' : 'var(--text)', 
                        fontSize: '13px',
                        cursor: paymentCompleted ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <option value="standard">Standard - Ksh 100 (2-3 days)</option>
                      <option value="express">Express - Ksh 300 (Same day)</option>
                    </select>
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
                        style={{ 
                          width: '100%', 
                          padding: '8px 10px', 
                          borderRadius: 4, 
                          border: '1px solid #3a465c', 
                          background: paymentCompleted ? '#374151' : 'var(--bg)', 
                          color: paymentCompleted ? '#9ca3af' : 'var(--text)', 
                          fontSize: '13px', 
                          boxSizing: 'border-box',
                          cursor: paymentCompleted ? 'not-allowed' : 'text'
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
                        style={{ 
                          width: '100%', 
                          padding: '12px 10px', 
                          borderRadius: 4, 
                          border: '1px solid #3a465c', 
                          background: paymentCompleted ? '#374151' : 'var(--bg)', 
                          color: paymentCompleted ? '#9ca3af' : 'var(--text)', 
                          fontSize: '13px', 
                          boxSizing: 'border-box',
                          cursor: paymentCompleted ? 'not-allowed' : 'text'
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
                      style={{ 
                        width: '100%', 
                        padding: '8px 10px', 
                        borderRadius: 4, 
                        border: '1px solid #3a465c', 
                        background: paymentCompleted ? '#374151' : 'var(--bg)', 
                        color: paymentCompleted ? '#9ca3af' : 'var(--text)', 
                        fontSize: '13px', 
                        boxSizing: 'border-box',
                        cursor: paymentCompleted ? 'not-allowed' : 'text'
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
                        style={{ 
                          width: '100%', 
                          padding: '8px 10px', 
                          borderRadius: 4, 
                          border: '1px solid #3a465c', 
                          background: paymentCompleted ? '#374151' : 'var(--bg)', 
                          color: paymentCompleted ? '#9ca3af' : 'var(--text)', 
                          fontSize: '13px', 
                          boxSizing: 'border-box',
                          cursor: paymentCompleted ? 'not-allowed' : 'text'
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
                        style={{ 
                          width: '100%', 
                          padding: '8px 10px', 
                          borderRadius: 4, 
                          border: '1px solid #3a465c', 
                          background: paymentCompleted ? '#374151' : 'var(--bg)', 
                          color: paymentCompleted ? '#9ca3af' : 'var(--text)', 
                          fontSize: '13px', 
                          boxSizing: 'border-box',
                          cursor: paymentCompleted ? 'not-allowed' : 'text'
                        }}
                      />
                    </div>
                  </div>

                  {/* Delivery Instructions */}
                  <div style={{ border: '1px solid #2a3342', borderRadius: 4, padding: '8px', backgroundColor: 'var(--surface)', marginTop: '12px' }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--primary)' }}>Delivery Instructions</label>
                    <input 
                      type="text"
                      value={deliveryDetails.instructions}
                      onChange={(e) => setDeliveryDetails(prev => ({ ...prev, instructions: e.target.value }))}
                      placeholder="Special instructions (optional)"
                      disabled={paymentCompleted}
                      style={{ 
                        width: '100%', 
                        padding: '8px 10px', 
                        borderRadius: 4, 
                        border: '1px solid #3a465c', 
                        background: paymentCompleted ? '#374151' : 'var(--bg)', 
                        color: paymentCompleted ? '#9ca3af' : 'var(--text)', 
                        fontSize: '13px', 
                        boxSizing: 'border-box',
                        cursor: paymentCompleted ? 'not-allowed' : 'text'
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


          {/* Order Completion Section */}
          {showWhatsAppSection && (
            <div style={{ 
              marginTop: '16px',
              padding: '16px',
              backgroundColor: '#d1fae5',
              border: '1px solid #10b981',
              borderRadius: 8,
              textAlign: 'center'
            }}>
              <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600, color: '#065f46' }}>
                🎉 Order Completed Successfully!
              </h3>
              <p style={{ margin: '0 0 12px', fontSize: 14, color: '#047857' }}>
                Order ID: <strong>{completedOrderId || 'Processing...'}</strong>
              </p>
              <p style={{ margin: '0 0 16px', fontSize: 13, color: '#065f46' }}>
                Your order has been successfully processed and submitted. Please download your receipt for your records.
              </p>
              
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
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
                  className="btn"
                  style={{ 
                    padding: '8px 16px', 
                    fontSize: 13, 
                    fontWeight: 600,
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
                  className="btn"
                  style={{ 
                    padding: '8px 16px', 
                    fontSize: 13, 
                    fontWeight: 600,
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
