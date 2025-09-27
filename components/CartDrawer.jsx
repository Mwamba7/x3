'use client'

import { useEffect, useState } from 'react'
import { useCart } from './CartContext'

export default function CartDrawer() {
  const { items, setQty, removeItem, clear, totalAmount, totalCount, open, setOpen, maxQtyForCondition } = useCart()
  const list = Object.values(items)
  const [isMobile, setIsMobile] = useState(false)

  // Lock body scroll when cart is open
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const prev = document.body.style.overflow
      document.body.style.overflow = open ? 'hidden' : prev || ''
      return () => { document.body.style.overflow = prev }
    }
  }, [open])

  // Track viewport width to switch to mobile layout
  useEffect(() => {
    function update() {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth <= 768)
      }
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return (
    !open ? null : (
      <div className="cart-overlay" aria-label="Shopping cart" role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 60 }}>
        {/* Backdrop */}
        <div onClick={() => setOpen(false)} aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }} />

        {/* Centered container */}
        <div style={{ position: 'absolute', inset: 0, margin: 0, background: 'var(--card)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 10, borderBottom: '1px solid #253049' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M6 6H4m2 0h14l-2 9H8L6 6Zm0 0L5 3H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="10" cy="20" r="1.5" fill="currentColor"/>
                <circle cx="17" cy="20" r="1.5" fill="currentColor"/>
              </svg>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Your Cart</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{totalCount} item{totalCount === 1 ? '' : 's'}</div>
              </div>
            </div>
            <button className="btn btn-small" onClick={() => setOpen(false)} aria-label="Close cart">Close</button>
          </div>
  
          {/* Content */}
          <div style={{ padding: 16, overflow: 'auto', flex: 1 }}>
            {!isMobile ? (
              <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                {/* Desktop layout (unchanged) */}
                <section style={{ border: '1px solid #253049', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px,2fr) 120px 120px 120px 64px', gap: 8, padding: '10px 12px', borderBottom: '1px solid #253049', fontSize: 11, color: 'var(--muted)', background: 'rgba(10,16,26,0.45)' }}>
                    <span>Product</span>
                    <span style={{ textAlign: 'right' }}>Price</span>
                    <span style={{ textAlign: 'center' }}>Qty</span>
                    <span style={{ textAlign: 'right' }}>Total</span>
                    <span style={{ textAlign: 'right' }}>Action</span>
                  </div>
                  {list.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '28px 8px' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: 999, border: '1px dashed #2a3342', marginBottom: 8 }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                          <path d="M6 6H4m2 0h14l-2 9H8L6 6Zm0 0L5 3H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="10" cy="20" r="1.5" fill="currentColor"/>
                          <circle cx="17" cy="20" r="1.5" fill="currentColor"/>
                        </svg>
                      </div>
                      <p style={{ margin: 0 }}>Your cart is empty.</p>
                    </div>
                  ) : (
                    list.map((it, idx) => {
                      const max = maxQtyForCondition(it.condition)
                      const lineTotal = (it.qty || 0) * (it.price || 0)
                      const rowBg = idx % 2 === 0 ? 'transparent' : 'rgba(10,16,26,0.25)'
                      return (
                        <div key={it.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(220px,2fr) 120px 120px 120px 64px', gap: 8, alignItems: 'center', padding: '10px 12px', borderBottom: '1px solid #253049', background: rowBg }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                            <img src={it.img} alt={it.name} width={48} height={48} style={{ objectFit: 'cover', borderRadius: 8, flex: '0 0 auto' }} />
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: 13, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{it.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--muted)', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{it.condition || '—'}</div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', fontSize: 13, whiteSpace: 'nowrap' }}>Ksh {Number(it.price).toLocaleString('en-KE')}</div>
                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid #2a3342', padding: '2px 6px', borderRadius: 999 }}>
                              <button className="btn btn-small" onClick={() => setQty(it.id, (it.qty || 0) - 1)} aria-label={`Decrease ${it.name} quantity`} disabled={it.qty <= 1}>-</button>
                              <span style={{ minWidth: 22, textAlign: 'center' }}>{it.qty}</span>
                              <button className="btn btn-small" onClick={() => setQty(it.id, (it.qty || 0) + 1)} aria-label={`Increase ${it.name} quantity`} disabled={(it.qty || 0) >= max}>+</button>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>Ksh {Number(lineTotal).toLocaleString('en-KE')}</div>
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn btn-small" onClick={() => removeItem(it.id)} aria-label={`Remove ${it.name} from cart`}>Remove</button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </section>

                {/* Desktop summary below */}
                <section style={{ marginTop: 14 }}>
                  <div style={{ border: '1px solid #253049', borderRadius: 12, padding: 14 }}>
                    <h3 style={{ margin: '0 0 10px', fontSize: 18 }}>Summary</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14 }}>
                      <span>Items</span>
                      <span>{totalCount}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14 }}>
                      <span>Subtotal</span>
                      <strong>Ksh {Number(totalAmount).toLocaleString('en-KE')}</strong>
                    </div>
                    <div style={{ height: 1, background: '#253049', margin: '10px 0' }} />
                    <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                      <input type="text" placeholder="Promo code" style={{ flex: 1, borderRadius: 8, border: '1px solid #2a3342', background: 'transparent', color: 'var(--text)', padding: '8px 10px' }} />
                      <button className="btn btn-small" disabled={list.length === 0}>Apply</button>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <button className="btn" onClick={clear} disabled={list.length === 0}>Clear</button>
                      <button className="btn" onClick={() => setOpen(false)}>Continue Shopping</button>
                    </div>
                    <a className="btn btn-primary" href={`https://wa.me/254718176584?text=${encodeURIComponent('Order: ' + list.map(i => `${i.name} x${i.qty}`).join(', ') + ' — Total Ksh ' + Number(totalAmount).toLocaleString('en-KE'))}`} target="_blank" rel="noopener noreferrer" aria-disabled={list.length === 0} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, ...(list.length === 0 ? { pointerEvents: 'none', opacity: 0.7 } : {}) }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ marginTop: -1 }}>
                        <path d="M6 6H4m2 0h14l-2 9H8L6 6Zm0 0L5 3H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="10" cy="20" r="1.5" fill="currentColor"/>
                        <circle cx="17" cy="20" r="1.5" fill="currentColor"/>
                      </svg>
                      Checkout via WhatsApp
                    </a>
                  </div>
                </section>
              </div>
            ) : (
              <div style={{ maxWidth: 640, margin: '0 auto', paddingBottom: 88 }}>
                {/* Mobile stacked card layout */}
                <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {list.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '28px 8px' }}>Your cart is empty.</div>
                  ) : (
                    list.map((it) => {
                      const max = maxQtyForCondition(it.condition)
                      const lineTotal = (it.qty || 0) * (it.price || 0)
                      return (
                        <div key={it.id} style={{ border: '1px solid #253049', borderRadius: 10, padding: 8, display: 'grid', gridTemplateColumns: '48px 1fr', gap: 8 }}>
                          <img src={it.img} alt={it.name} width={48} height={48} style={{ objectFit: 'cover', borderRadius: 8 }} />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{it.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--muted)', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{it.condition || '—'}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, gap: 8, flexWrap: 'nowrap' }}>
                              <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap' }}>Ksh {Number(it.price).toLocaleString('en-KE')}</div>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid #2a3342', padding: '2px 6px', borderRadius: 999, flexShrink: 0 }}>
                                <button className="btn btn-small" onClick={() => setQty(it.id, (it.qty || 0) - 1)} aria-label={`Decrease ${it.name} quantity`} disabled={it.qty <= 1}>-</button>
                                <span style={{ minWidth: 22, textAlign: 'center' }}>{it.qty}</span>
                                <button className="btn btn-small" onClick={() => setQty(it.id, (it.qty || 0) + 1)} aria-label={`Increase ${it.name} quantity`} disabled={(it.qty || 0) >= max}>+</button>
                              </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                              <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 13 }}>Ksh {Number(lineTotal).toLocaleString('en-KE')}</div>
                              <button className="btn btn-small" onClick={() => removeItem(it.id)} aria-label={`Remove ${it.name} from cart`}>Remove</button>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </section>

                {/* Sticky bottom summary bar */}
                <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, padding: 10, borderTop: '1px solid #253049', background: 'var(--card)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ fontWeight: 700, flex: 1, minWidth: 180 }}>Subtotal: Ksh {Number(totalAmount).toLocaleString('en-KE')}</div>
                  <button className="btn" onClick={clear} disabled={list.length === 0} style={{ flexShrink: 0 }}>Clear</button>
                  <a className="btn btn-primary" href={`https://wa.me/254718176584?text=${encodeURIComponent('Order: ' + list.map(i => `${i.name} x${i.qty}`).join(', ') + ' — Total Ksh ' + Number(totalAmount).toLocaleString('en-KE'))}`} target="_blank" rel="noopener noreferrer" aria-disabled={list.length === 0} style={list.length === 0 ? { pointerEvents: 'none', opacity: 0.7 } : {}}>Checkout</a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  )
}
