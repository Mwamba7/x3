'use client'

import { useState } from 'react'

export default function QuantitySelector({ 
  quantity, 
  maxQuantity = 99, 
  onQuantityChange, 
  disabled = false,
  onLockedAttempt
}) {
  const [inputValue, setInputValue] = useState(quantity.toString())

  const handleDecrease = () => {
    if (quantity > 1 && !disabled) {
      const newQty = quantity - 1
      onQuantityChange(newQty)
      setInputValue(newQty.toString())
    } else if (disabled && onLockedAttempt) {
      onLockedAttempt()
    }
  }

  const handleIncrease = () => {
    if (quantity < maxQuantity && !disabled) {
      const newQty = quantity + 1
      onQuantityChange(newQty)
      setInputValue(newQty.toString())
    } else if (disabled && onLockedAttempt) {
      onLockedAttempt()
    }
  }

  const handleInputChange = (e) => {
    const value = e.target.value
    setInputValue(value)
    
    // Only update if it's a valid number within range
    const numValue = parseInt(value, 10)
    if (!isNaN(numValue) && numValue >= 1 && numValue <= maxQuantity) {
      onQuantityChange(numValue)
    }
  }

  const handleInputBlur = () => {
    // Reset to current quantity if input is invalid
    const numValue = parseInt(inputValue, 10)
    if (isNaN(numValue) || numValue < 1 || numValue > maxQuantity) {
      setInputValue(quantity.toString())
    }
  }

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '4px',
      border: '1px solid #2a3342',
      borderRadius: '6px',
      padding: '2px',
      background: 'transparent',
      marginLeft: '8px',
      marginTop: '-4px',
      width: 'fit-content'
    }}>
      <button
        onClick={handleDecrease}
        disabled={disabled || quantity <= 1}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text)',
          cursor: disabled || quantity <= 1 ? 'not-allowed' : 'pointer',
          padding: '2px 6px',
          borderRadius: '3px',
          fontSize: '12px',
          fontWeight: 'bold',
          opacity: disabled || quantity <= 1 ? 0.5 : 1,
          transition: 'opacity 0.2s'
        }}
        aria-label="Decrease quantity"
      >
        −
      </button>
      
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        disabled={disabled}
        style={{
          width: '30px',
          textAlign: 'center',
          background: 'transparent',
          border: 'none',
          color: 'var(--text)',
          fontSize: '12px',
          fontWeight: '600',
          outline: 'none'
        }}
        aria-label="Quantity"
      />
      
      <button
        onClick={handleIncrease}
        disabled={disabled || quantity >= maxQuantity}
        style={{
          background: 'transparent',
          border: 'none',
          color: disabled || quantity >= maxQuantity ? 'var(--text)' : '#28a745',
          cursor: disabled || quantity >= maxQuantity ? 'not-allowed' : 'pointer',
          padding: '2px 6px',
          borderRadius: '3px',
          fontSize: '12px',
          fontWeight: 'bold',
          opacity: disabled || quantity >= maxQuantity ? 0.5 : 1,
          transition: 'all 0.2s'
        }}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  )
}
