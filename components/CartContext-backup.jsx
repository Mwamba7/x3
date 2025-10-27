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
    
    // Force empty cart for development/reset (uncomment to clear cart)
    // window.localStorage.removeItem("cart:v1")
    // window.localStorage.removeItem("fulfillmentDetails")
    // return {}
    
    try {
      const raw = window.localStorage.getItem("cart:v1")
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  })
  const [open, setOpen] = useState(false)
  const [isCartLocked, setIsCartLocked] = useState(false)
  const [lockedCartItems, setLockedCartItems] = useState({})
  
  useEffect(() => {
    try {
      window.localStorage.setItem("cart:v1", JSON.stringify(items))
    } catch {}
  }, [items])

  // Check for deposit payment status and lock cart accordingly
  const checkDepositPaid = useCallback(() => {
    // M-Pesa functionality removed - always return false
    return false
  }, [])

  // Load cart lock state from localStorage and payment status
  useEffect(() => {
    if (typeof window === "undefined") return
    
    const hasDepositPaid = checkDepositPaymentStatus()
    const cartLocked = window.localStorage.getItem('cartLocked') === 'true'
    
    if (hasDepositPaid || cartLocked) {
      setIsCartLocked(true)
      // Load locked items from storage or use current items
      try {
        const savedLockedItems = window.localStorage.getItem('lockedCartItems')
        if (savedLockedItems) {
          setLockedCartItems(JSON.parse(savedLockedItems))
        } else {
          setLockedCartItems({...items})
        }
      } catch (error) {
        setLockedCartItems({...items})
      }
    }
  }, [checkDepositPaymentStatus, items])

  // Monitor payment status changes
  useEffect(() => {
    if (typeof window === "undefined") return
    
    const checkPaymentInterval = setInterval(() => {
      const hasDepositPaid = checkDepositPaymentStatus()
      if (hasDepositPaid && !isCartLocked) {
        console.log('🔒 Deposit detected - locking cart')
        setIsCartLocked(true)
        setLockedCartItems({...items})
      }
    }, 1000) // Check every second
    
    return () => clearInterval(checkPaymentInterval)
  }, [checkDepositPaymentStatus, isCartLocked, items])

  // Save cart lock state to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return
    
    try {
      if (isCartLocked) {
        window.localStorage.setItem('cartLocked', 'true')
        window.localStorage.setItem('lockedCartItems', JSON.stringify(lockedCartItems))
      } else {
        window.localStorage.removeItem('cartLocked')
        window.localStorage.removeItem('lockedCartItems')
      }
    } catch (error) {
      console.error('Error saving cart lock state:', error)
    }
  }, [isCartLocked, lockedCartItems])

  const totalCount = useMemo(() => Object.values(items).reduce((acc, it) => acc + (it.qty || 0), 0), [items])
  const totalAmount = useMemo(() => Object.values(items).reduce((acc, it) => acc + (it.qty || 0) * (it.price || 0), 0), [items])

  const addItem = useCallback((product, qty = 1) => {
    if (!product || !product.id) return
    
    // Always check current deposit payment status
    const hasDepositPaid = checkDepositPaymentStatus()
    
    // If deposit has been paid, prevent adding new products
    if (hasDepositPaid || isCartLocked) {
      const isExistingLockedItem = lockedCartItems[product.id]
      const isCurrentlyInCart = items[product.id]
      
      // Only allow adding if item was in the original cart when deposit was paid
      if (!isExistingLockedItem && !isCurrentlyInCart) {
        console.log('🚫 Blocking new product addition - deposit paid')
        
        // Show error notification
        if (typeof window !== "undefined") {
          const event = new CustomEvent('cartLockError', {
            detail: {
              message: `Cannot add "${product.name}". Please complete your current order first before adding new products.`,
              productName: product.name,
              hasDepositPaid: hasDepositPaid
            }
          })
          window.dispatchEvent(event)
        }
        return
      }
    }
    
    setItems(prev => {
      const existing = prev[product.id] || { id: product.id, name: product.name, price: product.price, img: product.img, condition: product.condition, qty: 0 }
      const max = maxQtyForCondition(existing.condition ?? product.condition)
      const newQty = Math.min(max, (existing.qty || 0) + (qty || 1))
      return { ...prev, [product.id]: { ...existing, ...product, qty: newQty } }
    })
  }, [checkDepositPaymentStatus, isCartLocked, lockedCartItems, items])

  const setQty = useCallback((productId, qty) => {
    setItems(prev => {
      const cur = prev[productId]
      if (!cur) return prev
      const max = maxQtyForCondition(cur.condition)
      const newQty = Math.max(0, Math.min(max, Number(qty) || 0))
      if (newQty === 0) {
        const copy = { ...prev }
        delete copy[productId]
        return copy
      }
      return { ...prev, [productId]: { ...cur, qty: newQty } }
    })
  }, [])

  const removeItem = useCallback((productId) => {
    // Always check current deposit payment status
    const hasDepositPaid = checkDepositPaymentStatus()
    
    // If deposit has been paid or cart is locked, prevent removal
    if (hasDepositPaid || isCartLocked) {
      console.log('🚫 Blocking item removal - deposit paid or cart locked')
      
      // Show error notification
      if (typeof window !== "undefined") {
        const event = new CustomEvent('cartLockError', {
          detail: {
            productId: productId,
            hasDepositPaid: hasDepositPaid,
            isCartLocked: isCartLocked
          }
        })
        const clear = useCallback((forceOverride = false) => {
    // M-Pesa protection removed - allow clearing
    
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

  const value = useMemo(() => ({
    items,
    addItem,
    removeItem,
    setQty,
    clear,
    totalCount,
    totalAmount,
    open,
    setOpen,
    maxQtyForCondition,
    isCartLocked,
    lockedCartItems,
    lockCart,
    unlockCart,
    checkDepositPaymentStatus,
  }), [items, addItem, removeItem, setQty, clear, totalCount, totalAmount, open, isCartLocked, lockedCartItems, lockCart, unlockCart, checkDepositPaymentStatus])

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within CartProvider")
  return ctx
}
