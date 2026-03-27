'use client'

import { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import { useCart } from './CartContext'
import ProductGallery from './ProductGallery'

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
  const [active, setActive] = useState('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('featured')
  const [showSoldOverlay, setShowSoldOverlay] = useState(null)
  const [popupState, setPopupState] = useState({ id: null, action: null })
  const [mounted, setMounted] = useState(false)

  const safeProducts = Array.isArray(products) ? products : []

  const formatKsh = (n) => `Ksh ${Number(n).toLocaleString('en-KE')}`
  const { addItem, removeItem, items, isCartLocked, lockedCartItems } = useCart()
  
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

  useEffect(() => {
    setMounted(true)
    
    // Removed cart lock error listener - using CartProtectionNotification instead
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let res = safeProducts.filter(p => (active === 'all' || p.category === active) && (!q || p.name.toLowerCase().includes(q)))
    switch (sort) {
      case 'price-asc': res = res.sort((a, b) => a.price - b.price); break
      case 'price-desc': res = res.sort((a, b) => b.price - a.price); break
      case 'name-asc': res = res.sort((a, b) => a.name.localeCompare(b.name)); break
      case 'name-desc': res = res.sort((a, b) => b.name.localeCompare(a.name)); break
      default: break // featured (original order)
    }
    return res
  }, [safeProducts, active, query, sort])

  return (
    <section id="collection" className="products-section" style={{ paddingTop: 0, paddingBottom: 0 }}>
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

      {safeProducts.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 16px',
          background: '#0b1220',
          border: '1px solid #1f2a3a',
          borderRadius: 12,
          color: '#cbd5e1'
        }}>
          <h4 style={{ margin: 0, marginBottom: 8, color: '#e2e8f0' }}>No products available</h4>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>
            This section will be updated as soon as new items are added.
          </p>
        </div>
      ) : (
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
                {/* Use ProductGallery for multiple images, fallback to single img */}
                {p.images && p.images.length > 1 ? (
                  <ProductGallery 
                    images={p.images} 
                    name={p.name}
                    popupState={popupState}
                    mainImage={p.img}
                    condition={p.condition}
                    status={p.status}
                    isSold={isSold}
                  />
                ) : (
                  <>
                    <img
                      loading="lazy"
                      src={p.img}
                      srcSet={buildSrcSet(p.img)}
                      alt={p.name}
                      style={{ width: '100%', height: 150, objectFit: 'cover', display: 'block' }}
                    />
                    <span className="badge condition">{p.condition}</span>
                    <span className={`badge ${isSold ? 'sold-badge' : ''}`}>{isSold ? 'Sold' : 'Available'}</span>
                    {showSoldOverlay === p.id && (
                      <div className="sold-overlay visible">
                        <span className="emoji" role="img" aria-label="Lock">🔒</span>
                        Sold
                      </div>
                    )}
                    {/* Unified Action Popup */}
                    {popupState.id === p.id && (
                      <div className="cart-popup" data-action={popupState.action} style={{
                        position: 'absolute',
                        top: '60%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 20,
                        pointerEvents: 'none',
                        opacity: 1,
                        transition: 'opacity 0.3s ease'
                      }}>
                        {popupState.action === 'added' ? 'Added!' : 
                         popupState.action === 'blocked' ? '🔒 blocked!' : 'Removed!'}
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="info">
                <h4 className="name">{p.name}</h4>
                <div className="price-row">
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
                          setPopupState({ id: p.id, action: 'blocked' });
                          setTimeout(() => setPopupState({ id: null, action: null }), 2000);
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
      )}
    </section>
  )
}
