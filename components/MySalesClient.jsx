'use client'

import { useState, useEffect } from 'react'
import { getCurrentUser, getUserSales } from '../lib/userSession'

export default function MySalesClient() {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userPhone, setUserPhone] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [userName, setUserName] = useState('')
  const [allSales, setAllSales] = useState([])
  const [filteredSales, setFilteredSales] = useState([])
  const [activeFilter, setActiveFilter] = useState('')

  useEffect(() => {
    fetchUserSales()
  }, [])

  async function fetchUserSales() {
    try {
      // Get current user from session (database-first)
      const currentUser = await getCurrentUser()
      
      if (!currentUser || !currentUser.phone) {
        console.error('User not authenticated')
        return
      }
      
      // Fetch sales from database
      const userSales = await getUserSales(currentUser.phone)
      
      setSales(userSales)
      setAllSales(userSales)
      setFilteredSales(userSales)
      setUserPhone(currentUser.phone)
      setUserName(currentUser.name || '')
      
    } catch (error) {
      console.error('Error fetching user sales:', error)
      setError(error.message || 'Failed to load sales')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    if (!userPhone) return
    
    setRefreshing(true)
    try {
      await fetchUserSales(userPhone)
    } finally {
      setRefreshing(false)
    }
  }

  const formatKsh = (n) => `Ksh ${Number(n).toLocaleString('en-KE')}`

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const filterSales = (filter) => {
    setActiveFilter(filter)
    
    if (filter === '') {
      setFilteredSales(allSales)
      return
    }
    
    const filtered = allSales.filter(sale => {
      switch (filter) {
        case 'withdrawal_requested':
          return sale.withdrawalRequested === true
        case 'withdrawal_completed':
          return sale.withdrawalCompleted === true
        case 'pending_withdrawal':
          return sale.withdrawalRequested !== true && sale.withdrawalCompleted !== true
        default:
          return true
      }
    })
    
    setFilteredSales(filtered)
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>💰</div>
        <p>Loading your sales...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#dc3545' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <p>{error}</p>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            marginTop: '16px',
            padding: '8px 16px',
            backgroundColor: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: refreshing ? 'not-allowed' : 'pointer',
            opacity: refreshing ? 0.7 : 1
          }}
        >
          {refreshing ? 'Refreshing...' : 'Try Again'}
        </button>
      </div>
    )
  }

  if (sales.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>💰</div>
        <p>No sales yet</p>
        <p style={{ fontSize: '14px', color: '#999', marginTop: '8px' }}>
          When your products sell, they'll appear here
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Filters */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={() => filterSales('')}
          style={{
            padding: '6px 12px',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            backgroundColor: activeFilter === '' ? 'var(--primary)' : 'var(--surface)',
            color: activeFilter === '' ? 'white' : 'var(--text)',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          All ({sales.length})
        </button>
        <button
          onClick={() => filterSales('pending_withdrawal')}
          style={{
            padding: '6px 12px',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            backgroundColor: activeFilter === 'pending_withdrawal' ? 'var(--primary)' : 'var(--surface)',
            color: activeFilter === 'pending_withdrawal' ? 'white' : 'var(--text)',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Pending Withdrawal
        </button>
        <button
          onClick={() => filterSales('withdrawal_requested')}
          style={{
            padding: '6px 12px',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            backgroundColor: activeFilter === 'withdrawal_requested' ? 'var(--primary)' : 'var(--surface)',
            color: activeFilter === 'withdrawal_requested' ? 'white' : 'var(--text)',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Withdrawal Requested
        </button>
        <button
          onClick={() => filterSales('withdrawal_completed')}
          style={{
            padding: '6px 12px',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            backgroundColor: activeFilter === 'withdrawal_completed' ? 'var(--primary)' : 'var(--surface)',
            color: activeFilter === 'withdrawal_completed' ? 'white' : 'var(--text)',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Withdrawal Completed
        </button>
      </div>

      {/* Sales List */}
      <div style={{ display: 'grid', gap: '12px' }}>
        {filteredSales.map((sale) => (
          <div key={sale._id} style={{
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '16px',
            backgroundColor: 'var(--surface)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text)' }}>
                {sale.type === 'product_sale' ? sale.productName : `Sale #${sale._id.slice(-8)}`}
              </div>
              <div style={{ 
                padding: '4px 8px', 
                borderRadius: '4px', 
                fontSize: '12px',
                backgroundColor: sale.withdrawalCompleted ? '#d4edda' : 
                               sale.withdrawalRequested ? '#fff3cd' : '#e2e3e5',
                color: sale.withdrawalCompleted ? '#155724' : 
                      sale.withdrawalRequested ? '#856404' : '#383d41'
              }}>
                {sale.withdrawalCompleted ? 'Withdrawal Completed' : 
                 sale.withdrawalRequested ? 'Withdrawal Requested' : 'Pending Withdrawal'}
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--primary)' }}>
                {formatKsh(sale.saleAmount)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                {formatDate(sale.saleDate)}
              </div>
            </div>

            {sale.withdrawalRequested && (
              <div style={{ 
                marginTop: '8px', 
                padding: '8px', 
                backgroundColor: 'rgba(255, 193, 7, 0.1)', 
                borderRadius: '4px',
                fontSize: '12px',
                color: '#856404'
              }}>
                💸 Withdrawal requested - Processing...
              </div>
            )}

            {sale.withdrawalCompleted && (
              <div style={{ 
                marginTop: '8px', 
                padding: '8px', 
                backgroundColor: 'rgba(40, 167, 69, 0.1)', 
                borderRadius: '4px',
                fontSize: '12px',
                color: '#155724'
              }}>
                ✅ Withdrawal completed - Funds sent to M-Pesa
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Refresh Button */}
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            padding: '8px 16px',
            backgroundColor: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: refreshing ? 'not-allowed' : 'pointer',
            opacity: refreshing ? 0.7 : 1
          }}
        >
          {refreshing ? 'Refreshing...' : 'Refresh Sales'}
        </button>
      </div>
    </div>
  )
}
