'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminProductForm({ initial }) {
  const router = useRouter()
  const isEdit = Boolean(initial?.id)
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
  const [imageList, setImageList] = useState(() => {
    const arr = Array.isArray(initial?.images) ? initial.images : (initial?.images ? String(initial.images).split(',').map(s=>s.trim()).filter(Boolean) : [])
    return Array.isArray(arr) ? arr : []
  })
  const [newImageUrl, setNewImageUrl] = useState('')

  useEffect(() => {
    if (isEdit) return // do not change categories list on edit; category is locked
    const fallbackFashion = [
      { key: 'outfits', label: 'Outfits' },
      { key: 'hoodie', label: 'Hoodies' },
      { key: 'shoes', label: 'Shoes' },
      { key: 'sneakers', label: 'Sneakers' },
      { key: 'ladies', label: 'Ladies' },
      { key: 'men', label: 'Men' },
    ]
    const fallbackElectronics = [
      { key: 'tv', label: 'Televisions' },
      { key: 'radio', label: 'Sound systems' },
      { key: 'phone', label: 'Mobile phones' },
      { key: 'electronics', label: 'Electronics' },
      { key: 'accessory', label: 'Accessories' },
      { key: 'appliances', label: 'Appliances' },
    ]
    fetch('/api/categories')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const arr = Array.isArray(data) ? data : []
        const fashion = new Set(['outfits','hoodie','shoes','sneakers','ladies','men'])
        const isFashion = fashion.has((initial?.category || form.category || '').toLowerCase())
        const allow = isFashion
          ? fashion
          : new Set(['tv','radio','phone','electronics','accessory','appliances'])
        const filtered = arr.filter(c => allow.has(c.key))
        setCategories(filtered.length ? filtered : (isFashion ? fallbackFashion : fallbackElectronics))
      })
      .catch(() => setCategories([]))
  }, [initial?.category, form.category, isEdit])

  function bind(k) {
    return {
      value: form[k],
      onChange: (e) => setForm((s) => ({ ...s, [k]: e.target.value }))
    }
  }

  // Keep imageList and form.images in sync
  useEffect(() => {
    const csv = imageList.join(', ')
    setForm(s => ({ ...s, images: csv }))
  }, [imageList])

  function addImage() {
    const url = newImageUrl.trim()
    if (!url) return
    setImageList(list => Array.from(new Set([...list, url])))
    setNewImageUrl('')
  }

  function updateImageAt(i, url) {
    setImageList(list => list.map((v, idx) => idx === i ? url : v).filter(Boolean))
  }

  function removeImage(i) {
    setImageList(list => list.filter((_, idx) => idx !== i))
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
      // When editing, keep category unchanged — do not send it in the PATCH body
      if (isEdit) {
        delete payload.category
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
          {isEdit ? (
            <input className="form-control" id="category" value={form.category} readOnly disabled title="Category cannot be changed when editing" />
          ) : (
            <select className="form-control" id="category" value={form.category} onChange={e => setForm(s => ({ ...s, category: e.target.value }))} required>
              <option value="">Select category…</option>
              {categories.map(c => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          )}
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

      {/* Manage Gallery (More Photos) */}
      <fieldset>
        <legend>More Photos (Product Gallery)</legend>
        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input className="form-control" placeholder="Add image URL and click Add" value={newImageUrl} onChange={(e)=>setNewImageUrl(e.target.value)} style={{ flex: 1, minWidth: 240 }} />
            <button type="button" className="btn" onClick={addImage}>Add Photo</button>
          </div>
          {imageList.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
              {imageList.map((src, i) => (
                <div key={i} style={{ border: '1px solid #253049', borderRadius: 10, overflow: 'hidden', background: 'var(--card)' }}>
                  <div style={{ position: 'relative', height: 120, background: '#0e1421' }}>
                    {src ? <img src={src} alt={`Image ${i+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : null}
                  </div>
                  <div style={{ padding: 8, display: 'grid', gap: 6 }}>
                    <input className="form-control" value={src} onChange={(e)=>updateImageAt(i, e.target.value)} placeholder="https://..." />
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                      <span className="helper">Photo {i+1}</span>
                      <button type="button" className="btn" onClick={()=>removeImage(i)} style={{ borderColor: '#5a2a2a', color: '#f87171' }}>Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="helper">These photos appear in the product page gallery and the promo "More Photos" section.</p>
        </div>
      </fieldset>

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
