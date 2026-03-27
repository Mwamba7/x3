'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [profilePicture, setProfilePicture] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'admin'
  })

  // Load admin profile data
  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/admin/profile')
      const data = await response.json()
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/okero/login')
          return
        }
        throw new Error(data.error || 'Failed to load profile')
      }
      
      setFormData({
        name: data.user.name || '',
        email: data.user.email || '',
        phone: data.user.phone || '',
        role: data.user.role || 'admin'
      })
      setProfilePicture(data.user.profilePicture || '')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      setSaving(true)
      setError('')
      
      const formDataUpload = new FormData()
      formDataUpload.append('profilePicture', file)
      
      const response = await fetch('/api/admin/upload-profile', {
        method: 'POST',
        body: formDataUpload
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload profile picture')
      }
      
      setProfilePicture(data.profilePicture)
      setMessage('Profile picture uploaded successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          profilePicture
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile')
      }

      setMessage('Profile updated successfully!')
      setTimeout(() => setMessage(''), 3000)
      
      // Dispatch event to update header
      window.dispatchEvent(new CustomEvent('adminProfileUpdated'))
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ color: 'var(--text)' }}>Loading admin settings...</div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 8px' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .settings-section {
          background: #0f1521;
          border: 1px solid #2a3342;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }
        
        .settings-section h3 {
          margin: 0 0 1rem 0;
          color: var(--text);
          font-size: 1.1rem;
          font-weight: 600;
        }
        
        .profile-picture-section {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }
        
        .profile-picture-preview {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 2rem;
          font-weight: bold;
          border: 3px solid #2a3342;
        }
        
        .upload-btn {
          background: var(--primary-700);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 0.5rem 1rem;
          cursor: pointer;
          font-size: 0.875rem;
          transition: background-color 0.2s ease;
        }
        
        .upload-btn:hover:not(.disabled) {
          background: var(--primary-600);
        }
        
        .upload-btn.disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        
        @media (max-width: 640px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
          
          .profile-picture-section {
            flex-direction: column;
            text-align: center;
          }
        }
        
        .save-btn {
          background: #27ae60;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 0.75rem 2rem;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 600;
          transition: background-color 0.2s ease;
          margin-top: 1rem;
        }
        
        .save-btn:hover {
          background: #219a52;
        }
        
        .danger-zone {
          border-color: #e74c3c;
        }
        
        .danger-btn {
          background: #e74c3c;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 0.5rem 1rem;
          cursor: pointer;
          font-size: 0.875rem;
          transition: background-color 0.2s ease;
        }
        
        .danger-btn:hover {
          background: #c0392b;
        }
      ` }} />
      
      <h2 style={{ marginTop: 0, marginBottom: '2rem', color: 'var(--text)' }}>Admin Settings</h2>
      
      {/* Profile Settings */}
      <div className="settings-section">
        <h3>👤 Profile Settings</h3>
        
        <div className="profile-picture-section">
          <div className="profile-picture-preview">
            {profilePicture ? (
              <img 
                src={profilePicture} 
                alt="Profile" 
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
              />
            ) : (
              formData.name ? formData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'SA'
            )}
          </div>
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text)', fontSize: '1rem' }}>Profile Picture</h4>
            <p style={{ margin: '0 0 1rem 0', color: 'var(--muted)', fontSize: '0.875rem' }}>
              Upload a profile picture to personalize your admin account
            </p>
            <input 
              type="file" 
              accept="image/*" 
              style={{ display: 'none' }} 
              id="profile-picture-upload"
              onChange={handleProfilePictureUpload}
              disabled={saving}
            />
            <label htmlFor="profile-picture-upload" className={`upload-btn ${saving ? 'disabled' : ''}`}>
              📷 {saving ? 'Uploading...' : 'Upload Picture'}
            </label>
          </div>
        </div>
        
        {/* Success/Error Messages */}
        {message && (
          <div style={{ 
            background: '#27ae60', 
            color: 'white', 
            padding: '0.75rem', 
            borderRadius: '8px', 
            marginBottom: '1rem',
            fontSize: '0.875rem'
          }}>
            ✅ {message}
          </div>
        )}
        
        {error && (
          <div style={{ 
            background: '#e74c3c', 
            color: 'white', 
            padding: '0.75rem', 
            borderRadius: '8px', 
            marginBottom: '1rem',
            fontSize: '0.875rem'
          }}>
            ❌ {error}
          </div>
        )}

        <form className="admin-profile-form" onSubmit={handleProfileSubmit}>
          <div className="form-grid">
            <div>
              <label className="form-label" htmlFor="admin-name">Full Name</label>
              <input 
                className="form-control" 
                id="admin-name" 
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                required
                disabled={saving}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="admin-email">Email Address</label>
              <input 
                className="form-control" 
                id="admin-email" 
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                required
                disabled={saving}
              />
            </div>
          </div>
          
          <div className="form-grid" style={{ marginTop: '1rem' }}>
            <div>
              <label className="form-label" htmlFor="admin-phone">Phone Number</label>
              <input 
                className="form-control" 
                id="admin-phone" 
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter your phone number"
                required
                disabled={saving}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="admin-role">Role</label>
              <input 
                className="form-control" 
                id="admin-role" 
                value="Administrator"
                disabled
                style={{ opacity: 0.6 }}
              />
            </div>
          </div>
          
          <button type="submit" className="save-btn" disabled={saving}>
            💾 {saving ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>
      
      {/* Security Settings */}
      <div className="settings-section">
        <h3>🔐 Security Settings</h3>
        
        <div style={{ marginBottom: '1rem' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text)', fontSize: '1rem' }}>Password Management</h4>
          <p style={{ margin: '0 0 1rem 0', color: 'var(--muted)', fontSize: '0.875rem' }}>
            Keep your admin account secure by regularly updating your password
          </p>
          <a href="/okero/change-password" className="upload-btn">
            🔒 Change Password
          </a>
        </div>
        
        <div>
          <h4 style={{ margin: '1.5rem 0 0.5rem 0', color: 'var(--text)', fontSize: '1rem' }}>Two-Factor Authentication</h4>
          <p style={{ margin: '0 0 1rem 0', color: 'var(--muted)', fontSize: '0.875rem' }}>
            Add an extra layer of security to your admin account
          </p>
          <button className="upload-btn" disabled style={{ opacity: 0.6 }}>
            🔐 Enable 2FA (Coming Soon)
          </button>
        </div>
      </div>
      
      {/* System Settings */}
      <div className="settings-section">
        <h3>⚙️ System Preferences</h3>
        
        <div className="form-grid">
          <div>
            <label className="form-label" htmlFor="timezone">Timezone</label>
            <select className="form-control" id="timezone">
              <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York (EST)</option>
            </select>
          </div>
          <div>
            <label className="form-label" htmlFor="language">Language</label>
            <select className="form-control" id="language">
              <option value="en">English</option>
              <option value="sw">Swahili</option>
            </select>
          </div>
        </div>
        
        <div style={{ marginTop: '1rem' }}>
          <label className="form-label">
            <input type="checkbox" style={{ marginRight: '0.5rem' }} defaultChecked />
            Email notifications for new orders
          </label>
        </div>
        
        <div style={{ marginTop: '0.5rem' }}>
          <label className="form-label">
            <input type="checkbox" style={{ marginRight: '0.5rem' }} defaultChecked />
            Email notifications for pending approvals
          </label>
        </div>
        
        <button type="button" className="save-btn">
          💾 Save Preferences
        </button>
      </div>
      
      {/* Danger Zone */}
      <div className="settings-section danger-zone">
        <h3 style={{ color: '#e74c3c' }}>⚠️ Danger Zone</h3>
        
        <div>
          <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text)', fontSize: '1rem' }}>Reset Admin Settings</h4>
          <p style={{ margin: '0 0 1rem 0', color: 'var(--muted)', fontSize: '0.875rem' }}>
            This will reset all admin preferences to default values. This action cannot be undone.
          </p>
          <button className="danger-btn">
            🔄 Reset Settings
          </button>
        </div>
      </div>
    </div>
  )
}
