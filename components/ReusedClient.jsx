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
  const formatKsh = (n) => `${Number(n).toLocaleString('en-KE')}`
  const { addItem, removeItem, items, isCartLocked } = useCart()

  const safeProducts = Array.isArray(products) ? products : []

  // Resolve view fields for pre-owned products
  const viewProducts = useMemo(() => {
    return safeProducts.map(p => {
      // For pre-owned products, use the product data directly
      const baseCat = p.category
      const normCat = typeof baseCat === 'string' && baseCat.toLowerCase().startsWith('preowned-')
        ? baseCat.slice('preowned-'.length)
        : baseCat
      return {
        ...p,
        _name: p.name,
        _category: baseCat,
        _catKey: normCat,
        _price: p.price,
        _status: p.status,
        _img: p.img,
        _images: Array.isArray(p.images) ? p.images : [],
        _condition: p.condition || '',
      }
    })
  }, [safeProducts])

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
      <header className="products-header" style={{ marginBottom: 0 }}>
        <h3 style={{ margin: '0 0 4px 0' }}>Pre-owned Products</h3>
        <div className="filters" role="tablist" aria-label="Reused product categories" style={{ 
  display: 'flex', 
  flexWrap: 'nowrap', 
  gap: '8px', 
  overflowX: 'auto', 
  scrollSnapType: 'x mandatory',
  WebkitOverflowScrolling: 'touch',
  paddingBottom: '0px',
  marginBottom: '0px'
 }}>
          {dynamicCategories.map(cat => (
            <button
              key={cat.key}
              className={`filter-btn ${active === cat.key ? 'active' : ''}`}
              data-filter={cat.key}
              role="tab"
              aria-selected={active === cat.key}
              onClick={() => setActive(cat.key)}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                whiteSpace: 'nowrap',
                minWidth: 'auto',
                flexShrink: '0'
              }}
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
          const isSold = p._status === 'sold'
          const isInCart = mounted ? !!items[p.id] : false
          const condition = p.condition || p._condition || ''
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
                <div className="media" style={{ 
                      position: 'relative', 
                      overflow: 'hidden',
                      margin: 0,
                      padding: 0,
                      lineHeight: 0,
                      fontSize: 0
                    }}>
                  <img
                    loading="lazy"
                    src={p._img}
                    srcSet={buildSrcSet(p._img)}
                    sizes="(min-width:1536px) 14vw, (min-width:1280px) 18vw, (min-width:1024px) 22vw, (min-width:640px) 28vw, 60vw"
                    alt={p._name}
                    style={{ 
                      width: '100%', 
                      height: '150px', 
                      objectFit: 'cover', 
                      objectPosition: 'center',
                      display: 'block',
                      margin: 0,
                      padding: 0,
                      border: 'none',
                      borderRadius: '0',
                      verticalAlign: 'top'
                    }}
                  />
                  <span className="badge condition">{condition}</span>
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
      )}
    </section>
  )
}
