'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')
      router.push('/okero')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="container" style={{ padding: '24px 0', maxWidth: 520 }}>
      <h2 style={{ marginTop: 0, marginBottom: 12 }}>Admin Login</h2>
      <form onSubmit={onSubmit} className="sell-form" style={{ display: 'grid', gap: 12 }}>
        <div>
          <label className="form-label" htmlFor="username">Username</label>
          <input 
            className="form-control" 
            id="username" 
            value={username} 
            onChange={e => setUsername(e.target.value)} 
            placeholder="Enter admin username" 
            required
          />
        </div>
        <div>
          <label className="form-label" htmlFor="password">Password</label>
          <input 
            className="form-control" 
            id="password" 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            placeholder="Enter admin password" 
            required
          />
        </div>
        {error && <p style={{ color: '#f2994a', margin: 0 }}>{error}</p>}
        <div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </div>
      </form>
      <p style={{ marginTop: '16px', fontSize: '14px', color: '#666' }}>
        Session will automatically expire after 8 minutes of inactivity.
      </p>
    </main>
  )
}
