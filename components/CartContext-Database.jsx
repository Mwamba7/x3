'use client'
import { createContext, useContext, useCallback, useEffect, useState, useMemo } from 'react'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth()
  
  // Add flag to prevent cart state changes during order completion
  const [isOrderCompleting, setIsOrderCompleting] = useState(false)
  
  // Cart state - now fetched from database
  const [items, setItems] = useState({})
  const [isCartLocked, setIsCartLocked] = useState(false)
  const [lockedCartItems, setLockedCartItems] = useState({})
  const [loading, setLoading] = useState(false)
  const [cartId, setCartId] = useState(null)

  // Fetch cart from database
  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setItems({})
      setIsCartLocked(false)
      setCartId(null)
      return
    }

    try {
      setLoading(true)
      console.log('🛒 Fetching cart from database...')
      
      const response = await fetch('/api/cart/database')
      
      if (!response.ok) {
        console.error('❌ Failed to fetch cart:', response.statusText)
        return
      }
      
      const data = await response.json()
      
      if (data.success) {
        console.log('🛒 Cart fetched from database:', data.cart)
        setItems(data.cart.items || {})
        setIsCartLocked(data.cart.is_locked || false)
        setCartId(data.cart.id)
        
        // Set locked cart items if cart is locked
        if (data.cart.is_locked) {
          setLockedCartItems(data.cart.items || {})
        } else {
          setLockedCartItems({})
        }
      }
    } catch (error) {
      console.error('❌ Error fetching cart:', error)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  // Initialize cart when user authenticates
  useEffect(() => {
    if (isAuthenticated) {
      console.log('🔍 DEBUG: User authenticated, fetching cart from database')
      fetchCart()
    } else {
      console.log('🔒 DEBUG: User not authenticated, clearing cart')
      setItems({})
      setIsCartLocked(false)
      setCartId(null)
    }
  }, [isAuthenticated, fetchCart])

  // Add item to cart (database operation)
  const addItem = useCallback(async (product, qty = 1) => {
    // Check if cart is locked
    if (isCartLocked) {
      console.log('🚫 Blocking item addition - cart is locked')
      
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
      return false
    }

    try {
      console.log('➕ Adding item to database cart:', product.name, qty)
      
      const response = await fetch('/api/cart/database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          condition: product.condition,
          quantity: qty,
          category: product.category
        })
      })

      const data = await response.json()

      if (data.success) {
        console.log('✅ Item added to database cart')
        // Refresh cart data
        await fetchCart()
        return true
      } else {
        console.error('❌ Failed to add item:', data.error)
        return false
      }
    } catch (error) {
      console.error('❌ Error adding item to cart:', error)
      return false
    }
  }, [isCartLocked, fetchCart])

  // Set item quantity (database operation)
  const setQty = useCallback(async (productId, qty) => {
    // Check if cart is locked
    if (isCartLocked) {
      console.log('🚫 Blocking quantity update - cart is locked')
      
      // Show error notification
      if (typeof window !== "undefined") {
        const event = new CustomEvent('cartLockError', {
          detail: {
            productId: productId,
            isCartLocked: isCartLocked,
            action: 'update',
            message: 'Cart is locked - cannot modify items'
          }
        })
        window.dispatchEvent(event)
      }
      return false
    }

    try {
      console.log('🔄 Updating item quantity in database cart:', productId, qty)
      
      const response = await fetch('/api/cart/database', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: productId,
          quantity: qty
        })
      })

      const data = await response.json()

      if (data.success) {
        console.log('✅ Item quantity updated in database cart')
        // Refresh cart data
        await fetchCart()
        return true
      } else {
        console.error('❌ Failed to update quantity:', data.error)
        return false
      }
    } catch (error) {
      console.error('❌ Error updating item quantity:', error)
      return false
    }
  }, [isCartLocked, fetchCart])

  // Remove item from cart (database operation)
  const removeItem = useCallback(async (productId) => {
    // Check if cart is locked
    if (isCartLocked) {
      console.log('🚫 Blocking item removal - cart is locked')
      
      // Show error notification
      if (typeof window !== "undefined") {
        const event = new CustomEvent('cartLockError', {
          detail: {
            productId: productId,
            isCartLocked: isCartLocked,
            action: 'remove',
            message: 'Cart is locked - cannot remove items'
          }
        })
        window.dispatchEvent(event)
      }
      return false
    }

    try {
      console.log('🗑️ Removing item from database cart:', productId)
      
      const response = await fetch('/api/cart/database', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: productId
        })
      })

      const data = await response.json()

      if (data.success) {
        console.log('✅ Item removed from database cart')
        // Refresh cart data
        await fetchCart()
        return true
      } else {
        console.error('❌ Failed to remove item:', data.error)
        return false
      }
    } catch (error) {
      console.error('❌ Error removing item from cart:', error)
      return false
    }
  }, [isCartLocked, fetchCart])

  // Clear cart (database operation)
  const clear = useCallback(async (forceOverride = false) => {
    // PROTECTION: Check if cart is locked
    if (!forceOverride && isCartLocked) {
      console.log('🔒 BLOCKED: Cannot clear cart from context - cart is locked')
      
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
    
    console.log('🧹 Clearing cart from database (override:', forceOverride, ')')
    
    try {
      const response = await fetch('/api/cart/database', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          forceClear: forceOverride
        })
      })

      const data = await response.json()

      if (data.success) {
        console.log('✅ Cart cleared from database')
        // Refresh cart data
        await fetchCart()
        return true
      } else {
        console.error('❌ Failed to clear cart:', data.error)
        return false
      }
    } catch (error) {
      console.error('❌ Error clearing cart:', error)
      return false
    }
  }, [isCartLocked, fetchCart])

  // Lock cart (database operation)
  const lockCart = useCallback(async (depositPaid = true) => {
    if (depositPaid) {
      console.log('🔒 Locking cart in database with items:', items)
      
      try {
        const response = await fetch('/api/cart/database/lock', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'lock',
            paymentData: { depositPaid }
          })
        })

        const data = await response.json()

        if (data.success) {
          console.log('✅ Cart locked in database')
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
            window.dispatchEvent(event)
          }
        } else {
          console.error('❌ Failed to lock cart:', data.error)
        }
      } catch (error) {
        console.error('❌ Error locking cart:', error)
      }
    } else {
      console.log('🔒 lockCart called but depositPaid is false, not locking')
    }
  }, [items])

  // Unlock cart (database operation)
  const unlockCart = useCallback(async () => {
    console.log('🔓 Unlocking cart in database')
    
    try {
      const response = await fetch('/api/cart/database/lock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'unlock'
        })
      })

      const data = await response.json()

      if (data.success) {
        console.log('✅ Cart unlocked in database')
        setIsCartLocked(false)
        setLockedCartItems({})
        
        // Dispatch event to notify other components
        if (typeof window !== "undefined") {
          const event = new CustomEvent('cartUnlocked')
          window.dispatchEvent(event)
        }
      } else {
        console.error('❌ Failed to unlock cart:', data.error)
      }
    } catch (error) {
      console.error('❌ Error unlocking cart:', error)
    }
  }, [])

  // Check if there's a deposit payment in database (replaces localStorage)
  const checkDepositPaymentStatus = useCallback(async () => {
    if (!isAuthenticated) return false
    
    // Skip check if order is currently being completed to prevent race conditions
    if (isOrderCompleting) {
      console.log('⏳ Skipping deposit status check - order is being completed')
      return isCartLocked
    }
    
    try {
      console.log('🔍 DEBUG: Checking deposit payment status from database...')
      
      const response = await fetch('/api/deposit-status')
      
      if (!response.ok) {
        console.error('❌ Failed to check deposit status:', response.statusText)
        return false
      }
      
      const data = await response.json()
      console.log('🔍 DEBUG: Deposit status API response:', data)
      
      if (data.success) {
        console.log('💳 Deposit status from database:', {
          hasDepositPayment: data.hasDepositPayment,
          isCartLocked: data.isCartLocked,
          cartItemsCount: data.cart?.itemsCount || 0
        })
        
        // If database says no valid locked cart, ensure cart is unlocked (but not during order completion)
        if (!data.isCartLocked && isCartLocked && !isOrderCompleting) {
          console.log('🔓 Database shows cart should be unlocked, unlocking...')
          await unlockCart()
        }
        
        console.log('🔍 DEBUG: Returning isCartLocked:', data.isCartLocked)
        return data.isCartLocked
      }
      
      return false
    } catch (error) {
      console.error('❌ Error checking deposit payment status:', error)
      return false
    }
  }, [isAuthenticated, isCartLocked, unlockCart, isOrderCompleting])

  // Get locked cart items from database
  const getLockedCartItemsFromDatabase = useCallback(async () => {
    try {
      const response = await fetch('/api/cart/database/lock')
      
      if (!response.ok) {
        console.error('❌ Failed to get locked cart items:', response.statusText)
        return {}
      }
      
      const data = await response.json()
      
      if (data.success && data.is_locked) {
        // Fetch full cart data to get items
        const cartResponse = await fetch('/api/cart/database')
        const cartData = await cartResponse.json()
        
        if (cartData.success) {
          console.log('🔒 Locked cart items from database:', cartData.cart.items)
          return cartData.cart.items || {}
        }
      }
      
      return {}
    } catch (error) {
      console.error('❌ Error getting locked cart items:', error)
      return {}
    }
  }, [])

  // Calculate totals
  const totalAmount = useMemo(() => {
    return Object.values(items).reduce((sum, item) => {
      return sum + (item.price || 0) * (item.qty || 0)
    }, 0)
  }, [items])

  const totalCount = useMemo(() => {
    return Object.values(items).reduce((sum, item) => sum + (item.qty || 0), 0)
  }, [items])

  const maxQtyForCondition = useCallback((condition) => {
    return Object.values(items)
      .filter(item => item.condition === condition)
      .reduce((max, item) => Math.max(max, item.qty || 0), 0)
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
    isOrderCompleting,
    setIsOrderCompleting,
    loading,
    cartId,
    refreshCart: fetchCart
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
