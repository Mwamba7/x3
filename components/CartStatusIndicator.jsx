'use client'

import { useCart } from './CartContext'

export default function CartStatusIndicator() {
  const { isCartLocked, lockedCartItems, totalCount } = useCart()

  if (!isCartLocked || totalCount === 0) return null

  const lockedItemCount = Object.keys(lockedCartItems).length

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      backgroundColor: 'rgba(40, 167, 69, 0.1)',
      border: '1px solid #ccc',
      borderRadius: '20px',
      padding: '4px 12px',
      fontSize: '12px',
      fontWeight: '600',
      color: '#28a745',
      marginLeft: '8px'
    }}>
      <span>🔒</span>
      <span style={{ color: '#dc3545' }}>Cart Locked</span>
      <span style={{
        backgroundColor: '#28a745',
        color: 'white',
        borderRadius: '10px',
        padding: '2px 6px',
        fontSize: '10px',
        minWidth: '16px',
        textAlign: 'center'
      }}>
        {lockedItemCount}
      </span>
    </div>
  )
}
