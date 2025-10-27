'use client'

import { useEffect } from 'react'
import { useAuth } from '../../components/AuthContext'
import { useRouter } from 'next/navigation'
import SellForm from '../../components/SellForm'
import Link from 'next/link'

export default function SellPage() {
  const { isAuthenticated, loading, user } = useAuth()
  const router = useRouter()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login?redirect=/sell')
    }
  }, [isAuthenticated, loading, router])

  // Show loading state while checking authentication
  if (loading) {
    return (
      <main className="container" style={{ padding: '24px 0', textAlign: 'center' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: '200px',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div className="loading-spinner"></div>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Checking authentication...</p>
        </div>
        <style dangerouslySetInnerHTML={{
          __html: `
            .loading-spinner {
              width: 40px;
              height: 40px;
              border: 4px solid #e5e7eb;
              border-top: 4px solid #667eea;
              border-radius: 50%;
              animation: spin 1s linear infinite;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `
        }} />
      </main>
    )
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <main className="container" style={{ padding: '24px 0', textAlign: 'center' }}>
        <div style={{ 
          maxWidth: '400px', 
          margin: '0 auto',
          padding: '32px 24px',
          backgroundColor: '#f8fafc',
          borderRadius: '12px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            backgroundColor: '#667eea',
            borderRadius: '50%',
            margin: '0 auto 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            color: 'white'
          }}>
            🔐
          </div>
          <h2 style={{ marginBottom: '12px', fontSize: '20px', color: '#1a202c' }}>
            Account Required
          </h2>
          <p style={{ 
            marginBottom: '24px', 
            fontSize: '14px', 
            color: '#6b7280',
            lineHeight: '1.5'
          }}>
            You need to be signed in to sell products on Think Twice Resellers. This helps us track your listings and manage your sales.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link 
              href="/login?redirect=/sell"
              style={{
                padding: '10px 20px',
                backgroundColor: '#667eea',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Sign In
            </Link>
            <Link 
              href="/register?redirect=/sell"
              style={{
                padding: '10px 20px',
                backgroundColor: 'transparent',
                color: '#667eea',
                textDecoration: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                border: '1px solid #667eea'
              }}
            >
              Create Account
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="container" style={{ padding: '24px 0' }}>
      <header style={{ marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, marginBottom: 6, fontSize: 16 }}>Sell Your Product</h2>
        <p className="meta" style={{ margin: '16px 0 0 0', fontSize: 14, lineHeight: 1.5 }}>
          Welcome back, <strong>{user?.name}</strong>! Provide accurate details to help us value your product and process your request quickly.
        </p>
      </header>

      <div className="sell-layout" style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr', alignItems: 'start' }}>
        <section style={{ padding: 0 }}>
          <SellForm />
        </section>
        <aside style={{ padding: 0 }}>
          <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: 16 }}>Tips for Faster Processing</h3>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
            <li>Include clear photos (front, back, close‑ups).</li>
            <li>Describe condition honestly (scratches, battery health, etc.).</li>
            <li>Add accessories included (charger, box, cables).</li>
          </ul>
          <h4 style={{ marginTop: 14, marginBottom: 6, fontSize: 15 }}>Payment & Policy</h4>
          <p className="meta" style={{ margin: 0, fontSize: 14 }}>Payment is made once the goods have been delivered and confirmed. Closed on public holidays.</p>
        </aside>
      </div>
    </main>
  )
}
