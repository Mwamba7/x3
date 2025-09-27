'use client'

import { useCart } from './CartContext'

export default function Toast() {
  const { toast } = useCart()

  if (!toast.visible) {
    return null
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'var(--primary)',
        color: '#0a101a',
        padding: '12px 20px',
        borderRadius: '8px',
        zIndex: 100,
        boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
        textAlign: 'center',
        fontSize: '14px',
        fontWeight: '600',
      }}
    >
      {toast.message}
    </div>
  )
}
