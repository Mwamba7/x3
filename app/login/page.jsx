'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../components/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [formData, setFormData] = useState({
    emailOrPhone: '',
    password: '',
    rememberMe: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [validationErrors, setValidationErrors] = useState({})
  const { login, isAuthenticated } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get redirect URL from query params
  const redirectUrl = searchParams.get('redirect') || '/account'

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectUrl)
    }
  }, [isAuthenticated, router, redirectUrl])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const errors = {}
    
    // Email or Phone validation
    if (!formData.emailOrPhone.trim()) {
      errors.emailOrPhone = 'Email or phone number is required'
    } else {
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
      const phoneRegex = /^(\+254|254|0)[17]\d{8}$/
      
      if (!emailRegex.test(formData.emailOrPhone) && !phoneRegex.test(formData.emailOrPhone)) {
        errors.emailOrPhone = 'Please enter a valid email address or Kenyan phone number'
      }
    }
    
    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long'
    }
    
    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    
    // Validate form
    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      setLoading(false)
      return
    }

    const result = await login(formData.emailOrPhone, formData.password, formData.rememberMe)
    
    if (result.success) {
      setSuccess('Login successful! Redirecting...')
      setTimeout(() => {
        router.push(redirectUrl)
      }, 1500)
    } else {
      setError(result.error)
    }
    
    setLoading(false)
  }

  const isFormValid = () => {
    return formData.emailOrPhone.trim() && 
           formData.password && 
           Object.keys(validationErrors).length === 0
  }

  return (
    <div style={{ 
      height: '100vh',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      background: '#0e1116',
      padding: '0 10px',
      margin: '0',
      paddingTop: '0',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      <div style={{
        backgroundColor: '#1b2230',
        color: '#e6e9ef',
        padding: '15px',
        borderRadius: '12px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
        width: '100%',
        maxWidth: '420px',
        maxHeight: '80vh',
        overflowY: 'auto',
        position: 'relative',
        marginTop: '20px',
        marginBottom: '20px'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            backgroundColor: '#39d98a',
            borderRadius: '50%',
            margin: '0 auto 4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            color: 'white'
          }}>
            👋
          </div>
          <h1 style={{ 
            fontSize: '20px',
            fontWeight: '700',
            color: 'white',
            marginBottom: '2px',
            letterSpacing: '-0.025em'
          }}>
            Welcome Back
          </h1>
          <p style={{ color: 'white', fontSize: '12px', fontWeight: '400', opacity: '0.8' }}>
            Sign in to your Think Twice account
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Email or Phone Input */}
          <div style={{ marginBottom: '8px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '12px',
              fontWeight: '600',
              color: 'white'
            }}>
              Email or Phone Number *
            </label>
            <input
              type="text"
              name="emailOrPhone"
              value={formData.emailOrPhone}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '8px 10px',
                border: validationErrors.emailOrPhone ? '2px solid #ef4444' : '2px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '13px',
                boxSizing: 'border-box',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              placeholder="Enter email or phone number"
              onFocus={(e) => {
                if (!validationErrors.emailOrPhone) {
                  e.target.style.borderColor = '#667eea'
                }
              }}
              onBlur={(e) => {
                if (!validationErrors.emailOrPhone) {
                  e.target.style.borderColor = '#e5e7eb'
                }
              }}
            />
            {validationErrors.emailOrPhone && (
              <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', fontWeight: '500' }}>
                {validationErrors.emailOrPhone}
              </p>
            )}
          </div>

          {/* Password Input */}
          <div style={{ marginBottom: '8px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '12px',
              fontWeight: '600',
              color: 'white'
            }}>
              Password *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  paddingRight: '40px',
                  border: validationErrors.password ? '2px solid #ef4444' : '2px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  appearance: 'none'
                }}
                placeholder="Enter your password"
                onFocus={(e) => {
                  if (!validationErrors.password) {
                    e.target.style.borderColor = '#667eea'
                  }
                }}
                onBlur={(e) => {
                  if (!validationErrors.password) {
                    e.target.style.borderColor = '#e5e7eb'
                  }
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {showPassword ? (
                  // Eye Open Icon
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                ) : (
                  // Eye Closed Icon
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                )}
              </button>
            </div>
            {validationErrors.password && (
              <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', fontWeight: '500' }}>
                {validationErrors.password}
              </p>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              cursor: 'pointer',
              fontSize: '12px',
              color: 'white'
            }}>
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                style={{
                  marginRight: '8px',
                  width: '14px',
                  height: '14px',
                  accentColor: '#667eea'
                }}
              />
              Remember me
            </label>
            <Link 
              href="/forgot-password" 
              style={{ 
                color: '#39d98a', 
                textDecoration: 'none',
                fontSize: '12px',
                fontWeight: '500'
              }}
            >
              Forgot password?
            </Link>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '14px',
              border: '1px solid #fecaca',
              fontWeight: '500'
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div style={{
              backgroundColor: '#f0fdf4',
              color: '#16a34a',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '14px',
              border: '1px solid #bbf7d0',
              fontWeight: '500'
            }}>
              ✅ {success}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !isFormValid()}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: loading || !isFormValid() ? '#9ca3af' : '#39d98a',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading || !isFormValid() ? 'not-allowed' : 'pointer',
              marginBottom: '24px',
              transition: 'all 0.2s ease',
              transform: loading ? 'scale(0.98)' : 'scale(1)'
            }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ 
                  display: 'inline-block',
                  width: '16px',
                  height: '16px',
                  border: '2px solid #ffffff',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginRight: '8px'
                }}></span>
                Signing In...
              </span>
            ) : 'Sign In'}
          </button>
        </form>

        {/* Sign Up Link */}
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <p style={{ color: 'white', fontSize: '12px', opacity: '0.8' }}>
            Don't have an account?{' '}
            <Link 
              href={`/register${redirectUrl !== '/account' ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`}
              style={{ 
                color: '#39d98a', 
                textDecoration: 'none',
                fontWeight: '600'
              }}
            >
              Create one here
            </Link>
          </p>
        </div>

        {/* Back to Home */}
        <div style={{ 
          textAlign: 'center',
          paddingTop: '20px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <Link 
            href="/" 
            style={{ 
              color: 'white', 
              textDecoration: 'none',
              fontSize: '12px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              opacity: '0.8'
            }}
          >
            Back to Home
          </Link>
        </div>
      </div>

      {/* CSS Animation and Reset */}
      <style jsx global>{`
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          height: 100% !important;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
