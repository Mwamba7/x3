'use client'

import { useState } from 'react'
import { useCart } from '../../components/CartContext'
import QuantitySelector from '../../components/QuantitySelector'
import Link from 'next/link'

export default function CartPage() {
  const { items, setQty, removeItem, clear, totalAmount, totalCount, maxQtyForCondition } = useCart()
  const [clickedRemoveItems, setClickedRemoveItems] = useState(new Set())
  const [deliveryDetails, setDeliveryDetails] = useState({
    fulfillmentType: 'pickup', // 'pickup' or 'delivery'
    address: '',
    phone: '',
    altPhone: '',
    deliveryOption: 'standard',
    instructions: ''
  })
  const [showValidationPopup, setShowValidationPopup] = useState(false)
  const list = Object.values(items)

  const validateFulfillmentDetails = () => {
    if (deliveryDetails.fulfillmentType === 'pickup') {
      // For pickup, only phone is required
      if (!deliveryDetails.phone.trim()) {
        return { isValid: false, message: 'Please provide your phone number to proceed with pickup.' }
      }
    } else if (deliveryDetails.fulfillmentType === 'delivery') {
      // For delivery, phone and address are required
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

  const generateWhatsAppMessage = () => {
    const orderItems = list.map(i => `${i.name} x${i.qty}`).join(', ')
    
    let deliveryCost = 0
    let fulfillmentInfo = ''
    
    if (deliveryDetails.fulfillmentType === 'pickup') {
      fulfillmentInfo = 'Shop Pickup - Free'
    } else {
      fulfillmentInfo = deliveryDetails.deliveryOption === 'express' ? 'Express Delivery (Same day) - Ksh 300' : 'Standard Delivery (2-3 days) - Free'
      deliveryCost = deliveryDetails.deliveryOption === 'express' ? 300 : 0
    }
    
    const finalTotal = totalAmount + deliveryCost
    
    let message = `🛒 *ORDER DETAILS*\n`
    message += `Items: ${orderItems}\n`
    message += `Subtotal: Ksh ${Number(totalAmount).toLocaleString('en-KE')}\n`
    message += `Fulfillment: ${fulfillmentInfo}\n`
    message += `*Total: Ksh ${Number(finalTotal).toLocaleString('en-KE')}*\n\n`
    
    if (deliveryDetails.fulfillmentType === 'pickup') {
      message += `🏪 *PICKUP DETAILS*\n`
      message += `Method: Shop Pickup\n`
      message += `Contact: ${deliveryDetails.phone || 'Not provided'}\n`
      message += `Note: Please bring this order confirmation when picking up\n`
    } else {
      message += `📍 *DELIVERY DETAILS*\n`
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
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
              <span>Subtotal ({totalCount} items)</span>
              <strong>Ksh {Number(totalAmount).toLocaleString('en-KE')}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
              <span>{deliveryDetails.fulfillmentType === 'pickup' ? 'Pickup' : 'Delivery'}</span>
              <strong>Ksh {deliveryDetails.fulfillmentType === 'pickup' ? '0' : (deliveryDetails.deliveryOption === 'express' ? '300' : '0')}</strong>
            </div>
            <div style={{ height: 1, background: '#253049', margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 14, fontWeight: 700 }}>
              <span>Total</span>
              <strong>Ksh {Number(totalAmount + (deliveryDetails.fulfillmentType === 'pickup' ? 0 : (deliveryDetails.deliveryOption === 'express' ? 300 : 0))).toLocaleString('en-KE')}</strong>
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <input type="text" placeholder="Promo Code" style={{ flex: 1, borderRadius: 6, border: '1px solid #2a3342', background: 'transparent', color: 'var(--text)', padding: '6px 8px', fontSize: 13 }} />
              <button className="btn btn-small" style={{ fontSize: 12, padding: '6px 8px' }}>Apply</button>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <a 
                className="btn btn-primary"
                href={`https://wa.me/254718176584?text=${encodeURIComponent(generateWhatsAppMessage())}`}
                target="_blank" 
                rel="noopener noreferrer"
                onClick={handleWhatsAppCheckout}
                style={{ flex: 1, textAlign: 'center', fontSize: 13, padding: '8px 12px' }}
              >
                Checkout via WhatsApp
              </a>
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
  )
}
