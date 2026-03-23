"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { useAuth } from './AuthContext'

// Helper: determine max qty allowed based on condition
function maxQtyForCondition(condition) {
  const c = String(condition || "").trim().toLowerCase()
  if (c === "new") return 99 // effectively unlimited for UI
  if (/pre\s*-?\s*owned|refurbished|brand\s*new|used|like\s*new/.test(c)) return 1
  // Default conservative: 1 unless explicitly "new"
  return 1
}

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth() // Get authentication state
  
  // Add flag to prevent cart state changes during order completion
  const [isOrderCompleting, setIsOrderCompleting] = useState(false)
  
  // Get initial cart from localStorage
  const getInitialCart = () => {
    if (typeof window === "undefined") return {}
    
    try {
      const raw = window.localStorage.getItem("cart:v1")
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  }

  const [items, setItems] = useState(getInitialCart)
  const [isCartLocked, setIsCartLocked] = useState(false)
  const [lockedCartItems, setLockedCartItems] = useState({})
  
  // Save cart to localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem("cart:v1", JSON.stringify(items))
    } catch {}
  }, [items])

  // Get locked cart items from API
  const getLockedCartItemsFromDatabase = useCallback(async () => {
    try {
      const response = await fetch('/api/cart')
      if (response.ok) {
        const data = await response.json()
        return data.cart.items || {}
      }
    } catch (error) {
      console.error('Error getting locked cart items:', error)
    }
    return {}
  }, [])

  const lockCart = useCallback((depositPaid = true) => {
    if (depositPaid) {
      console.log('🔒 Locking cart with items:', items)
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
      } else {
        console.log('🔒 Window not available, skipping event dispatch')
      }
    } else {
      console.log('🔒 lockCart called but depositPaid is false, not locking')
    }
  }, [items])

  const unlockCart = useCallback(async () => {
    console.log('🔓 Unlocking cart and clearing payment data from database')
    setIsCartLocked(false)
    setLockedCartItems({})
    
    // Clear payment data from database (replaces localStorage cleanup)
    try {
      const response = await fetch('/api/deposit-status', {
        method: 'DELETE'
      })
      
      if (response.ok) {
        console.log('🧹 Cleared payment data from database')
      } else {
        console.error('❌ Failed to clear payment data from database')
      }
    } catch (error) {
      console.error('❌ Error clearing payment data:', error)
    }
    
    // Also clear any remaining localStorage data for backward compatibility
    if (typeof window !== "undefined") {
      localStorage.removeItem('paystackPayment')
      localStorage.removeItem('mpesaPayment')
      localStorage.removeItem('paymentStatus')
      localStorage.removeItem('paymentReference')
      localStorage.removeItem('checkoutPaymentState')
      localStorage.removeItem('orderCompletionState')
      console.log('🧹 Cleared any remaining localStorage data')
    }
    
    // Dispatch event to notify other components
    if (typeof window !== "undefined") {
      const event = new CustomEvent('cartUnlocked')
      window.dispatchEvent(event)
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
          unlockCart()
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

  // Initialize cart lock state from database instead of localStorage
  useEffect(() => {
    const initializeCartState = async () => {
      if (isAuthenticated) {
        console.log('🔍 DEBUG: Initializing cart state for authenticated user')
        console.log('🔍 DEBUG: Current cart items:', Object.keys(items).length, 'items')
        
        // Clear any stale localStorage payment data that might interfere
        if (typeof window !== "undefined") {
          const stalePaymentKeys = ['paystackPayment', 'mpesaPayment', 'paymentStatus', 'paymentReference']
          stalePaymentKeys.forEach(key => {
            const data = localStorage.getItem(key)
            if (data) {
              console.log('🧹 DEBUG: Clearing stale localStorage data:', key)
              localStorage.removeItem(key)
            }
          })
        }
        
        // Check database for cart lock status
        const isLocked = await checkDepositPaymentStatus()
        console.log('🔒 DEBUG: checkDepositPaymentStatus returned:', isLocked)
        
        // Additional safeguard: Don't lock cart if current cart is empty
        const currentCartHasItems = Object.keys(items).length > 0
        const shouldLockCart = isLocked && currentCartHasItems
        
        console.log('🔒 DEBUG: Final lock decision:', {
          databaseSaysLocked: isLocked,
          currentCartHasItems,
          shouldLockCart
        })
        
        setIsCartLocked(shouldLockCart)
        if (shouldLockCart) {
          console.log('🔒 DEBUG: Cart is locked, loading locked items')
          try {
            const lockedItems = await getLockedCartItemsFromDatabase()
            console.log('🔒 DEBUG: Locked items loaded:', lockedItems)
            setLockedCartItems(lockedItems)
          } catch (error) {
            console.error('Error loading locked cart items:', error)
          }
        } else {
          console.log('🔒 DEBUG: Cart is not locked, no locked items to load')
        }
      } else {
        console.log('🔒 DEBUG: User not authenticated, skipping cart initialization')
      }
    }
    
    initializeCartState()
  }, [isAuthenticated]) // Remove checkDepositPaymentStatus and getLockedCartItemsFromDatabase from dependencies

  const addItem = useCallback((product, qty = 1) => {
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
      return
    }
    
    const max = maxQtyForCondition(product.condition)
    
    setItems(prev => {
      const existing = prev[product.id]
      const currentQty = existing?.qty || 0
      const newQty = Math.min(currentQty + qty, max)
      
      if (newQty === 0) {
        const copy = { ...prev }
        delete copy[product.id]
        return copy
      }
      
      return {
        ...prev,
        [product.id]: {
          ...product,
          qty: newQty
        }
      }
    })
  }, [isCartLocked])

  const setQty = useCallback((productId, qty) => {
    // Check if cart is locked
    if (isCartLocked) {
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
    
    setItems(prev => {
      const existing = prev[productId]
      if (!existing) return prev
      
      const max = maxQtyForCondition(existing.condition)
      const clampedQty = Math.max(0, Math.min(qty, max))
      
      if (clampedQty === 0) {
        const copy = { ...prev }
        delete copy[productId]
        return copy
      }
      
      return {
        ...prev,
        [productId]: {
          ...existing,
          qty: clampedQty
        }
      }
    })
  }, [isCartLocked])

  const removeItem = useCallback((productId) => {
    // Check if cart is locked
    if (isCartLocked) {
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
    
    setItems(prev => {
      const copy = { ...prev }
      delete copy[productId]
      return copy
    })
  }, [isCartLocked])

  const clear = useCallback((forceOverride = false) => {
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
    
    console.log('🧹 Clearing cart from context (override:', forceOverride, ')')
    setItems({})
    setIsCartLocked(false)
    setLockedCartItems({})
    return true
  }, [isCartLocked])

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
    isOrderCompleting,
    setIsOrderCompleting
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
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
