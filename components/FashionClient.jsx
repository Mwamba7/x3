'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'hoodie', label: 'Hoodies' },
  { key: 'shoes', label: 'Shoes' },
  { key: 'sneakers', label: 'Sneakers' },
]

export default function FashionClient({ products }) {
  const [active, setActive] = useState('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('featured')
  const formatKsh = (n) => `Ksh ${Number(n).toLocaleString('en-KE')}`

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
    let res = products.filter(p => (active === 'all' || p.category === active) && (!q || p.name.toLowerCase().includes(q)))
    switch (sort) {
      case 'price-asc': res = res.sort((a, b) => a.price - b.price); break
      case 'price-desc': res = res.sort((a, b) => b.price - a.price); break
      case 'name-asc': res = res.sort((a, b) => a.name.localeCompare(b.name)); break
      case 'name-desc': res = res.sort((a, b) => b.name.localeCompare(a.name)); break
      default: break // featured
    }
    return res
  }, [products, active, query, sort])

  return (
    <section className="products-section" aria-label="Hoodies, Shoes & Sneakers">
      <header className="products-header">
        <h3>Hoodies, Shoes & Sneakers</h3>
        <div className="filters" role="tablist" aria-label="Fashion categories">
          {CATEGORIES.map(cat => (
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
          <span className="visually-hidden">Search fashion</span>
          <input
            type="search"
            placeholder="Search… (e.g. Hoodie, Leather, Runner)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="sort">
          <label htmlFor="fashionSort" className="visually-hidden">Sort</label>
          <select id="fashionSort" value={sort} onChange={(e) => setSort(e.target.value)}>
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
          const isSold = String(p.status || '').toLowerCase() === 'sold'
          return (
          <li className="product-card" key={p.id} data-category={p.category} data-name={p.name} data-price={p.price}>
            <Link
              className="product-link"
              href={`/fashion/${p.id}`}
              aria-label={p.name}
              title={p.name}
              aria-disabled={isSold}
              tabIndex={isSold ? -1 : 0}
              onClick={e => { if (isSold) e.preventDefault() }}
              style={isSold ? { cursor: 'not-allowed', opacity: 0.85 } : undefined}
            >
              <div className="media">
                <img
                  loading="lazy"
                  src={p.img}
                  srcSet={buildSrcSet(p.img)}
                  sizes="(min-width:1536px) 14vw, (min-width:1280px) 18vw, (min-width:1024px) 22vw, (min-width:640px) 28vw, 60vw"
                  alt={p.name}
                  style={{ width: '100%', height: 150, objectFit: 'cover', display: 'block' }}
                />
                <span className="badge condition">{p.condition}</span>
                <span className="badge" style={{ position: 'absolute', right: 10, top: 10, background: 'rgba(10,16,26,0.7)', border: '1px solid #2a3342', fontSize: 11, padding: '6px 8px', borderRadius: 999 }}>{isSold ? 'Sold' : 'Available'}</span>
              </div>
              <div className="info">
                <h4 className="name">{p.name}</h4>
                <p className="meta">{p.meta}</p>
                <div className="price-row">
                  <span className="price">{formatKsh(p.price)}</span>
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
