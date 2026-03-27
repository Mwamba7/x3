'use client'
import { useState, useEffect } from 'react'
import { getCurrentUser, getUserActivities } from '../lib/userSession'

export default function RecentActivityClient() {
  const [activities, setActivities] = useState([])
  const [userPhone, setUserPhone] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchActivities()
  }, [])

  async function fetchActivities() {
    try {
      setLoading(true)
      setError('')
      
      // Get current user from session (database-first)
      const currentUser = await getCurrentUser()
      
      if (!currentUser || !currentUser.phone) {
        setError('User not authenticated')
        setLoading(false)
        return
      }
      
      setUserPhone(currentUser.phone)
      
      // Fetch activities from database
      const userActivities = await getUserActivities(currentUser.phone)
      
      setActivities(userActivities)
      setLoading(false)
      
    } catch (error) {
      console.error('Error fetching activities:', error)
      setError(error.message || 'Failed to load activities')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    if (!userPhone) return
    
    setRefreshing(true)
    try {
      await fetchRecentActivity(userPhone)
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

  // Get recent orders and sales from last 60 days
  const getRecentActivity = () => {
    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

    const recentOrders = orders.filter(order => 
      new Date(order.createdAt) >= sixtyDaysAgo
    )

    const recentSales = sales.filter(sale => 
      new Date(sale.createdAt || sale.saleDate) >= sixtyDaysAgo
    )

    return { recentOrders, recentSales }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
        <p>Loading recent activity...</p>
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

  const { recentOrders, recentSales } = getRecentActivity()
  const hasRecentActivity = recentOrders.length > 0 || recentSales.length > 0

  if (!hasRecentActivity) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
        <p>No recent activity</p>
        <p style={{ fontSize: '14px', color: '#999', marginTop: '8px' }}>
          Your orders and sales from the last 60 days will appear here
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      {/* Recent Orders Section */}
      {recentOrders.length > 0 && (
        <div>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: 'var(--text)' }}>
            📋 Recent Orders ({recentOrders.length})
          </h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {recentOrders.map((order) => (
              <div key={order._id} style={{
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '16px',
                backgroundColor: 'var(--surface)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text)' }}>Order #{order._id.slice(-8)}</div>
                  <div style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '12px',
                    backgroundColor: order.status === 'completed' ? '#d4edda' : '#fff3cd',
                    color: order.status === 'completed' ? '#155724' : '#856404'
                  }}>
                    {order.status}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--primary)' }}>
                    {formatKsh(order.totalAmount)}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    {formatDate(order.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Sales Section */}
      {recentSales.length > 0 && (
        <div>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: 'var(--text)' }}>
            💰 Recent Sales ({recentSales.length})
          </h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {recentSales.map((sale) => (
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--primary)' }}>
                    {formatKsh(sale.saleAmount)}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    {formatDate(sale.saleDate)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div style={{ textAlign: 'center' }}>
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
          {refreshing ? 'Refreshing...' : 'Refresh Activity'}
        </button>
      </div>
    </div>
  )
}
