'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function NewPreownedProductPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    // store subcategory only here; transform to 'preowned-<subcategory>' on submit
    subcategory: '', // tv, radio, phone, fridge, cooler, accessory, other
    price: '',
    img: '',
    images: '', // comma-separated
    meta: '',
    condition: 'pre-owned',
    status: 'available',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])

  useEffect(() => {
    // Pre-owned subcategories; you can adjust this list
    const fallback = [
      { key: 'tv', label: 'Televisions' },
      { key: 'radio', label: 'Radios' },
      { key: 'phone', label: 'Mobile Phones' },
      { key: 'laptop', label: 'Laptops' },
      { key: 'tablet', label: 'Tablets' },
      { key: 'fridge', label: 'Fridges' },
      { key: 'cooler', label: 'Gas Coolers' },
      { key: 'accessory', label: 'Accessories' },
      { key: 'other', label: 'Other' },
    ]
    setCategories(fallback)
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
      const sub = (form.subcategory || '').trim()
      if (!sub) throw new Error('Please select a category')
      const payload = {
        name: form.name.trim(),
        // isolate under category that starts with 'preowned'
        category: `preowned-${sub}`,
        price: Number(form.price),
        img: form.img.trim(),
        images: form.images.trim() ? form.images.split(',').map(s => s.trim()).filter(Boolean) : [],
        meta: form.meta,
        condition: form.condition,
        status: form.status,
      }
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Create failed')
      router.push('/admin/preowned')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="container" style={{ padding: '24px 0', maxWidth: 720 }}>
      <h2 style={{ marginTop: 0, marginBottom: 10 }}>Add Pre-owned Product</h2>
      <form onSubmit={onSubmit} className="sell-form" style={{ display: 'grid', gap: 12 }}>
        <div className="grid-2">
          <div>
            <label className="form-label" htmlFor="name">Name</label>
            <input className="form-control" id="name" placeholder="Product name" {...bind('name')} required />
          </div>
          <div>
            <label className="form-label" htmlFor="subcategory">Category</label>
            <select className="form-control" id="subcategory" value={form.subcategory} onChange={e => setForm(s => ({ ...s, subcategory: e.target.value }))} required>
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
            <input className="form-control" id="price" type="number" min="0" step="1" placeholder="e.g. 4500" {...bind('price')} required />
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
          <input className="form-control" id="condition" placeholder="e.g. Pre-owned, Refurbished" {...bind('condition')} />
        </div>

        <div>
          <label className="form-label" htmlFor="meta">Meta / Details</label>
          <textarea className="form-control" id="meta" rows={4} placeholder="e.g. 1080p | HDMI | Smart" {...bind('meta')} />
        </div>

        {error && <p style={{ color: '#f2994a', margin: 0 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Saving…' : 'Save'}</button>
          <a className="btn" href="/admin/preowned">Cancel</a>
        </div>
      </form>
    </main>
  )
}
