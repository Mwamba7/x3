'use client'

import { useState } from 'react'

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setMsg('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to change password')
      setMsg('Password updated successfully.')
      setCurrentPassword('')
      setNewPassword('')
    } catch (err) {
      setMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="container" style={{ padding: '24px 0', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 84px)', maxWidth: 520 }}>
      <h2 style={{ marginTop: 0, marginBottom: 12 }}>Change Password</h2>
      <form onSubmit={onSubmit} className="sell-form" style={{ display: 'grid', gap: 12 }}>
        <div>
          <label className="form-label" htmlFor="cur">Current Password</label>
          <input className="form-control" id="cur" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
        </div>
        <div>
          <label className="form-label" htmlFor="new">New Password</label>
          <input className="form-control" id="new" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
        </div>
        {msg && <p style={{ margin: 0, color: msg.includes('success') ? 'var(--primary)' : '#f2994a' }}>{msg}</p>}
        <div>
          <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </main>
  )
}
