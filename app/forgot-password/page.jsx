'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const validateEmail = (email) => {
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (!email.trim()) {
      setError('Email address is required')
      setLoading(false)
      return
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Password reset instructions have been sent to your email address.')
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      } else {
        setError(data.error || 'Failed to send reset email')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    }

    setLoading(false)
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
        maxHeight: '75vh',
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
            🔐
          </div>
          <h1 style={{ 
            fontSize: '20px',
            fontWeight: '700',
            color: 'white',
            marginBottom: '2px',
            letterSpacing: '-0.025em'
          }}>
            Reset Password
          </h1>
          <p style={{ color: 'white', fontSize: '12px', fontWeight: '400', opacity: '0.8' }}>
            Enter your email to receive reset instructions
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '8px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: 'white'
            }}>
              Email Address *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '2px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '13px',
                boxSizing: 'border-box',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              placeholder="Enter your email address"
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb'
              }}
            />
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
            disabled={loading || !email.trim()}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: loading || !email.trim() ? '#9ca3af' : '#39d98a',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading || !email.trim() ? 'not-allowed' : 'pointer',
              marginBottom: '16px',
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
                Sending...
              </span>
            ) : 'Send Reset Instructions'}
          </button>
        </form>

        {/* Back to Login */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <p style={{ color: 'white', fontSize: '14px', opacity: '0.8' }}>
            Remember your password?{' '}
            <Link 
              href="/login" 
              style={{ 
                color: '#39d98a', 
                textDecoration: 'none',
                fontWeight: '600'
              }}
            >
              Back to Sign In
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
              fontSize: '14px',
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
