'use client'

import { useCart } from './CartContext'
import { useEffect, useState } from 'react'

export default function ProductActions({ product, onPopupStateChange }) {
  const { addItem, removeItem, items, isCartLocked, lockedCartItems, checkDepositPaymentStatus } = useCart()
  const [mounted, setMounted] = useState(false)
  const [hasDepositPaid, setHasDepositPaid] = useState(false)
  const [popupState, setPopupState] = useState({ show: false, action: null })

  useEffect(() => {
    setMounted(true)
    
    // Check deposit payment status (now async)
    const checkPayment = async () => {
      if (checkDepositPaymentStatus) {
        const hasDeposit = await checkDepositPaymentStatus()
        setHasDepositPaid(hasDeposit)
      }
    }
    
    checkPayment()
    const interval = setInterval(checkPayment, 5000) // Check every 5 seconds instead of 1
    
    return () => {
      clearInterval(interval)
    }
  }, [product.name, checkDepositPaymentStatus])

  const disabled = String(product?.status || '').toLowerCase() === 'sold'
  const isInCart = mounted ? !!items[product.id] : false
  
  // Only lock if cart is actually locked AND has items in it
  const hasValidLockedCart = mounted && isCartLocked && Object.keys(lockedCartItems).length > 0
  const isLockedOut = mounted && hasValidLockedCart && !lockedCartItems[product.id] && !isInCart
  const buttonDisabled = disabled || isLockedOut

  // Debug logging
  console.log('🔍 ProductActions Debug:', {
    productName: product.name,
    isCartLocked,
    lockedCartItemsCount: Object.keys(lockedCartItems).length,
    hasValidLockedCart,
    isLockedOut,
    buttonDisabled,
    hasDepositPaid,
    currentItemsCount: Object.keys(items).length
  })

  return (
    <div className="product-actions-container" style={{ position: 'relative' }}>
      <button
        className={`btn product-action-btn ${
          isInCart ? 'in-cart-btn' : 
          isLockedOut ? 'btn-locked' : 
          'btn-primary'
        }`}
        disabled={buttonDisabled}
        style={{
          padding: '8px 14px',
          fontSize: '13px',
          fontWeight: '600',
          ...(isInCart ? { backgroundColor: '#28a745', color: 'white' } : {}),
          ...(isLockedOut ? { backgroundColor: '#6c757d', color: 'white', cursor: 'not-allowed' } : {})
        }}
        onClick={() => {
          // Debug logging before check
          console.log('🔍 ProductActions Click Debug:', {
            productName: product.name,
            hasValidLockedCart,
            isCartLocked,
            lockedCartItemsCount: Object.keys(lockedCartItems).length,
            willDispatchEvent: hasValidLockedCart
          })
          
          // Only prevent action if cart is actually locked AND has items
          if (hasValidLockedCart) {
            console.log('🚫 Dispatching cartLockError event for:', product.name)
            // Trigger the same notification as on home page
            window.dispatchEvent(new CustomEvent('cartLockError', {
              detail: {
                message: 'You need to first complete the products paid for. Your cart is locked because you have made a deposit payment. Please complete your current order before adding new items.',
                productName: product.name
              }
            }))
            return;
          }
          
          if (isInCart) {
            removeItem(product.id);
            // Show popup on image
            const newState = { show: true, action: 'removed' };
            setPopupState(newState);
            if (onPopupStateChange) onPopupStateChange(newState);
            setTimeout(() => {
              const endState = { show: false, action: null };
              setPopupState(endState);
              if (onPopupStateChange) onPopupStateChange(endState);
            }, 2000);
          } else {
            addItem({
              id: product.id,
              name: product.name,
              price: product.price,
              image: product.image,
              condition: product.condition || 'unknown',
              category: product.category || 'unknown'
            }, 1);
            // Show popup on image
            const newState = { show: true, action: 'added' };
            setPopupState(newState);
            if (onPopupStateChange) onPopupStateChange(newState);
            setTimeout(() => {
              const endState = { show: false, action: null };
              setPopupState(endState);
              if (onPopupStateChange) onPopupStateChange(endState);
            }, 1500);
          }
        }}
        aria-disabled={buttonDisabled}
        title={isLockedOut ? 'Complete your current order before adding new products' : ''}
      >
{isInCart ? 'Remove' : 'Add to Cart'}
      </button>
      
      <style jsx>{`
        .btn-locked {
          opacity: 0.7;
        }
        
        .btn-locked:hover {
          opacity: 0.8;
        }
      `}</style>
    </div>
  )
}
