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
  'fridge': 'Appliances',
  'cooler': 'Appliances',
  'outfits': 'Outfits',
  'hoodies': 'Hoodies',
  'shoes': 'Shoes',
  'sneakers': 'Sneakers',
  'ladies': 'Ladies',
  'men': 'Men',
  'others': 'Others',
}

// Title-case helper for dynamic category labels
function titleCase(s = '') {
  return CATEGORY_LABELS[s] || s.replace(/[-_]/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())
}

// Helper to build responsive srcset for images
function buildSrcSet(src, baseQuality = 75) {
  if (!src || typeof src !== 'string') return ''
  // For data URLs or external URLs, return as-is
  if (src.startsWith('data:') || src.startsWith('http')) return src
  // For local images, build srcset (adjust paths as needed for your setup)
  return `${src} 1x`
}

export default function SellPageProductsClient({ products = [] }) {
  const formatKsh = (n) => `${Number(n).toLocaleString('en-KE')}`
  const { addItem, removeItem, items, isCartLocked } = useCart()

  // Process products for consistent display
  const viewProducts = useMemo(() => {
    return (Array.isArray(products) ? products : []).map(p => ({
      ...p,
      _name: p.name,
      _category: p.category,
      _catKey: p.category,
      _price: p.price,
      _status: p.status,
      _img: p.img,
      _images: p.images || [],
      _meta: p.meta || p.description || '',
      _condition: p.condition || 'Used'
    }))
  }, [products])

  // Categories for filtering
  const dynamicCategories = [
    { key: 'all', label: 'All Categories' },
    { key: 'tv', label: 'Televisions' },
    { key: 'radio', label: 'Sound systems' },
    { key: 'phone', label: 'Mobile phones' },
    { key: 'electronics', label: 'Electronics' },
    { key: 'accessory', label: 'Accessories' },
    { key: 'appliances', label: 'Appliances' },
    { key: 'outfits', label: 'Outfits' },
    { key: 'hoodies', label: 'Hoodies' },
    { key: 'shoes', label: 'Shoes' },
    { key: 'sneakers', label: 'Sneakers' },
    { key: 'ladies', label: 'Ladies' },
    { key: 'men', label: 'Men' },
    { key: 'others', label: 'Others' },
  ]

  const [active, setActive] = useState('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('featured')
  const [showSoldOverlay, setShowSoldOverlay] = useState(null)
  const [popupState, setPopupState] = useState({ id: null, action: null })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

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
      const productCategory = p._catKey
      if (active === 'appliances' && (productCategory === 'fridge' || productCategory === 'cooler' || productCategory === 'appliances')) return true
      if (active === 'others') {
        // "Others" includes any category not explicitly listed in our main categories
        const mainCategories = ['tv', 'radio', 'phone', 'electronics', 'accessory', 'appliances', 'fridge', 'cooler', 'outfits', 'hoodies', 'shoes', 'sneakers', 'ladies', 'men']
        return !mainCategories.includes(productCategory)
      }
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

  if (!products || products.length === 0) {
    // Show placeholder section when no products exist
    return (
      <section id="community-marketplace" className="products-section">
        <header className="products-header" style={{ marginBottom: 4 }}>
          <h3 style={{ margin: '20px 0 4px 0' }}>Community Marketplace</h3>
          <div className="filters" role="tablist" aria-label="Community product categories">
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
        
        <div style={{ 
          textAlign: 'center', 
          padding: '40px 20px', 
          background: 'var(--background-secondary)', 
          borderRadius: 12,
          border: '2px dashed var(--border-color)'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏪</div>
          <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
            No Community Products Yet
          </h4>
          <p style={{ color: 'var(--muted)', marginBottom: 16 }}>
            Be the first to sell your items through our community marketplace!
          </p>
          <a 
            href="/sell" 
            className="btn btn-primary"
            style={{ display: 'inline-block' }}
          >
            Submit Your Product
          </a>
        </div>
      </section>
    )
  }

  {/* Community Marketplace - Updated: ${new Date().toISOString()} - Gap: 2px */}
  return (
    <section id="community-marketplace" className="products-section">
      <header className="products-header" style={{ marginBottom: 4 }}>
        <h3 style={{ margin: '20px 0 4px 0' }}>Community Marketplace</h3>
        <div className="filters" role="tablist" aria-label="Community product categories" style={{ paddingBottom: 0 }}>
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

      <div className="toolbar" style={{ marginTop: '2px', paddingTop: '0', borderTop: 'none' }}>
        <label className="search" style={{ flex: 1 }}>
          <span className="visually-hidden">Search community products</span>
          <input
            type="search"
            placeholder="Search community products… (e.g. iPhone, MacBook, Samsung)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="sort">
          <label htmlFor="communitySortSelect" className="visually-hidden">Sort</label>
          <select id="communitySortSelect" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="featured">Sort: Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name-asc">Name: A → Z</option>
            <option value="name-desc">Name: Z → A</option>
          </select>
        </div>
      </div>

      <ul className="product-grid" aria-live="polite">
        {Array.isArray(filtered) && filtered.map(p => {
          const isSold = p._status === 'sold'
          const isInCart = mounted ? !!items[p.id] : false
          return (
            <li className="product-card" key={p.id} data-category={p._catKey} data-name={p._name} data-price={p._price} style={{ marginBottom: '16px' }}>
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
                  <span className="badge condition">{p._condition}</span>
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
                       popupState.action === 'blocked' ? '🔒 blocked!' : 'Removed!'}
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
                        
                        if (isInCart) {
                          removeItem(p.id);
                          // Show removed popup only if cart is not locked
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
                              condition: p._condition,
                              status: p._status,
                            },
                            1
                          );
                          // Show added popup only if cart is not locked
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
          )
        })}
      </ul>
      
      {Array.isArray(filtered) && filtered.length >= 8 && (
        <div style={{ textAlign: 'left', marginTop: 20 }}>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>
            Want to sell your items? <a href="/sell" style={{ textDecoration: 'none', color: 'var(--muted)' }}><span style={{ color: 'var(--primary)' }}>click</span> to submit your product for sell on community marketplace</a>.
          </p>
        </div>
      )}
    </section>
  )
}
