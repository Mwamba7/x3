'use client'

import { useState, useEffect } from 'react'

export default function WithdrawalStatusBadge({ saleId, userId, initialStatus = 'pending' }) {
  const [status, setStatus] = useState(initialStatus)
  const [loading, setLoading] = useState(false)

  // Status configuration
  const statusConfig = {
    pending: {
      icon: '⏳',
      text: 'Pending',
      backgroundColor: '#ffc107',
      color: '#212529'
    },
    processing: {
      icon: '🔄',
      text: 'Processing',
      backgroundColor: '#17a2b8',
      color: '#fff'
    },
    completed: {
      icon: '✅',
      text: 'Completed',
      backgroundColor: '#28a745',
      color: '#fff'
    },
    cancelled: {
      icon: '❌',
      text: 'Cancelled',
      backgroundColor: '#dc3545',
      color: '#fff'
    }
  }

  // Fetch withdrawal status
  const fetchStatus = async () => {
    if (!saleId || !userId) return

    try {
      setLoading(true)
      const response = await fetch(`/api/user/withdrawal-status?saleId=${saleId}&userId=${userId}&t=${Date.now()}`)
      const data = await response.json()
      
      if (data.success && data.status && data.status !== 'not_requested') {
        setStatus(data.status)
      }
    } catch (error) {
      console.error('Error fetching withdrawal status:', error)
    } finally {
      setLoading(false)
    }
  }

  // Auto-refresh every 5 seconds
  useEffect(() => {
    fetchStatus()
    
    const interval = setInterval(fetchStatus, 5000)
    return () => clearInterval(interval)
  }, [saleId, userId])

  // Manual refresh function
  const handleRefresh = () => {
    fetchStatus()
  }

  const currentConfig = statusConfig[status] || statusConfig.pending

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span 
        style={{
          padding: '4px 8px',
          backgroundColor: currentConfig.backgroundColor,
          color: currentConfig.color,
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: 'bold',
          minWidth: '80px',
          textAlign: 'center',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          opacity: loading ? 0.7 : 1,
          transition: 'all 0.3s ease'
        }}
      >
        {currentConfig.icon} {currentConfig.text}
      </span>
      
      {/* Manual refresh button */}
      <button
        onClick={handleRefresh}
        disabled={loading}
        style={{
          background: 'transparent',
          border: '1px solid #374151',
          borderRadius: '4px',
          padding: '2px 6px',
          fontSize: '10px',
          color: '#9ca3af',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.5 : 1,
          transition: 'all 0.2s ease'
        }}
        title="Refresh status"
      >
        {loading ? '⏳' : '🔄'}
      </button>
    </div>
  )
}
