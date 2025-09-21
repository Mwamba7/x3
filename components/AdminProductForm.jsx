'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminProductForm({ initial }) {
  const router = useRouter()
  const [form, setForm] = useState({
    name: initial?.name || '',
    category: initial?.category || '',
    price: initial?.price?.toString() || '',
    img: initial?.img || '',
    images: Array.isArray(initial?.images) ? initial.images.join(', ') : '',
    meta: initial?.meta || '',
    condition: initial?.condition || '',
    status: initial?.status || 'available',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState([])

  useEffect(() => {
    const fallbackFashion = [
      { key: 'hoodie', label: 'Hoodies' },
      { key: 'shoes', label: 'Shoes' },
      { key: 'sneakers', label: 'Sneakers' },
    ]
    const fallbackElectronics = [
      { key: 'tv', label: 'Televisions' },
      { key: 'radio', label: 'Radios' },
      { key: 'phone', label: 'Mobile Phones' },
      { key: 'fridge', label: 'Fridges' },
      { key: 'cooler', label: 'Gas Coolers' },
      { key: 'accessory', label: 'Accessories' },
    ]
    fetch('/api/categories')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const arr = Array.isArray(data) ? data : []
        const fashion = new Set(['hoodie','shoes','sneakers'])
        const isFashion = fashion.has((initial?.category || form.category || '').toLowerCase())
        const allow = isFashion
          ? fashion
          : new Set(['tv','radio','phone','fridge','cooler','accessory'])
        const filtered = arr.filter(c => allow.has(c.key))
        setCategories(filtered.length ? filtered : (isFashion ? fallbackFashion : fallbackElectronics))
      })
      .catch(() => setCategories([]))
  }, [initial?.category, form.category])

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
        images: form.images.trim() ? form.images.split(',').map(s => s.trim()).filter(Boolean) : [],
        meta: form.meta,
        condition: form.condition,
        status: form.status,
      }
      const res = await fetch(`/api/products/${initial.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Update failed')
      router.push('/admin/products')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function onDelete() {
    if (!confirm('Are you sure you want to delete this product?')) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/products/${initial.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Delete failed')
      router.push('/admin/products')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
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
          <input className="form-control" id="price" type="number" min="0" step="1" placeholder="e.g. 45000" {...bind('price')} required />
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
        <label className="form-label" htmlFor="meta">Meta / Specs</label>
        <textarea className="form-control" id="meta" rows={4} placeholder="e.g. 1080p | HDMI | Smart" {...bind('meta')} />
      </div>

      {error && <p style={{ color: '#f2994a', margin: 0 }}>{error}</p>}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Saving…' : 'Save'}</button>
        <button className="btn" type="button" onClick={() => history.back()} disabled={loading}>Cancel</button>
        <button className="btn" type="button" onClick={onDelete} disabled={loading} style={{ borderColor: '#5a2a2a', color: '#f87171' }}>Delete</button>
      </div>
    </form>
  )
}
