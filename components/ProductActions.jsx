'use client'

import { useCart } from './CartContext'
import { useEffect, useState } from 'react'

export default function ProductActions({ product }) {
  const { addItem, removeItem, items } = useCart()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const disabled = String(product?.status || '').toLowerCase() === 'sold'
  const isInCart = mounted ? !!items[product.id] : false

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
      <button
        className={`btn btn-small ${isInCart ? 'in-cart-btn' : 'btn-primary'}`}
        disabled={disabled}
        style={isInCart ? { backgroundColor: 'blue', color: 'white' } : {}}
        onClick={() => {
          if (isInCart) {
            removeItem(product.id);
          } else {
            addItem(product, 1);
          }
        }}
        aria-disabled={disabled}
      >
        {isInCart ? 'In Cart' : 'Add to Cart'}
      </button>
    </div>
  )
}

