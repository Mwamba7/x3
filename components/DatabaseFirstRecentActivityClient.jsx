'use client'
import { useState, useEffect } from 'react'
import { getCurrentUser, getUserActivities } from '../lib/userSession'

export default function DatabaseFirstRecentActivityClient() {
  const [activities, setActivities] = useState([])
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
      
      // Get current user from session
      const currentUser = await getCurrentUser()
      
      if (!currentUser || !currentUser.phone) {
        setError('User not authenticated')
        setLoading(false)
        return
      }
      
      // Fetch activities from database
      const userActivities = await getUserActivities(currentUser.phone)
      
      setActivities(userActivities)
      setLoading(false)
      
    } catch (error) {
      console.error('Error fetching activities:', error)
      setError('Failed to load activities')
      setLoading(false)
    }
  }

  async function handleRefresh() {
    setRefreshing(true)
    await fetchActivities()
    setRefreshing(false)
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div>Loading activities...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ color: '#ef4444', marginBottom: '16px' }}>{error}</div>
        <button onClick={fetchActivities} className="btn">Retry</button>
      </div>
    )
  }

  if (!activities.length) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h3>No Recent Activity</h3>
        <p style={{ color: 'var(--muted)' }}>Your recent purchases and submissions will appear here.</p>
      </div>
    )
  }

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px' 
      }}>
        <h3>Recent Activity</h3>
        <button 
          onClick={handleRefresh} 
          disabled={refreshing}
          className="btn"
          style={{ opacity: refreshing ? 0.6 : 1 }}
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div style={{ 
        display: 'grid', 
        gap: '16px',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'
      }}>
        {activities.map((activity) => (
          <div
            key={`${activity.type}-${activity.id}`}
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '16px',
              position: 'relative'
            }}
          >
            {/* Activity Type Badge */}
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: activity.type === 'purchase' ? '#3b82f6' : '#10b981',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '500'
            }}>
              {activity.type === 'purchase' ? 'Purchase' : 'Submission'}
            </div>

            {/* Activity Content */}
            <div style={{ paddingRight: '80px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>
                {activity.description}
              </h4>
              
              {activity.amount && (
                <div style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold', 
                  color: 'var(--primary)',
                  marginBottom: '8px'
                }}>
                  Ksh {Number(activity.amount).toLocaleString()}
                </div>
              )}

              <div style={{ 
                fontSize: '14px', 
                color: 'var(--muted)',
                marginBottom: '8px'
              }}>
                Status: <span style={{
                  color: activity.status === 'completed' ? '#10b981' : 
                         activity.status === 'pending' ? '#f59e0b' : '#ef4444'
                }}>
                  {activity.status}
                </span>
              </div>

              <div style={{ 
                fontSize: '12px', 
                color: 'var(--muted)' 
              }}>
                {new Date(activity.date).toLocaleString()}
              </div>
            </div>

            {/* Activity Details */}
            {activity.details && (
              <div style={{
                marginTop: '12px',
                padding: '8px',
                background: 'var(--background-secondary)',
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                {activity.details.items && (
                  <div>Items: {activity.details.items.length}</div>
                )}
                {activity.details.paymentMethod && (
                  <div>Payment: {activity.details.paymentMethod}</div>
                )}
                {activity.details.category && (
                  <div>Category: {activity.details.category}</div>
                )}
                {activity.details.section && (
                  <div>Section: {activity.details.section}</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
