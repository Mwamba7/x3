'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../components/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [validationErrors, setValidationErrors] = useState({})
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: '' })
  const { register, isAuthenticated } = useAuth()
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
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }

    // Check password strength in real-time
    if (name === 'password') {
      checkPasswordStrength(value)
    }
  }

  const checkPasswordStrength = (password) => {
    let score = 0
    let feedback = ''
    
    if (password.length >= 8) score += 1
    if (/[a-z]/.test(password)) score += 1
    if (/[A-Z]/.test(password)) score += 1
    if (/[0-9]/.test(password)) score += 1
    if (/[^A-Za-z0-9]/.test(password)) score += 1
    
    switch (score) {
      case 0:
      case 1:
        feedback = 'Very Weak'
        break
      case 2:
        feedback = 'Weak'
        break
      case 3:
        feedback = 'Fair'
        break
      case 4:
        feedback = 'Good'
        break
      case 5:
        feedback = 'Strong'
        break
    }
    
    setPasswordStrength({ score, feedback })
  }

  const validateForm = () => {
    const errors = {}
    
    // First Name validation
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required'
    } else if (formData.firstName.trim().length < 2) {
      errors.firstName = 'First name must be at least 2 characters long'
    } else if (formData.firstName.trim().length > 25) {
      errors.firstName = 'First name cannot exceed 25 characters'
    }
    
    // Last Name validation
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required'
    } else if (formData.lastName.trim().length < 2) {
      errors.lastName = 'Last name must be at least 2 characters long'
    } else if (formData.lastName.trim().length > 25) {
      errors.lastName = 'Last name cannot exceed 25 characters'
    }
    
    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email address is required'
    } else {
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
      if (!emailRegex.test(formData.email)) {
        errors.email = 'Please enter a valid email address'
      }
    }
    
    // Phone validation
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required'
    } else {
      const phoneRegex = /^(\+254|254|0)[17]\d{8}$/
      if (!phoneRegex.test(formData.phone)) {
        errors.phone = 'Please enter a valid Kenyan phone number (e.g., 0712345678)'
      }
    }
    
    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long'
    } else if (passwordStrength.score < 3) {
      errors.password = 'Password is too weak. Use uppercase, lowercase, numbers, and symbols'
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
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

    // Combine first and last name
    const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`
    const result = await register(fullName, formData.email, formData.password, formData.phone)
    
    if (result.success) {
      setSuccess('Account created successfully! Redirecting...')
      setTimeout(() => {
        router.push(redirectUrl)
      }, 1500)
    } else {
      setError(result.error)
    }
    
    setLoading(false)
  }

  const isFormValid = () => {
    return formData.firstName.trim() && 
           formData.lastName.trim() && 
           formData.email.trim() && 
           formData.phone.trim() && 
           formData.password && 
           formData.confirmPassword &&
           formData.password === formData.confirmPassword &&
           passwordStrength.score >= 3 &&
           Object.keys(validationErrors).length === 0
  }

  const getPasswordStrengthColor = () => {
    switch (passwordStrength.score) {
      case 0:
      case 1:
        return '#ef4444'
      case 2:
        return '#f59e0b'
      case 3:
        return '#eab308'
      case 4:
        return '#22c55e'
      case 5:
        return '#16a34a'
      default:
        return '#e5e7eb'
    }
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
        maxHeight: '85vh',
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
            🚀
          </div>
          <h1 style={{ 
            fontSize: '20px',
            fontWeight: '700',
            color: 'white',
            marginBottom: '2px',
            letterSpacing: '-0.025em'
          }}>
            Create Account
          </h1>
          <p style={{ color: 'white', fontSize: '12px', fontWeight: '400', opacity: '0.8' }}>
            Join Think Twice Resellers today
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* First Name and Last Name Inputs */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              {/* First Name */}
              <div style={{ flex: 1 }}>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'white'
                }}>
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    border: validationErrors.firstName ? '2px solid #ef4444' : '2px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                  placeholder="First name"
                  onFocus={(e) => {
                    if (!validationErrors.firstName) {
                      e.target.style.borderColor = '#667eea'
                    }
                  }}
                  onBlur={(e) => {
                    if (!validationErrors.firstName) {
                      e.target.style.borderColor = '#e5e7eb'
                    }
                  }}
                />
                {validationErrors.firstName && (
                  <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', fontWeight: '500' }}>
                    {validationErrors.firstName}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div style={{ flex: 1 }}>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'white'
                }}>
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    border: validationErrors.lastName ? '2px solid #ef4444' : '2px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                  placeholder="Last name"
                  onFocus={(e) => {
                    if (!validationErrors.lastName) {
                      e.target.style.borderColor = '#667eea'
                    }
                  }}
                  onBlur={(e) => {
                    if (!validationErrors.lastName) {
                      e.target.style.borderColor = '#e5e7eb'
                    }
                  }}
                />
                {validationErrors.lastName && (
                  <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', fontWeight: '500' }}>
                    {validationErrors.lastName}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Email Input */}
          <div style={{ marginBottom: '8px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '12px',
              fontWeight: '600',
              color: 'white'
            }}>
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: validationErrors.email ? '2px solid #ef4444' : '2px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              placeholder="Enter your email address"
              onFocus={(e) => {
                if (!validationErrors.email) {
                  e.target.style.borderColor = '#667eea'
                }
              }}
              onBlur={(e) => {
                if (!validationErrors.email) {
                  e.target.style.borderColor = '#e5e7eb'
                }
              }}
            />
            {validationErrors.email && (
              <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', fontWeight: '500' }}>
                {validationErrors.email}
              </p>
            )}
          </div>

          {/* Phone Number Input */}
          <div style={{ marginBottom: '8px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '12px',
              fontWeight: '600',
              color: 'white'
            }}>
              Phone Number *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: validationErrors.phone ? '2px solid #ef4444' : '2px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              placeholder="0712345678"
              onFocus={(e) => {
                if (!validationErrors.phone) {
                  e.target.style.borderColor = '#667eea'
                }
              }}
              onBlur={(e) => {
                if (!validationErrors.phone) {
                  e.target.style.borderColor = '#e5e7eb'
                }
              }}
            />
            {validationErrors.phone && (
              <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', fontWeight: '500' }}>
                {validationErrors.phone}
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
                  padding: '10px 40px 10px 12px',
                  border: validationErrors.password ? '2px solid #ef4444' : '2px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                placeholder="Create a strong password"
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
                  color: 'white',
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
            
            {/* Password Strength Indicator */}
            {formData.password && (
              <div style={{ marginTop: '8px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '4px'
                }}>
                  <span style={{ fontSize: '11px', color: '#6b7280' }}>Password Strength:</span>
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: '600',
                    color: getPasswordStrengthColor()
                  }}>
                    {passwordStrength.feedback}
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: '4px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${(passwordStrength.score / 5) * 100}%`,
                    height: '100%',
                    backgroundColor: getPasswordStrengthColor(),
                    transition: 'all 0.3s ease'
                  }}></div>
                </div>
              </div>
            )}
            
            {validationErrors.password && (
              <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', fontWeight: '500' }}>
                {validationErrors.password}
              </p>
            )}
          </div>

          {/* Confirm Password Input */}
          <div style={{ marginBottom: '8px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '12px',
              fontWeight: '600',
              color: 'white'
            }}>
              Confirm Password *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 12px',
                  border: validationErrors.confirmPassword ? '2px solid #ef4444' : '2px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                placeholder="Confirm your password"
                onFocus={(e) => {
                  if (!validationErrors.confirmPassword) {
                    e.target.style.borderColor = '#667eea'
                  }
                }}
                onBlur={(e) => {
                  if (!validationErrors.confirmPassword) {
                    e.target.style.borderColor = '#e5e7eb'
                  }
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'white',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {showConfirmPassword ? (
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
            {validationErrors.confirmPassword && (
              <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', fontWeight: '500' }}>
                {validationErrors.confirmPassword}
              </p>
            )}
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
              backgroundColor: loading || !isFormValid() ? '#9ca3af' : '#16a34a',
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
                Creating Account...
              </span>
            ) : 'Create Account'}
          </button>
        </form>

        {/* Sign In Link */}
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <p style={{ color: 'white', fontSize: '12px', opacity: '0.8' }}>
            Already have an account?{' '}
            <Link 
              href={`/login${redirectUrl !== '/account' ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`}
              style={{ 
                color: '#39d98a', 
                textDecoration: 'none',
                fontWeight: '600'
              }}
            >
              Sign in here
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
              justifyContent: 'center'
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
