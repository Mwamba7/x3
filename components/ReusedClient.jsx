'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

// Title-case helper for dynamic category labels
function titleCase(s = '') {
  return s.replace(/[-_]/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())
}

export default function ReusedClient({ products = [] }) {
  const formatKsh = (n) => `Ksh ${Number(n).toLocaleString('en-KE')}`

  // Resolve view fields with preowned overrides when present
  const viewProducts = useMemo(() => {
    return (Array.isArray(products) ? products : []).map(p => {
      const o = p?.preowned || null
      const baseCat = o?.category ?? p.category
      const normCat = typeof baseCat === 'string' && baseCat.toLowerCase().startsWith('preowned-')
        ? baseCat.slice('preowned-'.length)
        : baseCat
      return {
        ...p,
        _name: o?.name ?? p.name,
        _category: baseCat,
        _catKey: normCat,
        _price: o?.price ?? p.price,
        _status: o?.status ?? p.status,
        _img: o?.img ?? p.img,
        _images: Array.isArray(o?.images) ? o.images : (p.images || []),
        _meta: o?.meta ?? p.meta,
      }
    })
  }, [products])

  // Build dynamic categories from incoming products; always include 'all'
  const dynamicCategories = useMemo(() => {
    const set = new Set(viewProducts.map(p => p._catKey).filter(Boolean))
    const list = Array.from(set)
      .sort()
      .map(key => ({ key, label: titleCase(key) }))
    return [{ key: 'all', label: 'All' }, ...list]
  }, [viewProducts])

  const [active, setActive] = useState('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('featured')

  function buildSrcSet(url) {
    if (!url) return undefined
    const widths = [800, 1200, 1600]
    if (url.includes('w=')) {
      const base = url.replace(/w=\d+/g, 'w={w}')
      return widths.map(w => `${base.replace('{w}', w)} ${w}w`).join(', ')
    }
    return `${url} 1200w`
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let res = viewProducts.filter(p => (active === 'all' || p._catKey === active) && (!q || p._name.toLowerCase().includes(q)))
    switch (sort) {
      case 'price-asc': res = res.sort((a, b) => a._price - b._price); break
      case 'price-desc': res = res.sort((a, b) => b._price - a._price); break
      case 'name-asc': res = res.sort((a, b) => a._name.localeCompare(b._name)); break
      case 'name-desc': res = res.sort((a, b) => b._name.localeCompare(a._name)); break
      default: break // featured (original order)
    }
    return res
  }, [viewProducts, active, query, sort])

  return (
    <section id="preowned-products" className="products-section">
      <header className="products-header">
        <h3>Pre-owned Products</h3>
        <div className="filters" role="tablist" aria-label="Reused product categories">
          {dynamicCategories.map(cat => (
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
          <span className="visually-hidden">Search reused products</span>
          <input
            type="search"
            placeholder="Search reused… (e.g. Samsung, 55 inch, Dual SIM)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="sort">
          <label htmlFor="reusedSortSelect" className="visually-hidden">Sort</label>
          <select id="reusedSortSelect" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="featured">Sort: Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name-asc">Name: A → Z</option>
            <option value="name-desc">Name: Z → A</option>
          </select>
        </div>
      </div>

      <ul className="product-grid" aria-live="polite">
        {filtered.map(p => {
          const isSold = p._status === 'sold'
          return (
            <li className="product-card" key={p.id} data-category={p._catKey} data-name={p._name} data-price={p._price}>
              <Link
                className="product-link"
                href={`/product/${p.id}`}
                aria-label={p._name}
                title={p._name}
                aria-disabled={isSold}
                tabIndex={isSold ? -1 : 0}
                onClick={e => { if (isSold) e.preventDefault() }}
                style={isSold ? { cursor: 'not-allowed', opacity: 0.85 } : undefined}
              >
                <div className="media">
                  <img
                    loading="lazy"
                    src={p._img}
                    srcSet={buildSrcSet(p._img)}
                    sizes="(min-width:1536px) 14vw, (min-width:1280px) 18vw, (min-width:1024px) 22vw, (min-width:640px) 28vw, 60vw"
                    alt={p._name}
                    style={{ width: '100%', height: 150, objectFit: 'cover', display: 'block' }}
                  />
                  <span className="badge condition">{p.condition}</span>
                  <span className="badge" style={{ position: 'absolute', right: 10, top: 10, background: 'rgba(10,16,26,0.7)', border: '1px solid #2a3342', fontSize: 11, padding: '6px 8px', borderRadius: 999 }}>{isSold ? 'Sold' : 'Available'}</span>
                </div>
                <div className="info">
                  <h4 className="name">{p._name}</h4>
                  <p className="meta">{p._meta}</p>
                  <div className="price-row">
                    <span className="price">{formatKsh(p._price)}</span>
                    <span className="btn btn-small" role="button" aria-disabled={isSold} style={isSold ? { cursor: 'not-allowed', opacity: 0.8 } : undefined}>Details</span>
                  </div>
                </div>
              </Link>
            </li>
          )})}
      </ul>
    </section>
  )
}
