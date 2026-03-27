'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminActivityTracker from '../../components/AdminActivityTracker'

export default function AdminLayout({ children }) {
  const router = useRouter()
  const [adminProfile, setAdminProfile] = useState({
    name: 'Super Admin',
    role: 'Administrator',
    profilePicture: null
  })
  const [loading, setLoading] = useState(true)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  // Fetch admin profile data
  useEffect(() => {
    fetchAdminProfile()
  }, [])

  const fetchAdminProfile = async () => {
    try {
      // Add timeout to prevent infinite loading
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
      
      const response = await fetch('/api/admin/profile', {
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/okero/login')
          return
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      setAdminProfile({
        name: data.user?.name || 'Super Admin',
        role: data.user?.role === 'admin' ? 'Administrator' : data.user?.role || 'Administrator',
        profilePicture: data.user?.profilePicture
      })
    } catch (err) {
      console.error('Failed to fetch admin profile:', err)
      
      // If it's an abort error, it means timeout
      if (err.name === 'AbortError') {
        console.error('Admin profile fetch timed out')
      }
      
      // If unauthorized, redirect to login
      if (err.message.includes('401')) {
        router.push('/okero/login')
        return
      }
      
      // Keep default values on error but don't stay in loading state
      console.log('Using default admin profile due to error')
    } finally {
      setLoading(false)
    }
  }

  // Generate initials from name
  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'SA'
  }

  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdate = () => {
      fetchAdminProfile()
    }

    window.addEventListener('adminProfileUpdated', handleProfileUpdate)
    return () => {
      window.removeEventListener('adminProfileUpdated', handleProfileUpdate)
    }
  }, [])

  // Handle logout
  const handleLogout = async () => {
    try {
      const response = await fetch('/api/admin/logout', {
        method: 'POST'
      })
      
      if (response.ok) {
        // Redirect to admin login page
        window.location.href = '/okero/login'
      } else {
        console.error('Logout failed')
        // Still redirect even if logout API fails
        window.location.href = '/okero/login'
      }
    } catch (error) {
      console.error('Logout error:', error)
      // Still redirect even if there's an error
      window.location.href = '/okero/login'
    }
  }

  return (
    <>
      <AdminActivityTracker />
      <style dangerouslySetInnerHTML={{ __html: `
        .admin-layout {
          display: flex;
          min-height: auto; /* Allow dynamic height */
          background: var(--bg);
        }
        
        .admin-sidebar {
          width: 250px;
          background: #2c3e50;
          color: white;
          transition: width 0.3s ease;
          position: fixed;
          height: 100vh;
          overflow-y: auto;
          z-index: 1000;
        }
        
        .admin-sidebar::-webkit-scrollbar {
          width: 6px;
        }
        
        .admin-sidebar::-webkit-scrollbar-track {
          background: #34495e;
        }
        
        .admin-sidebar::-webkit-scrollbar-thumb {
          background: #95a5a6;
          border-radius: 3px;
        }
        
        .admin-sidebar::-webkit-scrollbar-thumb:hover {
          background: #bdc3c7;
        }
        
        .admin-sidebar.collapsed {
          width: 70px;
        }
        
        .admin-main {
          flex: 1;
          margin-left: 252px;
          transition: margin-left 0.3s ease;
          background: transparent;
          min-height: auto; /* Allow dynamic height */
        }
        
        .admin-main.collapsed {
          margin-left: 70px;
        }
        
        .admin-header {
          background: var(--card);
          padding: 1rem 2rem;
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          position: fixed;
          top: 70px;
          left: 250px;
          right: 0;
          z-index: 999;
        }
        
        .sidebar-header {
          padding: 1.5rem 1rem;
          border-bottom: 1px solid #34495e;
          text-align: center;
        }
        
        .sidebar-nav {
          padding: 1rem 0;
        }
        
        .nav-item {
          display: flex;
          align-items: center;
          padding: 0.75rem 1rem;
          color: #bdc3c7;
          text-decoration: none !important;
          transition: all 0.3s ease;
          border-left: 3px solid transparent;
        }
        
        .nav-item:hover {
          background: #34495e;
          color: white;
          border-left-color: #3498db;
          text-decoration: none !important;
        }
        
        .nav-item.active {
          background: #34495e;
          color: white;
          border-left-color: #e74c3c;
          text-decoration: none !important;
        }
        
        .nav-item:link,
        .nav-item:visited,
        .nav-item:focus,
        .nav-item:active {
          text-decoration: none !important;
        }
        
        a.nav-item {
          text-decoration: none !important;
        }
        
        .admin-sidebar a {
          text-decoration: none !important;
        }
        
        .admin-sidebar a:hover,
        .admin-sidebar a:focus,
        .admin-sidebar a:active,
        .admin-sidebar a:visited {
          text-decoration: none !important;
        }
        
        /* Force remove underlines with highest specificity */
        .admin-sidebar .nav-item,
        .admin-sidebar .nav-item:hover,
        .admin-sidebar .nav-item:focus,
        .admin-sidebar .nav-item:active,
        .admin-sidebar .nav-item:visited,
        .admin-sidebar .nav-item:link {
          text-decoration: none !important;
          text-decoration-line: none !important;
          text-decoration-style: none !important;
          text-decoration-color: transparent !important;
        }
        
        /* Logout Modal Styles */
        .logout-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        }
        
        .logout-modal {
          background: var(--card);
          border: 1px solid #2a3342;
          border-radius: 12px;
          padding: 2rem;
          max-width: 400px;
          width: 90%;
          text-align: center;
        }
        
        .logout-modal h3 {
          margin: 0 0 1rem 0;
          color: var(--text);
          font-size: 1.25rem;
        }
        
        .logout-modal p {
          margin: 0 0 2rem 0;
          color: var(--muted);
          line-height: 1.5;
        }
        
        .logout-modal-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }
        
        .logout-btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s ease;
        }
        
        .logout-btn-cancel {
          background: #6c757d;
          color: white;
        }
        
        .logout-btn-cancel:hover {
          background: #5a6268;
        }
        
        .logout-btn-confirm {
          background: #e74c3c;
          color: white;
        }
        
        .logout-btn-confirm:hover {
          background: #c0392b;
        }
        
        .nav-icon {
          width: 20px;
          margin-right: 0.75rem;
          text-align: center;
        }
        
        .collapsed .nav-icon {
          margin-right: 0;
        }
        
        .nav-text {
          display: block;
        }
        
        .collapsed .nav-text {
          display: none;
        }
        
        .nav-badge {
          background: #e74c3c;
          color: white;
          border-radius: 10px;
          padding: 2px 6px;
          font-size: 11px;
          margin-left: auto;
          display: block;
        }
        
        .collapsed .nav-badge {
          display: none;
        }
        
        .toggle-btn {
          background: #34495e;
          border: none;
          color: white;
          padding: 0.5rem;
          cursor: pointer;
          border-radius: 4px;
        }
        
        .admin-content {
          padding: 2rem 2rem 2rem 0.25rem;
          margin-left: 2px;
          margin-top: 60px;
        }
        
        @media (max-width: 768px) {
          .admin-sidebar {
            width: 250px;
            transform: translateX(0);
            height: 100vh;
            overflow-y: auto;
            padding-bottom: 2rem;
          }
          .admin-sidebar.collapsed {
            width: 0;
            transform: translateX(-100%);
          }
          .admin-main {
            margin-left: 0;
          }
          
          .sidebar-nav {
            padding-bottom: 1rem;
            min-height: auto; /* Allow dynamic height */
            display: flex;
            flex-direction: column;
          }
        }
      ` }} />
      
      <div className="admin-layout">
        {/* Sidebar */}
        <div className="admin-sidebar">
          <div className="sidebar-header">
            <h3 style={{ margin: 0, color: '#3498db' }}>Admin Panel</h3>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: '#95a5a6' }}>Management Dashboard</p>
          </div>
          
          <nav className="sidebar-nav">
            <AdminNavigation onLogoutClick={() => setShowLogoutModal(true)} />
          </nav>
        </div>
        
        {/* Main Content */}
        <div className="admin-main">
          <div className="admin-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h1 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text)', marginLeft: '-13px' }}>Dashboard</h1>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {loading ? (
                <div style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Loading...</div>
              ) : (
                <>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text)' }}>
                      {adminProfile.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#27ae60' }}>
                      {adminProfile.role}
                    </div>
                  </div>
                  <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '50%', 
                    background: adminProfile.profilePicture ? 'transparent' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    overflow: 'hidden'
                  }}>
                    {adminProfile.profilePicture ? (
                      <img 
                        src={adminProfile.profilePicture} 
                        alt="Profile" 
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover',
                          borderRadius: '50%'
                        }}
                      />
                    ) : (
                      getInitials(adminProfile.name)
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="admin-content">
            {children}
          </div>
        </div>
      </div>
      
      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="logout-modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="logout-modal" onClick={(e) => e.stopPropagation()}>
            <h3>🚪 Confirm Logout</h3>
            <p>
              You are about to log out of the admin panel. 
              <br />
              Are you sure you want to continue?
            </p>
            <div className="logout-modal-buttons">
              <button 
                className="logout-btn logout-btn-cancel"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button 
                className="logout-btn logout-btn-confirm"
                onClick={() => {
                  setShowLogoutModal(false)
                  handleLogout()
                }}
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function AdminNavigation({ onLogoutClick }) {
  const navItems = [
    { icon: '📊', text: 'Dashboard', href: '/okero', badge: null },
    { icon: '🛍️', text: 'Orders', href: '/okero/orders', badge: 'orders' },
    { icon: '⏳', text: 'Pending', href: '/okero/pending', badge: 'pending' },
    { icon: '💳', text: 'Withdrawals', href: '/okero/withdrawals', badge: 'withdrawals' },
    { icon: '📦', text: 'Products', href: '/okero/products', badge: null },
    { icon: '👥', text: 'Community', href: '/okero/community', badge: 'community' },
    { icon: '👕', text: 'Fashion', href: '/okero/fashion', badge: null },
    { icon: '♻️', text: 'Pre-owned', href: '/okero/preowned', badge: null },
  ]

  const settingsItems = [
    { icon: '⚙️', text: 'Settings', href: '/okero/settings', badge: null },
    { icon: '🚪', text: 'Logout', href: '#', badge: null, isLogout: true },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <div style={{ flex: '1' }}>
        {navItems.map((item, index) => (
          <a key={index} href={item.href} className="nav-item">
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-text">{item.text}</span>
            {item.badge && (
              <span className="nav-badge" id={`${item.badge}-count`} style={{ display: 'none' }}></span>
            )}
          </a>
        ))}
        
        {/* Settings Section */}
        <div style={{ borderTop: '1px solid #34495e', marginTop: '0.25rem', paddingTop: '0.25rem' }}>
          <div style={{ padding: '0 1rem', marginBottom: '0.1rem' }}>
            <span style={{ color: '#95a5a6', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Settings</span>
          </div>
          {settingsItems.map((item, index) => (
          item.isLogout ? (
            <button
              key={index}
              onClick={onLogoutClick}
              className="nav-item"
              style={{
                background: 'none',
                border: 'none',
                color: '#bdc3c7',
                padding: '0.75rem 1rem',
                textAlign: 'left',
                cursor: 'pointer',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                textDecoration: 'none',
                fontSize: '0.9rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#e74c3c'
                e.target.style.color = 'white'
                e.target.style.borderLeftColor = '#e74c3c'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent'
                e.target.style.color = '#bdc3c7'
                e.target.style.borderLeftColor = 'transparent'
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text">{item.text}</span>
            </button>
          ) : (
            <a key={index} href={item.href} className="nav-item">
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text">{item.text}</span>
              {item.badge && (
                <span className="nav-badge" id={`${item.badge}-count`} style={{ display: 'none' }}></span>
              )}
            </a>
          )
        ))}
        </div>
      </div>
    </div>
  )
}
