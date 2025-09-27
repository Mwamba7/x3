'use client'

import { useCart } from '../../components/CartContext'
import Link from 'next/link'

export default function CartPage() {
  const { items, setQty, removeItem, clear, totalAmount, totalCount, maxQtyForCondition } = useCart()
  const list = Object.values(items)

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, padding: '24px 16px 0' }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Your Cart</h1>
        <Link href="/#collection" className="btn">Continue Shopping</Link>
      </div>

      {list.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center', color: 'var(--muted)', padding: '48px 16px', border: '1px dashed #2a3342', borderRadius: 12 }}>
          <p style={{ margin: 0, fontSize: 16 }}>Your cart is empty.</p>
          <Link href="/#collection" className="btn btn-primary">Back to Products</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '0 16px 24px' }}>
          {/* Cart Items List */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {list.map(it => {
              const max = maxQtyForCondition(it.condition)
              const lineTotal = (it.qty || 0) * (it.price || 0)
              return (
                <div key={it.id} style={{ display: 'flex', gap: 12, padding: 12, border: '1px solid #253049', borderRadius: 12 }}>
                  <img src={it.img} alt={it.name} width={68} height={56} style={{ objectFit: 'cover', borderRadius: 8 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>{it.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{it.condition || '—'}</div>
                      </div>
                      <button className="btn btn-small" onClick={() => removeItem(it.id)} aria-label={`Remove ${it.name}`} style={{ fontSize: 11, padding: '2px 6px' }}>Remove</button>
                    </div>
                    <div style={{ flex: 1 }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>
                        Qty: {it.qty}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'green' }}>Ksh {Number(lineTotal).toLocaleString('en-KE')}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </section>

          {/* Order Summary */}
          <aside style={{ border: '1px solid #253049', borderRadius: 12, padding: 20, marginTop: 24 }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>Order Summary</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>Subtotal ({totalCount} items)</span>
              <strong>Ksh {Number(totalAmount).toLocaleString('en-KE')}</strong>
            </div>
            <div style={{ height: 1, background: '#253049', margin: '16px 0' }} />
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input type="text" placeholder="Promo Code" style={{ flex: 1, borderRadius: 8, border: '1px solid #2a3342', background: 'transparent', color: 'var(--text)', padding: '8px 12px' }} />
              <button className="btn btn-small">Apply</button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <a 
                className="btn btn-primary"
                href={`https://wa.me/254718176584?text=${encodeURIComponent('Order: ' + list.map(i => `${i.name} x${i.qty}`).join(', ') + ' — Total Ksh ' + Number(totalAmount).toLocaleString('en-KE'))}`}
                target="_blank" 
                rel="noopener noreferrer"
                style={{ flex: 1, textAlign: 'center' }}
              >
                Checkout via WhatsApp
              </a>
              <button className="btn" onClick={clear}>Clear Cart</button>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
