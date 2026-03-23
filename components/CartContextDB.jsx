'use client'

import { createContext, useContext, useCallback, useEffect, useState, useMemo } from 'react'
import { useAuth } from './AuthContext'

const CartContext = createContext()

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return ctx
}

function maxQtyForCondition(condition) {
  switch (condition?.toLowerCase()) {
    case 'brand new': return 1
    case 'excellent': return 1
    case 'good': return 2
    case 'fair': return 3
    default: return 2
  }
}

export function CartProvider({ children }) {
  const { user, isAuthenticated } = useAuth()
  const [items, setItems] = useState({})
  const [isCartLocked, setIsCartLocked] = useState(false)
  const [lockedCartItems, setLockedCartItems] = useState({})
  const [loading, setLoading] = useState(true)
  const [cartId, setCartId] = useState(null)

  // Load cart from database
  const loadCart = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setItems({})
      setIsCartLocked(false)
      setLockedCartItems({})
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/cart')
      
      if (response.ok) {
        const data = await response.json()
        setItems(data.cart.items || {})
        setIsCartLocked(data.cart.is_locked || false)
        setCartId(data.cart.id)
        
        // Store locked items separately
        if (data.cart.is_locked) {
          setLockedCartItems(data.cart.items || {})
        } else {
          setLockedCartItems({})
        }
      } else {
        console.error('Failed to load cart:', response.statusText)
      }
    } catch (error) {
      console.error('Error loading cart:', error)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, user])

  // Check cart lock status from database
  const checkCartLockStatus = useCallback(async () => {
    if (!isAuthenticated || !user) return false

    try {
      const response = await fetch('/api/cart/lock')
      
      if (response.ok) {
        const data = await response.json()
        setIsCartLocked(data.is_locked)
        
        // If cart is unlocked but we still have locked items, clear them
        if (!data.is_locked && Object.keys(lockedCartItems).length > 0) {
          setLockedCartItems({})
        }
        
        return data.is_locked
      }
    } catch (error) {
      console.error('Error checking cart lock status:', error)
    }
    
    return false
  }, [isAuthenticated, user, lockedCartItems])

  // Load cart on auth state change
  useEffect(() => {
    loadCart()
  }, [loadCart])

  // Periodically check cart lock status
  useEffect(() => {
    if (!isAuthenticated) return

    const interval = setInterval(checkCartLockStatus, 5000) // Check every 5 seconds
    return () => clearInterval(interval)
  }, [checkCartLockStatus, isAuthenticated])

  // Add item to cart
  const addItem = useCallback(async (product, qty = 1) => {
    if (!isAuthenticated) {
      console.log('🚫 User not authenticated, cannot add to cart')
      return
    }

    // Check if cart is locked and has items
    if (isCartLocked && Object.keys(lockedCartItems).length > 0) {
      const isExistingLockedItem = lockedCartItems[product.id]
      const isCurrentlyInCart = items[product.id]
      
      // Only allow adding if item was in the original cart when deposit was paid
      if (!isExistingLockedItem && !isCurrentlyInCart) {
        console.log('🚫 Blocking new product addition - cart is locked')
        
        // Show error notification
        if (typeof window !== "undefined") {
          const event = new CustomEvent('cartLockError', {
            detail: {
              productId: product.id,
              productName: product.name,
              isCartLocked: isCartLocked,
              action: 'add',
              message: 'Cart is locked - cannot add items'
            }
          })
          window.dispatchEvent(event)
        }
        return
      }
    }

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.img,
          condition: product.condition,
          quantity: qty,
          category: product.category || 'general'
        })
      })

      if (response.ok) {
        // Reload cart to get updated state
        await loadCart()
      } else {
        console.error('Failed to add item to cart:', response.statusText)
      }
    } catch (error) {
      console.error('Error adding item to cart:', error)
    }
  }, [isAuthenticated, isCartLocked, lockedCartItems, items, loadCart])

  // Update item quantity
  const setQty = useCallback(async (productId, qty) => {
    if (!isAuthenticated) return

    // Check if cart is locked
    if (isCartLocked && Object.keys(lockedCartItems).length > 0) {
      console.log('🚫 Blocking quantity change - cart is locked')
      
      // Show error notification
      if (typeof window !== "undefined") {
        const event = new CustomEvent('cartLockError', {
          detail: {
            productId: productId,
            isCartLocked: isCartLocked
          }
        })
        window.dispatchEvent(event)
      }
      return
    }

    try {
      const response = await fetch('/api/cart', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          quantity: qty
        })
      })

      if (response.ok) {
        // Reload cart to get updated state
        await loadCart()
      } else {
        console.error('Failed to update cart:', response.statusText)
      }
    } catch (error) {
      console.error('Error updating cart:', error)
    }
  }, [isAuthenticated, isCartLocked, lockedCartItems, loadCart])

  // Remove item from cart
  const removeItem = useCallback(async (productId) => {
    if (!isAuthenticated) return

    // Check if cart is locked
    if (isCartLocked && Object.keys(lockedCartItems).length > 0) {
      console.log('🚫 Blocking item removal - cart is locked')
      
      // Show error notification
      if (typeof window !== "undefined") {
        const event = new CustomEvent('cartLockError', {
          detail: {
            productId: productId,
            isCartLocked: isCartLocked
          }
        })
        window.dispatchEvent(event)
      }
      return
    }

    try {
      const response = await fetch('/api/cart', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          quantity: 0 // Setting quantity to 0 removes the item
        })
      })

      if (response.ok) {
        // Reload cart to get updated state
        await loadCart()
      } else {
        console.error('Failed to remove item from cart:', response.statusText)
      }
    } catch (error) {
      console.error('Error removing item from cart:', error)
    }
  }, [isAuthenticated, isCartLocked, lockedCartItems, loadCart])

  // Clear cart
  const clear = useCallback(async (forceOverride = false) => {
    if (!isAuthenticated) return false

    // Check if cart is locked
    if (!forceOverride && isCartLocked && Object.keys(lockedCartItems).length > 0) {
      console.log('🔒 BLOCKED: Cannot clear cart - cart is locked')
      
      // Dispatch event to notify user
      if (typeof window !== "undefined") {
        const event = new CustomEvent('cartClearBlocked', {
          detail: {
            reason: 'cart_locked',
            message: 'Cannot clear cart: Cart is locked'
          }
        })
        window.dispatchEvent(event)
      }
      return false
    }

    try {
      const response = await fetch('/api/cart', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          forceClear: forceOverride
        })
      })

      if (response.ok) {
        // Reload cart to get updated state
        await loadCart()
        return true
      } else {
        console.error('Failed to clear cart:', response.statusText)
        return false
      }
    } catch (error) {
      console.error('Error clearing cart:', error)
      return false
    }
  }, [isAuthenticated, isCartLocked, lockedCartItems, loadCart])

  // Lock cart
  const lockCart = useCallback(async (depositPaid = true, paymentData = null) => {
    if (!isAuthenticated) return

    if (depositPaid) {
      console.log('🔒 Locking cart with items:', items)
      
      try {
        const response = await fetch('/api/cart/lock', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'lock',
            paymentData: paymentData
          })
        })

        if (response.ok) {
          setIsCartLocked(true)
          setLockedCartItems({...items})
          
          // Dispatch event to notify other components
          if (typeof window !== "undefined") {
            const event = new CustomEvent('cartLocked', {
              detail: { 
                items: {...items},
                timestamp: new Date().toISOString(),
                itemCount: Object.keys(items).length,
                totalQuantity: Object.values(items).reduce((sum, item) => sum + (item.qty || 1), 0)
              }
            })
            console.log('🔒 Dispatching cartLocked event with items:', Object.keys(items).length, 'items')
            window.dispatchEvent(event)
          }
        } else {
          console.error('Failed to lock cart:', response.statusText)
        }
      } catch (error) {
        console.error('Error locking cart:', error)
      }
    } else {
      console.log('🔒 lockCart called but depositPaid is false, not locking')
    }
  }, [isAuthenticated, items])

  // Unlock cart
  const unlockCart = useCallback(async () => {
    if (!isAuthenticated) return

    console.log('🔓 Unlocking cart')
    
    try {
      const response = await fetch('/api/cart/lock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'unlock'
        })
      })

      if (response.ok) {
        setIsCartLocked(false)
        setLockedCartItems({})
        
        // Dispatch event to notify other components
        if (typeof window !== "undefined") {
          const event = new CustomEvent('cartUnlocked')
          window.dispatchEvent(event)
        }
      } else {
        console.error('Failed to unlock cart:', response.statusText)
      }
    } catch (error) {
      console.error('Error unlocking cart:', error)
    }
  }, [isAuthenticated])

  // Check deposit payment status (now uses database)
  const checkDepositPaymentStatus = useCallback(async () => {
    if (!isAuthenticated) return false
    
    // Check if cart is locked in database
    const isLocked = await checkCartLockStatus()
    return isLocked
  }, [isAuthenticated, checkCartLockStatus])

  // Calculate totals
  const totalAmount = useMemo(() => {
    return Object.values(items).reduce((sum, item) => {
      return sum + (item.price || 0) * (item.qty || 0)
    }, 0)
  }, [items])

  const totalCount = useMemo(() => {
    return Object.values(items).reduce((sum, item) => sum + (item.qty || 0), 0)
  }, [items])

  const value = {
    items,
    addItem,
    setQty,
    removeItem,
    clear,
    totalAmount,
    totalCount,
    maxQtyForCondition,
    isCartLocked,
    lockedCartItems,
    lockCart,
    unlockCart,
    checkDepositPaymentStatus,
    loading,
    cartId,
    loadCart
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}
