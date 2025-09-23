'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminHeroSlideForm({ initial, products: productsProp = [] }) {
  const router = useRouter()
  const [form, setForm] = useState({
    imageUrl: initial?.imageUrl || '',
    popupType: initial?.popupType || 'flash_sale',
    title: initial?.title || '',
    subtitle: initial?.subtitle || '',
    price: initial?.price ?? '',
    // ctaHref removed from UI; Buy Now always links to the selected product
    productId: initial?.productId || '',
    gallery: (() => {
      try {
        if (initial?.galleryJson) {
          const arr = JSON.parse(initial.galleryJson)
          return Array.isArray(arr) ? arr.join(', ') : ''
        }
      } catch {}
      return ''
    })(),
    sortOrder: initial?.sortOrder ?? 0,
    active: initial?.active ?? true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [products, setProducts] = useState(productsProp)

  // Load products for convenient selection when not provided by server
  useEffect(() => {
    if (productsProp && productsProp.length) return
    fetch('/api/products')
      .then(r => r.ok ? r.json() : [])
      .then(arr => {
        if (Array.isArray(arr)) {
          setProducts(arr.map(p => ({ id: p.id, name: p.name })))
        }
      })
      .catch(() => setProducts([]))
  }, [productsProp])

  useEffect(() => {
    if (initial) {
      setForm({
        imageUrl: initial.imageUrl || '',
        popupType: initial.popupType || 'flash_sale',
        title: initial.title || '',
        subtitle: initial.subtitle || '',
        price: initial.price ?? '',
        ctaLabel: initial.ctaLabel || 'Shop Now',
        ctaHref: initial.ctaHref || '/#collection',
        sortOrder: initial.sortOrder ?? 0,
        active: initial.active ?? true,
      })
    }
  }, [initial])

  function bind(k) {
    return {
      value: form[k],
      onChange: (e) => setForm((s) => ({ ...s, [k]: e.target.type === 'number' ? Number(e.target.value) : e.target.value }))
    }
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (!form.productId || !form.productId.trim()) {
        throw new Error('Please select a Product. Buy Now links to the product page.')
      }
      const payload = {
        imageUrl: String(form.imageUrl || '').trim(),
        popupType: String(form.popupType || 'flash_sale').trim(),
        title: form.title?.trim() || null,
        subtitle: form.subtitle?.trim() || null,
        price: form.price === '' ? null : Number(form.price),
        ctaLabel: 'Buy Now',
        productId: form.productId?.trim() || null,
        gallery: form.gallery?.trim() ? form.gallery.split(',').map(s => s.trim()).filter(Boolean) : [],
        sortOrder: Number(form.sortOrder) || 0,
        active: Boolean(form.active),
      }
      const url = initial?.id ? `/api/hero-slides/${initial.id}` : '/api/hero-slides'
      const method = initial?.id ? 'PATCH' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Save failed')
      router.push('/admin/hero-slides')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function onDelete() {
    if (!initial?.id) return
    if (!confirm('Delete this slide?')) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/hero-slides/${initial.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Delete failed')
      router.push('/admin/hero-slides')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="sell-form" style={{ display: 'grid', gap: 12 }}>
      <div>
        <label className="form-label" htmlFor="imageUrl">Background Image URL</label>
        <input id="imageUrl" className="form-control" placeholder="https://..." value={form.imageUrl} onChange={(e)=>setForm(s=>({ ...s, imageUrl: e.target.value }))} required />
      </div>

      <div className="grid-2">
        <div>
          <label className="form-label" htmlFor="popupType">Popup Type</label>
          <select id="popupType" className="form-control" value={form.popupType} onChange={(e)=>setForm(s=>({ ...s, popupType: e.target.value }))}>
            <option value="flash_sale">flash_sale</option>
            <option value="shop_now">shop_now</option>
            <option value="price_drop">price_drop</option>
            <option value="custom">custom</option>
          </select>
        </div>
        <div>
          <label className="form-label" htmlFor="price">Price (Ksh)</label>
          <input id="price" type="number" className="form-control" min="0" step="1" placeholder="e.g. 19999" value={form.price} onChange={(e)=>setForm(s=>({ ...s, price: e.target.value }))} />
        </div>
      </div>

      <div className="grid-2">
        <div>
          <label className="form-label" htmlFor="title">Title</label>
          <input id="title" className="form-control" placeholder="e.g. Flash Sale" {...bind('title')} />
        </div>
        <div>
          <label className="form-label" htmlFor="subtitle">Subtitle</label>
          <input id="subtitle" className="form-control" placeholder="Supporting text" {...bind('subtitle')} />
        </div>
      </div>

      {/* CTA Href removed: Buy Now always links to the selected product */}
      <p className="helper">Buy Now will automatically link to the selected product page.</p>

      <fieldset>
        <legend>Link to Product & Gallery</legend>
        <div className="grid-2">
          <div>
            <label className="form-label" htmlFor="productId">Product ID (optional)</label>
            <input id="productId" className="form-control" placeholder="e.g. product cuid" {...bind('productId')} />
            <p className="helper">If provided, the Buy Now button will link to /product/[id] and show the product detail gallery.</p>
            {products.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <label className="form-label" htmlFor="productSelect">Or select a product</label>
                <select id="productSelect" className="form-control" value={form.productId}
                  onChange={(e)=>setForm(s=>({ ...s, productId: e.target.value }))}>
                  <option value="">— Choose product —</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <p className="helper">Selecting a product will auto-link Buy Now to that product page.</p>
              </div>
            )}
          </div>
          <div>
            <label className="form-label" htmlFor="gallery">Extra Gallery Images (comma-separated URLs)</label>
            <input id="gallery" className="form-control" placeholder="https://..., https://..." {...bind('gallery')} />
          </div>
        </div>
      </fieldset>

      <div className="grid-2">
        <div>
          <label className="form-label" htmlFor="sortOrder">Sort Order</label>
          <input id="sortOrder" type="number" className="form-control" {...bind('sortOrder')} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input id="active" type="checkbox" checked={form.active} onChange={(e)=>setForm(s=>({ ...s, active: e.target.checked }))} />
          <label htmlFor="active">Active</label>
        </div>
      </div>

      {error && <p style={{ color: '#f2994a', margin: 0 }}>{error}</p>}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Saving…' : (initial?.id ? 'Update Slide' : 'Save Slide')}</button>
        <button className="btn" type="button" onClick={() => history.back()} disabled={loading}>Cancel</button>
        {initial?.id && (
          <button className="btn" type="button" onClick={onDelete} disabled={loading} style={{ borderColor: '#5a2a2a', color: '#f87171' }}>Delete</button>
        )}
      </div>
    </form>
  )
}
