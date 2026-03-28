'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import WithdrawalRequestsClient from '../../../components/WithdrawalRequestsClient'

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchWithdrawals()
  }, [])

  const fetchWithdrawals = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/okero/withdrawals')
      const result = await response.json()
      
      if (result.success) {
        setWithdrawals(result.withdrawals)
      } else {
        setError(result.error || 'Failed to fetch withdrawal requests')
      }
    } catch (err) {
      setError('Failed to fetch withdrawal requests. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 8px', marginLeft: '8px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: '16px 14px 0' }}>
        <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>💳 Withdrawal Requests</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={fetchWithdrawals}
            style={{ 
              padding: '8px 12px', 
              fontSize: '12px', 
              backgroundColor: 'var(--secondary)', 
              color: 'var(--text)', 
              border: '1px solid var(--secondary)', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🔄 Refresh
          </button>
          <Link href="/okero" className="btn" style={{ padding: '8px 12px', fontSize: '12px' }}>
            Back to Admin
          </Link>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          padding: '40px',
          color: 'var(--muted)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
            <p>Loading withdrawal requests...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div style={{ 
          padding: '16px', 
          backgroundColor: '#dc3545', 
          color: 'white', 
          borderRadius: '4px', 
          marginBottom: '16px' 
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <WithdrawalRequestsClient initial={withdrawals} />
      )}
    </div>
  )
}
