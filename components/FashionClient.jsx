'use client'

import { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import { useCart } from './CartContext'

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'outfits', label: 'Outfits' },
  { key: 'hoodie', label: 'Hoodies' },
  { key: 'shoes', label: 'Shoes' },
  { key: 'sneakers', label: 'Sneakers' },
  { key: 'ladies', label: 'Ladies' },
  { key: 'men', label: 'Men' },
]

export default function FashionClient({ products }) {
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
  const formatKsh = (n) => `Ksh ${Number(n).toLocaleString('en-KE')}`
  const { addItem, removeItem, items, isCartLocked } = useCart()

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
    <section className="products-section fashion-section" aria-label="Outfits, Fashion & Sneakers" style={{ paddingTop: 0, paddingBottom: 0 }}>
      <header className="products-header">
        <h3>Outfits, Fashion & Sneakers</h3>
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
          const isInCart = mounted ? !!items[p.id] : false
          return (
          <li className="product-card" key={p.id} data-category={p.category} data-name={p.name} data-price={p.price}>
            <Link
              className="product-link"
              href={`/fashion/${p.id}`}
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
                  sizes="(min-width:1536px) 14vw, (min-width:1280px) 18vw, (min-width:1024px) 22vw, (min-width:640px) 28vw, 60vw"
                  alt={p.name}
                  style={{ width: '100%', height: 150, objectFit: 'cover', display: 'block' }}
                />
                <span className="badge condition">{p.condition}</span>
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
                <h4 className="name">{p.name}</h4>
                <div className="price-row" style={{ position: 'relative' }}>
                  <span className="price">{formatKsh(p.price)}</span>
                  <button
                    className={`btn btn-small ${isInCart ? 'in-cart-btn' : ''}`}
                    disabled={isSold}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      // Use cart context to check if cart is locked (no localStorage dependency)
                      if (isInCart) {
                        removeItem(p.id);
                        // Only show removed popup if cart is not locked
                        if (!isCartLocked) {
                          setPopupState({ id: p.id, action: 'removed' });
                          setTimeout(() => setPopupState({ id: null, action: null }), 2000);
                        } else {
                          // Show cart locked notification
                          window.dispatchEvent(new CustomEvent('cartLockError', {
                            detail: {
                              message: 'You need to first complete the products paid for. Your cart is locked because you have made a deposit payment. Please complete your current order before adding new items.',
                              productName: p.name
                            }
                          }));
                        }
                      } else {
                        // Check if cart is locked before adding
                        if (isCartLocked && Object.keys(lockedCartItems).length > 0) {
                          // Show cart locked notification
                          window.dispatchEvent(new CustomEvent('cartLockError', {
                            detail: {
                              message: 'You need to first complete the products paid for. Your cart is locked because you have made a deposit payment. Please complete your current order before adding new items.',
                              productName: p.name
                            }
                          }));
                          return;
                        }
                        
                        addItem({
                          id: p.id,
                          name: p.name,
                          price: p.price,
                          image: p.image,
                          condition: p.condition || 'unknown',
                          category: p.category || 'unknown'
                        });
                        setPopupState({ id: p.id, action: 'added' });
                        setTimeout(() => setPopupState({ id: null, action: null }), 2000);
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
