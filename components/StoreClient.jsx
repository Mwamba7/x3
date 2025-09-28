'use client'

import { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import { useCart } from './CartContext'

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'tv', label: 'Televisions' },
  { key: 'radio', label: 'Sound systems' },
  { key: 'phone', label: 'Mobile phones' },
  { key: 'electronics', label: 'Electronics' },
  { key: 'accessory', label: 'Accessories' },
  { key: 'appliances', label: 'Appliances' },
]

export default function StoreClient({ products }) {
  const formatKsh = (n) => `Ksh ${Number(n).toLocaleString('en-KE')}`
  const { addItem, removeItem, items } = useCart()
  function buildSrcSet(url) {
    if (!url) return undefined
    // Simple Unsplash helper: replace w= with multiple widths
    const widths = [800, 1200, 1600]
    if (url.includes('w=')) {
      const base = url.replace(/w=\d+/g, 'w={w}')
      return widths.map(w => `${base.replace('{w}', w)} ${w}w`).join(', ')
    }
    // Fallback single src
    return `${url} 1200w`
  }
  const [active, setActive] = useState('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('featured')
  const [showSoldOverlay, setShowSoldOverlay] = useState(null)
  const [addedId, setAddedId] = useState(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let res = products.filter(p => (active === 'all' || p.category === active) && (!q || p.name.toLowerCase().includes(q)))
    switch (sort) {
      case 'price-asc': res = res.sort((a, b) => a.price - b.price); break
      case 'price-desc': res = res.sort((a, b) => b.price - a.price); break
      case 'name-asc': res = res.sort((a, b) => a.name.localeCompare(b.name)); break
      case 'name-desc': res = res.sort((a, b) => b.name.localeCompare(a.name)); break
      default: break // featured (original order)
    }
    return res
  }, [products, active, query, sort])

  return (
    <section id="collection" className="products-section" style={{ paddingTop: 0, paddingBottom: 3 }}>
      <header className="products-header">
        <h3>Collection</h3>
        <div className="filters" role="tablist" aria-label="Product categories">
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
          <span className="visually-hidden">Search products</span>
          <input
            type="search"
            placeholder="Search products… (e.g. Samsung, 55 inch, Dual SIM)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="sort">
          <label htmlFor="sortSelect" className="visually-hidden">Sort</label>
          <select id="sortSelect" value={sort} onChange={(e) => setSort(e.target.value)}>
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
          const isSold = p.status === 'sold'
          const isInCart = mounted ? !!items[p.id] : false
          return (
          <li className="product-card" key={p.id} data-category={p.category} data-name={p.name} data-price={p.price}>
            <Link
              className="product-link"
              href={`/product/${p.id}`}
              aria-label={p.name}
              title={p.name}
              aria-disabled={isSold}
              tabIndex={isSold ? -1 : 0}
              onClick={e => {
                if (isSold) {
                  e.preventDefault();
                  setShowSoldOverlay(p.id);
                  setTimeout(() => setShowSoldOverlay(null), 1500);
                }
              }}
              style={isSold ? { cursor: 'not-allowed', opacity: 0.85 } : undefined}
            >
              <div className="media" style={{ position: 'relative' }}>
                <img
                  loading="lazy"
                  src={p.img}
                  srcSet={buildSrcSet(p.img)}
                  alt={p.name}
                  style={{ width: '100%', height: 150, objectFit: 'cover', display: 'block' }}
                />
                <span className="badge condition">{p.condition}</span>
                <span className={`badge ${isSold ? 'sold-badge' : ''}`} style={{ position: 'absolute', right: 10, top: 10, background: isSold ? undefined : 'rgba(10,16,26,0.7)', border: '1px solid #2a3342', fontSize: 11, padding: '6px 8px', borderRadius: 999 }}>{isSold ? 'Sold' : 'Available'}</span>
                {showSoldOverlay === p.id && (
                  <div className="sold-overlay visible">
                    <span className="emoji" role="img" aria-label="Lock">🔒</span>
                    Sold
                  </div>
                )}
                {addedId === p.id && (
                  <div className="added-popup visible">
                    Added!
                  </div>
                )}
              </div>
              <div className="info">
                <h4 className="name">{p.name}</h4>
                <div className="meta-tags">
                  {String(p.meta || '').split(/[|,]/).map(s => s.trim()).filter(Boolean).slice(0, 4).map((tag, i) => (
                    <span key={i} className="meta-tag">{tag}</span>
                  ))}
                </div>
                <div className="price-row">
                  <span className="price">{formatKsh(p.price)}</span>
                  <button
                    className={`btn btn-small ${isInCart ? 'in-cart-btn' : ''}`}
                    disabled={isSold}
                    style={isInCart ? { color: 'blue' } : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (isInCart) {
                        removeItem(p.id);
                      } else {
                        addItem(p, 1);
                        setAddedId(p.id);
                        setTimeout(() => setAddedId(null), 1500);
                      }
                    }}
                  >
                    {isInCart ? 'In Cart' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            </Link>
          </li>
        )})}
      </ul>
    </section>
  )
}
