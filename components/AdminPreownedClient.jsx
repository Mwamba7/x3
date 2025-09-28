'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

// Category label mapping for consistent display
const CATEGORY_LABELS = {
  'tv': 'Televisions',
  'radio': 'Sound systems', 
  'phone': 'Mobile phones',
  'electronics': 'Electronics',
  'accessory': 'Accessories',
  'appliances': 'Appliances',
  'fridge': 'Appliances', // Map old fridge to appliances
  'cooler': 'Appliances', // Map old cooler to appliances
}

function getCategoryLabel(key) {
  return CATEGORY_LABELS[key] || (key || '').replace(/[-_]/g,' ').replace(/\b\w/g, m=>m.toUpperCase())
}

export default function AdminPreownedClient({ items = [] }) {
  const [rows, setRows] = useState(items.map(it => ({ ...it, _saving: false, _dirty: false, _editing: false })))
  const [msg, setMsg] = useState('')
  const [active, setActive] = useState('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('featured')

  // Use same fixed categories as Collection section
  const categories = [
    { key: 'all', label: 'All' },
    { key: 'tv', label: 'Televisions' },
    { key: 'radio', label: 'Sound systems' },
    { key: 'phone', label: 'Mobile phones' },
    { key: 'electronics', label: 'Electronics' },
    { key: 'accessory', label: 'Accessories' },
    { key: 'appliances', label: 'Appliances' },
  ]

  async function saveRow(idx) {
    const row = rows[idx]
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, _saving: true } : r))
    setMsg('')
    try {
      const res = await fetch(`/api/products/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: Number(row.price), status: row.status })
      })
      if (!res.ok) throw new Error(`Save failed: ${res.status}`)
      setRows(prev => prev.map((r, i) => i === idx ? { ...r, _saving: false, _dirty: false, _editing: false } : r))
      setMsg('Saved successfully')
    } catch (e) {
      console.error(e)
      setRows(prev => prev.map((r, i) => i === idx ? { ...r, _saving: false } : r))
      setMsg('Error: could not save. See console for details.')
    }
  }

  async function deleteRow(idx) {
    const row = rows[idx]
    if (!confirm(`Delete product: ${row.name}? This cannot be undone.`)) return
    setMsg('')
    try {
      const res = await fetch(`/api/products/${row.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`)
      setRows(prev => prev.filter((_, i) => i !== idx))
      setMsg('Deleted successfully')
    } catch (e) {
      console.error(e)
      setMsg('Error: could not delete. See console for details.')
    }
  }

  function setField(idx, key, val) {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, [key]: val, _dirty: true } : r))
  }

  // Filter/search/sort like other sections (on the client state rows)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let res = rows.filter(p => {
      if (active === 'all') return true
      // Map old categories to new ones for filtering
      const productCategory = p.category
      if (active === 'appliances' && (productCategory === 'fridge' || productCategory === 'cooler' || productCategory === 'appliances')) return true
      return productCategory === active
    }).filter(p => !q || p.name.toLowerCase().includes(q))
    switch (sort) {
      case 'price-asc': res = res.slice().sort((a, b) => a.price - b.price); break
      case 'price-desc': res = res.slice().sort((a, b) => b.price - a.price); break
      case 'name-asc': res = res.slice().sort((a, b) => a.name.localeCompare(b.name)); break
      case 'name-desc': res = res.slice().sort((a, b) => b.name.localeCompare(a.name)); break
      default: break
    }
    return res
  }, [rows, active, query, sort])

  if (!rows.length) return <p className="meta">No pre-owned products found.</p>

  return (
    <section id="admin-preowned" className="products-section">
      <header className="products-header">
        <h3>Pre-owned Products (Admin)</h3>
        <div className="filters" role="tablist" aria-label="Pre-owned categories">
          {categories.map(cat => (
            <button
              key={cat.key}
              className={`filter-btn ${active === cat.key ? 'active' : ''}`}
              data-filter={cat.key}
              role="tab"
              aria-selected={active === cat.key}
              onClick={() => setActive(cat.key)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </header>

      <div className="toolbar">
        <label className="search" style={{ flex: 1 }}>
          <span className="visually-hidden">Search pre-owned</span>
          <input type="search" placeholder="Search pre-owned…" value={query} onChange={e => setQuery(e.target.value)} />
        </label>
        <div className="sort">
          <label htmlFor="adminPreSort" className="visually-hidden">Sort</label>
          <select id="adminPreSort" value={sort} onChange={e => setSort(e.target.value)}>
            <option value="featured">Sort: Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name-asc">Name: A → Z</option>
            <option value="name-desc">Name: Z → A</option>
          </select>
        </div>
      </div>

      <ul className="product-grid" aria-live="polite">
        {filtered.map((r, idx) => {
          const isSold = r.status === 'sold'
          return (
            <li className="product-card" key={r.id} data-category={r.category} data-name={r.name} data-price={r.price}>
              <div className="product-link" style={{ display: 'grid', gridTemplateColumns: '1fr' }}>
                <div className="media">
                  <img src={r.img} alt={r.name} style={{ width: '100%', height: 150, objectFit: 'cover', display: 'block' }} />
                  <span className="badge condition">{r.condition}</span>
                  <span className="badge" style={{ position: 'absolute', right: 10, top: 10, background: 'rgba(10,16,26,0.7)', border: '1px solid #2a3342', fontSize: 11, padding: '6px 8px', borderRadius: 999 }}>{isSold ? 'Sold' : 'Available'}</span>
                </div>
                <div className="info">
                  <h4 className="name" style={{ marginBottom: 6 }}>{r.name}</h4>
                  <div className="price-row" style={{ alignItems: 'center', gap: 8 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>Price</span>
                      <input type="number" value={r.price}
                        onChange={e => setField(idx, 'price', e.target.value)} disabled={!r._editing}
                        style={{ width: '100%', background: '#111827', border: '1px solid #2a3342', color: 'var(--text)', borderRadius: 8, padding: '6px 8px' }} />
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>Status</span>
                      <select value={r.status} onChange={e => setField(idx, 'status', e.target.value)} disabled={!r._editing}
                        style={{ width: '100%', background: '#111827', border: '1px solid #2a3342', color: 'var(--text)', borderRadius: 8, padding: '6px 8px' }}>
                        <option value="available">available</option>
                        <option value="sold">sold</option>
                        <option value="reserved">reserved</option>
                      </select>
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    {!r._editing ? (
                      <button className="btn" onClick={() => setRows(prev => prev.map((x,i) => i===idx? { ...x, _editing: true }: x))}>Edit</button>
                    ) : (
                      <button className="btn btn-primary" onClick={() => saveRow(idx)} disabled={r._saving || !r._dirty}>{r._saving ? 'Saving…' : 'Save'}</button>
                    )}
                    <button className="btn" onClick={() => deleteRow(idx)} disabled={r._saving}>Delete</button>
                    <Link className="btn" href={`/product/${r.id}`} target="_blank">View</Link>
                  </div>
                </div>
              </div>
            </li>
          )})}
      </ul>
      {msg ? <div className="helper" style={{ color: 'var(--muted)', marginTop: 8 }}>{msg}</div> : null}
    </section>
  )
}
