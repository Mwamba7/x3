'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function NewFashionProductPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    category: '', // hoodie, shoes, sneakers
    price: '',
    img: '',
    images: '', // comma-separated
    meta: '',
    condition: '',
    status: 'available',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])

  useEffect(() => {
    const allow = new Set(['hoodie','shoes','sneakers'])
    const fallback = [
      { key: 'hoodie', label: 'Hoodies' },
      { key: 'shoes', label: 'Shoes' },
      { key: 'sneakers', label: 'Sneakers' },
    ]
    fetch('/api/categories')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const arr = Array.isArray(data) ? data : []
        const filtered = arr.filter(c => allow.has(c.key))
        setCategories(filtered.length ? filtered : fallback)
      })
      .catch(() => setCategories(fallback))
  }, [])

  function bind(k) {
    return {
      value: form[k],
      onChange: (e) => setForm((s) => ({ ...s, [k]: e.target.value }))
    }
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category.trim(),
        price: Number(form.price),
        img: form.img.trim(),
        images: form.images.trim() ? form.images.split(',').map(s => s.trim()) : [],
        meta: form.meta,
        condition: form.condition,
        status: form.status,
      }
      if (!payload.category || !['hoodie','shoes','sneakers'].includes(payload.category)) {
        throw new Error('Please select a valid fashion category')
      }
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Create failed')
      router.push('/admin/fashion')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="container" style={{ padding: '24px 0', maxWidth: 720 }}>
      <h2 style={{ marginTop: 0, marginBottom: 10 }}>Add Fashion Product</h2>
      <form onSubmit={onSubmit} className="sell-form" style={{ display: 'grid', gap: 12 }}>
        <div className="grid-2">
          <div>
            <label className="form-label" htmlFor="name">Name</label>
            <input className="form-control" id="name" placeholder="Product name" {...bind('name')} required />
          </div>
          <div>
            <label className="form-label" htmlFor="category">Category</label>
            <select className="form-control" id="category" value={form.category} onChange={e => setForm(s => ({ ...s, category: e.target.value }))} required>
              <option value="">Select category…</option>
              {categories.map(c => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid-2">
          <div>
            <label className="form-label" htmlFor="price">Price (Ksh)</label>
            <input className="form-control" id="price" type="number" min="0" step="1" placeholder="e.g. 3500" {...bind('price')} required />
          </div>
          <div>
            <label className="form-label" htmlFor="status">Status</label>
            <select className="form-control" id="status" {...bind('status')}>
              <option value="available">available</option>
              <option value="sold">sold</option>
            </select>
          </div>
        </div>

        <div>
          <label className="form-label" htmlFor="img">Cover Image URL</label>
          <input className="form-control" id="img" placeholder="https://..." {...bind('img')} required />
        </div>

        <div>
          <label className="form-label" htmlFor="images">Gallery Images (comma-separated URLs)</label>
          <input className="form-control" id="images" placeholder="https://..., https://..." {...bind('images')} />
        </div>

        <div>
          <label className="form-label" htmlFor="condition">Condition</label>
          <input className="form-control" id="condition" placeholder="e.g. New, Refurbished" {...bind('condition')} />
        </div>

        <div>
          <label className="form-label" htmlFor="meta">Meta / Details</label>
          <textarea className="form-control" id="meta" rows={4} placeholder="e.g. Cotton | Medium | Blue" {...bind('meta')} />
        </div>

        {error && <p style={{ color: '#f2994a', margin: 0 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Saving…' : 'Save'}</button>
          <a className="btn" href="/admin/fashion">Cancel</a>
        </div>
      </form>
    </main>
  )
}
