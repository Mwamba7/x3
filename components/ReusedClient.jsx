'use client'

import { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import { useCart } from './CartContext'

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

// Title-case helper for dynamic category labels
function titleCase(s = '') {
  return CATEGORY_LABELS[s] || s.replace(/[-_]/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())
}

export default function ReusedClient({ products = [] }) {
  const formatKsh = (n) => `Ksh ${Number(n).toLocaleString('en-KE')}`
  const { addItem, removeItem, items, isCartLocked } = useCart()

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

  // Use same fixed categories as Collection section
  const dynamicCategories = [
    { key: 'all', label: 'All' },
    { key: 'tv', label: 'Televisions' },
    { key: 'radio', label: 'Sound systems' },
    { key: 'phone', label: 'Mobile phones' },
    { key: 'electronics', label: 'Electronics' },
    { key: 'accessory', label: 'Accessories' },
    { key: 'appliances', label: 'Appliances' },
  ]

  const [active, setActive] = useState('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('featured')
  const [showSoldOverlay, setShowSoldOverlay] = useState(null)
  const [popupState, setPopupState] = useState({ id: null, action: null })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Removed cart lock error listener - using CartProtectionNotification instead
  }, [])

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
    let res = viewProducts.filter(p => {
      if (active === 'all') return true
      // Map old categories to new ones for filtering
      const productCategory = p._catKey
      if (active === 'appliances' && (productCategory === 'fridge' || productCategory === 'cooler' || productCategory === 'appliances')) return true
      return productCategory === active
    }).filter(p => !q || p._name.toLowerCase().includes(q))
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
          const isInCart = mounted ? !!items[p.id] : false
          const condition = p.condition || p?.preowned?.condition || ''
          return (
            <li className="product-card" key={p.id} data-category={p._catKey} data-name={p._name} data-price={p._price}>
              <Link
                className="product-link"
                href={`/product/${p.id}`}
                aria-label={p._name}
                title={p._name}
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
                    src={p._img}
                    srcSet={buildSrcSet(p._img)}
                    sizes="(min-width:1536px) 14vw, (min-width:1280px) 18vw, (min-width:1024px) 22vw, (min-width:640px) 28vw, 60vw"
                    alt={p._name}
                    style={{ width: '100%', height: 150, objectFit: 'cover', display: 'block' }}
                  />
                  <span className="badge condition">{condition}</span>
                  <span className={`badge ${isSold ? 'sold-badge' : ''}`} style={{ position: 'absolute', right: 10, top: 10, background: 'rgba(10,16,26,0.7)', border: '1px solid #2a3342', fontSize: 10, padding: '4px 6px', borderRadius: 999, color: isSold ? '#ef4444' : '#3b82f6' }}>{isSold ? 'Sold' : 'Available'}</span>
                  {showSoldOverlay === p.id && (
                    <div className="sold-overlay visible">
                      <span className="emoji" role="img" aria-label="Lock">🔒</span>
                      Sold
                    </div>
                  )}
                  {/* Unified Action Popup */}
                  {popupState.id === p.id && (
                    <div style={{
                      position: 'absolute',
                      top: '60%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      background: popupState.action === 'added' ? 'rgba(10, 16, 26, 0.85)' : 
                                   popupState.action === 'blocked' ? '#ff6b35' : '#dc3545',
                      color: popupState.action === 'added' ? 'var(--primary)' : 'white',
                      fontWeight: '600',
                      fontSize: '11px',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      zIndex: 3,
                      pointerEvents: 'none',
                      opacity: 1,
                      transition: 'opacity 0.3s ease'
                    }}>
                      {popupState.action === 'added' ? 'Added!' : 
                       popupState.action === 'blocked' ? '🔒 Blocked!' : 'Removed!'}
                    </div>
                  )}
                </div>
                <div className="info">
                  <h4 className="name">{p._name}</h4>
                  <div className="price-row" style={{ position: 'relative' }}>
                    <span className="price">{formatKsh(p._price)}</span>
                    <button
                      className={`btn btn-small ${isInCart ? 'in-cart-btn' : ''}`}
                      disabled={isSold}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        // Check if cart is locked before showing normal popups
                        const savedPayment = localStorage.getItem('mpesaPayment')
                        let isLocked = false
                        if (savedPayment) {
                          try {
                            const paymentData = JSON.parse(savedPayment)
                            isLocked = paymentData.depositPaid === true
                          } catch {}
                        }
                        
                        if (isInCart) {
                          removeItem(p.id);
                          // Only show removed popup if cart is not locked
                          if (!isCartLocked) {
                            setPopupState({ id: p.id, action: 'removed' });
                            setTimeout(() => setPopupState({ id: null, action: null }), 2000);
                          }
                        } else {
                          addItem(
                            {
                              id: p.id,
                              name: p._name,
                              price: p._price,
                              img: p._img,
                              condition,
                              status: p._status,
                            },
                            1
                          );
                          // Only show added popup if cart is not locked
                          if (!isCartLocked) {
                            setPopupState({ id: p.id, action: 'added' });
                            setTimeout(() => setPopupState({ id: null, action: null }), 1500);
                          }
                        }
                      }}
                    >
{isInCart ? 'Remove' : 'Add to Cart'}
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
