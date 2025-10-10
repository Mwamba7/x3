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
    window.localStorage.removeItem("cart:v1")
    window.localStorage.removeItem("fulfillmentDetails")
    return {}
    
    try {
      const raw = window.localStorage.getItem("cart:v1")
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  })
  const [open, setOpen] = useState(false)
  
  useEffect(() => {
    try {
      window.localStorage.setItem("cart:v1", JSON.stringify(items))
    } catch {}
  }, [items])

  const totalCount = useMemo(() => Object.values(items).reduce((acc, it) => acc + (it.qty || 0), 0), [items])
  const totalAmount = useMemo(() => Object.values(items).reduce((acc, it) => acc + (it.qty || 0) * (it.price || 0), 0), [items])

  const addItem = useCallback((product, qty = 1) => {
    if (!product || !product.id) return
    setItems(prev => {
      const existing = prev[product.id] || { id: product.id, name: product.name, price: product.price, img: product.img, condition: product.condition, qty: 0 }
      const max = maxQtyForCondition(existing.condition ?? product.condition)
      const newQty = Math.min(max, (existing.qty || 0) + (qty || 1))
      return { ...prev, [product.id]: { ...existing, ...product, qty: newQty } }
    })
  }, [])

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
    setItems(prev => {
      const copy = { ...prev }
      delete copy[productId]
      return copy
    })
  }, [])

  const clear = useCallback(() => setItems({}), [])

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
  }), [items, addItem, removeItem, setQty, clear, totalCount, totalAmount, open])

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
