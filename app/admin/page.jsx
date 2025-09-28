import { redirect } from 'next/navigation'
import prisma from '../../lib/prisma'
import { requireAdmin } from '../../lib/adminAuth'

export const dynamic = 'force-dynamic'

export default async function AdminHubPage() {
  const user = await requireAdmin()
  if (!user) redirect('/admin/login')

  // Basic counts to make navigation useful
  const [allCount, fashionCount, preownedCount] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { category: { in: ['outfits', 'hoodie', 'shoes', 'sneakers', 'ladies', 'men'] } } }),
    prisma.product.count({ where: { category: { startsWith: 'preowned' } } }),
  ])

  return (
    <main className="container" style={{ padding: '24px 0' }}>
      <h2 style={{ marginTop: 0, marginBottom: 10 }}>Admin Dashboard</h2>
      <Controls />

      <section className="products-section">
        <header className="products-header">
          <h3>Manage Sections</h3>
        </header>
        <div className="product-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          <Tile title="Collection" count={allCount} href="/admin/products" primary />
          <Tile title="Outfits, Hoodies, Shoes, Sneakers, Ladies, Men" count={fashionCount} href="/admin/fashion" />
          <Tile title="Pre-owned Products" count={preownedCount} href="/admin/preowned" />
        </div>
      </section>

      <section className="products-section">
        <header className="products-header">
          <h3>Quick Actions</h3>
        </header>
        <div className="product-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          <Action title="Add Product (Collection)" href="/admin/products/new" />
          <Action title="Add Fashion Product" href="/admin/fashion/new" />
          <Action title="Add Pre-owned Product" href="/admin/preowned/new" />
          <Action title="Change Password" href="/admin/change-password" />
        </div>
      </section>
    </main>
  )
}

function Controls() {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
      <a className="btn" href="/admin/products">Collection</a>
      <a className="btn" href="/admin/fashion">Fashion</a>
      <a className="btn" href="/admin/preowned">Pre-owned</a>
      <a className="btn" href="/admin/change-password">Change Password</a>
      <form action="/api/auth/logout" method="post" style={{ display: 'inline' }}>
        <button className="btn" type="submit">Logout</button>
      </form>
    </div>
  )
}

function Tile({ title, count, href, primary }) {
  return (
    <a href={href} className="product-card" style={{ textDecoration: 'none' }}>
      <div className="product-link" style={{ display: 'grid', gridTemplateColumns: '1fr' }}>
        <div className="info">
          <h4 className="name" style={{ marginBottom: 6 }}>{title}</h4>
          <p className="meta">{count} item{count === 1 ? '' : 's'}</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <span className={primary ? 'btn btn-primary' : 'btn'}>Open</span>
          </div>
        </div>
      </div>
    </a>
  )
}

function Action({ title, href }) {
  return (
    <a href={href} className="product-card" style={{ textDecoration: 'none' }}>
      <div className="product-link" style={{ display: 'grid', gridTemplateColumns: '1fr' }}>
        <div className="info">
          <h4 className="name" style={{ marginBottom: 6 }}>{title}</h4>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <span className="btn">Go</span>
          </div>
        </div>
      </div>
    </a>
  )
}
