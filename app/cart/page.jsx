'use client'

import { useState, useEffect } from 'react'
import { useCart } from '../../components/CartContext'
import { useRouter } from 'next/navigation'
import QuantitySelector from '../../components/QuantitySelector'
import Link from 'next/link'

export default function CartPage() {
  const router = useRouter()
  const { items, setQty, removeItem, clear, totalAmount, totalCount, maxQtyForCondition, isCartLocked, lockedCartItems } = useCart()
  const list = Object.values(items || {})
  const [clickedRemoveItems, setClickedRemoveItems] = useState(new Set())
  const [isClient, setIsClient] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showLockMessage, setShowLockMessage] = useState(false)
  const [cancelClicked, setCancelClicked] = useState(false)
  const [clearClicked, setClearClicked] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleClearCart = () => {
    if (!isCartLocked) {
      setShowClearConfirm(true)
    } else {
      setShowLockMessage(true)
      setTimeout(() => setShowLockMessage(false), 4000)
    }
  }

  const confirmClearCart = () => {
    setClearClicked(true)
    clear()
    setTimeout(() => {
      setShowClearConfirm(false)
      setClearClicked(false)
    }, 500)
  }

  const cancelClearCart = () => {
    setCancelClicked(true)
    setTimeout(() => {
      setShowClearConfirm(false)
      setCancelClicked(false)
    }, 500)
  }

  if (!isClient) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: '16px 14px 0' }}>
          <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Your Cart</h1>
          <Link href="/#collection" className="btn" style={{ padding: '10px 16px', fontSize: '15px' }}>Continue Shopping</Link>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center', color: 'var(--muted)', padding: '24px 16px' }}>
          <p style={{ margin: 0, fontSize: 16 }}>Loading cart...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, padding: '12px 14px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Your Cart</h1>
          {isCartLocked && showLockMessage && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 6, 
              padding: '4px 8px', 
              backgroundColor: '#28a745', 
              color: 'white', 
              borderRadius: 4, 
              fontSize: 11, 
              fontWeight: 600 
            }}>
              🔒 Locked - Deposit Paid
            </div>
          )}
        </div>
        <Link href="/#collection" className="btn" style={{ padding: '7px 12px', fontSize: '13px' }}>Continue Shopping</Link>
      </div>

      {list.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center', color: 'var(--muted)', padding: '48px 16px', border: '1px dashed #2a3342', borderRadius: 12 }}>
          <p style={{ margin: 0, fontSize: 16 }}>Your cart is empty.</p>
          <Link href="/#collection" className="btn btn-primary">Back to Products</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: '0 14px 28px' }}>
          
          {/* Cart Items List */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 600, color: 'white' }}>🛒 Review Your Items</h2>
            
            {list.map(it => {
              const max = maxQtyForCondition(it.condition)
              const lineTotal = (it.qty || 0) * (it.price || 0)
              return (
                <div key={it.id} style={{ display: 'flex', gap: 12, padding: 12, border: '1px solid #253049', borderRadius: 7, backgroundColor: 'var(--card)' }}>
                  <img src={it.img} alt={it.name} width={70} height={56} style={{ objectFit: 'cover', borderRadius: 5 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{it.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{it.condition || '—'}</div>
                      </div>
                      <button 
                        className="btn btn-small" 
                        onClick={() => {
                          if (!isCartLocked) {
                            setClickedRemoveItems(prev => new Set([...prev, it.id]))
                            removeItem(it.id)
                          } else {
                            setShowLockMessage(true)
                            setTimeout(() => setShowLockMessage(false), 4000)
                          }
                        }} 
                        disabled={isCartLocked}
                        aria-label={`Remove ${it.name}`} 
                        title={isCartLocked ? "Cannot remove items - cart is locked with deposit payment" : `Remove ${it.name}`}
                        style={{ 
                          fontSize: 11, 
                          padding: '4px 7px',
                          color: clickedRemoveItems.has(it.id) ? 'red' : 'inherit',
                          opacity: isCartLocked ? 0.5 : 1,
                          cursor: isCartLocked ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {isCartLocked ? '🔒' : 'Remove'}
                      </button>
                    </div>
                    <div style={{ flex: 1 }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 7 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--muted)' }}>Qty:</span>
                        <QuantitySelector
                          quantity={it.qty}
                          maxQuantity={max}
                          onQuantityChange={(newQty) => setQty(it.id, newQty)}
                          disabled={isCartLocked}
                          onLockedAttempt={() => {
                            setShowLockMessage(true)
                            setTimeout(() => setShowLockMessage(false), 4000)
                          }}
                        />
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--primary)' }}>
                        Ksh {Number(lineTotal).toLocaleString('en-KE')}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </section>

          {/* Order Summary */}
          <section style={{ border: '1px solid #253049', borderRadius: 7, padding: 14, backgroundColor: 'var(--card)' }}>
            <h2 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600, color: 'white' }}>📋 Order Summary</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span>Items ({totalCount}):</span>
                <span>Ksh {Number(totalAmount).toLocaleString('en-KE')}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--muted)' }}>
                <span>Delivery:</span>
                <span>Calculated at checkout</span>
              </div>
              
              <div style={{ height: 1, backgroundColor: '#253049', margin: '7px 0' }} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 600 }}>
                <span>Subtotal:</span>
                <span style={{ color: 'var(--primary)' }}>Ksh {Number(totalAmount).toLocaleString('en-KE')}</span>
              </div>
              
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 7 }}>
                * Final total including delivery will be calculated at checkout
              </div>
            </div>
          </section>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button 
              onClick={() => router.push('/checkout')}
              className="btn btn-primary" 
              style={{ 
                padding: '10px 20px', 
                fontSize: 14, 
                fontWeight: 500, 
                textAlign: 'center',
                flex: 1,
                cursor: 'pointer'
              }}
            >
              Continue to Checkout
            </button>
            
            <button 
              onClick={handleClearCart}
              disabled={isCartLocked}
              className="btn"
              title={isCartLocked ? "Cannot clear cart - locked with deposit payment" : "Clear all items from cart"}
              style={{ 
                padding: '10px 16px', 
                fontSize: 13,
                opacity: isCartLocked ? 0.5 : 1,
                cursor: isCartLocked ? 'not-allowed' : 'pointer',
                minWidth: '100px'
              }}
            >
              {isCartLocked ? '🔒 Locked' : 'Clear Cart'}
            </button>
          </div>
        </div>
      )}

      {/* Clear Cart Confirmation Modal */}
      {showClearConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'var(--card)',
            border: '1px solid #253049',
            borderRadius: 12,
            padding: 24,
            maxWidth: 400,
            width: '90%',
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>🗑️</div>
              <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600 }}>
                Clear Your Cart?
              </h3>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14, lineHeight: 1.5 }}>
                Are you sure you want to remove all items from your cart? This action cannot be undone and you'll lose all your selected products.
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button 
                onClick={cancelClearCart}
                className="btn"
                style={{ 
                  padding: '10px 20px', 
                  fontSize: 14, 
                  minWidth: '100px',
                  color: cancelClicked ? '#0066ff' : 'var(--text)',
                  transition: 'color 0.3s ease'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmClearCart}
                className="btn"
                style={{ 
                  padding: '10px 8px !important', 
                  fontSize: '14px !important', 
                  minWidth: '70px !important',
                  backgroundColor: 'transparent !important',
                  borderColor: 'transparent !important',
                  color: clearClicked ? '#ff0000' : '#dc2626',
                  transition: 'color 0.3s ease'
                }}
              >
                Yes, Clear Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
