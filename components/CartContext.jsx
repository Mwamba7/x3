"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

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
  const [items, setItems] = useState(() => {
    if (typeof window === "undefined") return {}
    
    try {
      const raw = window.localStorage.getItem("cart:v1")
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  })
  const [isCartLocked, setIsCartLocked] = useState(false)
  const [lockedCartItems, setLockedCartItems] = useState({})
  
  useEffect(() => {
    try {
      window.localStorage.setItem("cart:v1", JSON.stringify(items))
    } catch {}
  }, [items])

  // Load cart lock state from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return
    
    const cartLocked = window.localStorage.getItem('cartLocked') === 'true'
    
    if (cartLocked) {
      setIsCartLocked(true)
      try {
        const lockedItems = window.localStorage.getItem('lockedCartItems')
        if (lockedItems) {
          setLockedCartItems(JSON.parse(lockedItems))
        }
      } catch (error) {
        console.error('Error loading locked cart items:', error)
      }
    }
  }, [])

  // Save cart lock state to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return
    
    window.localStorage.setItem('cartLocked', isCartLocked.toString())
    if (isCartLocked) {
      window.localStorage.setItem('lockedCartItems', JSON.stringify(lockedCartItems))
    } else {
      window.localStorage.removeItem('lockedCartItems')
    }
  }, [isCartLocked, lockedCartItems])

  const addItem = useCallback((product) => {
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
      const newQty = Math.min(currentQty + 1, max)
      
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

  const lockCart = useCallback((depositPaid = true) => {
    if (depositPaid) {
      setIsCartLocked(true)
      setLockedCartItems({...items})
      
      // Dispatch event to notify other components
      if (typeof window !== "undefined") {
        const event = new CustomEvent('cartLocked', {
          detail: { items: {...items} }
        })
        window.dispatchEvent(event)
      }
    }
  }, [items])

  const unlockCart = useCallback(() => {
    setIsCartLocked(false)
    setLockedCartItems({})
    
    // Dispatch event to notify other components
    if (typeof window !== "undefined") {
      const event = new CustomEvent('cartUnlocked')
      window.dispatchEvent(event)
    }
  }, [])

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
    unlockCart
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
