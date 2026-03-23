'use client'

import { useAuth } from './AuthContext'
import { useCart } from './CartContext'
import { useRouter } from 'next/navigation'

export function useAuthenticatedCart() {
  const { isAuthenticated, loading } = useAuth()
  const cart = useCart()
  const router = useRouter()

  const showAuthRequired = (action = 'add', productName = '') => {
    if (typeof window !== "undefined") {
      const event = new CustomEvent('authRequired', {
        detail: {
          action,
          productName,
          message: `Please sign in to ${action} items ${action === 'add' ? 'to' : 'from'} cart`,
          redirectUrl: '/login?redirect=' + encodeURIComponent(window.location.pathname)
        }
      })
      window.dispatchEvent(event)
    }
  }

  const addItem = (product) => {
    if (!loading && !isAuthenticated) {
      showAuthRequired('add', product.name)
      return
    }
    cart.addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      condition: product.condition || 'unknown',
      category: product.category || 'unknown'
    })
  }

  const setQty = (productId, qty) => {
    if (!loading && !isAuthenticated) {
      showAuthRequired('modify')
      return
    }
    cart.setQty(productId, qty)
  }

  const removeItem = (productId) => {
    if (!loading && !isAuthenticated) {
      showAuthRequired('remove')
      return
    }
    cart.removeItem(productId)
  }

  return {
    ...cart,
    addItem,
    setQty,
    removeItem,
    isAuthenticated,
    loading
  }
}
