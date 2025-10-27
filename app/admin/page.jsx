import { redirect } from 'next/navigation'
import connectDB from '../../lib/mongodb'
import Product from '../../models/Product'
import Order from '../../models/Order'
import { requireAdmin } from '../../lib/adminAuth'

export const dynamic = 'force-dynamic'

export default async function AdminHubPage() {
  const user = await requireAdmin()
  if (!user) redirect('/admin/login')

  // Basic counts to make navigation useful
  await connectDB()
  const [allCount, fashionCount, preownedCount, communityCount, pendingCount, withdrawalCount, ordersCount] = await Promise.all([
    Product.countDocuments({
      category: { $in: ['tv','radio','phone','electronics','accessory','appliances','fridge','cooler'] },
      $nor: [{ 'metadata.source': 'sell-page', 'metadata.submissionType': 'public' }]
    }),
    Product.countDocuments({ 
      category: { $in: ['outfits', 'hoodie', 'shoes', 'sneakers', 'ladies', 'men'] },
      $nor: [{ 'metadata.source': 'sell-page', 'metadata.submissionType': 'public' }]
    }),
    Product.countDocuments({ 
      category: { $regex: '^preowned', $options: 'i' },
      $nor: [{ 'metadata.source': 'sell-page', 'metadata.submissionType': 'public' }]
    }),
    Product.countDocuments({ 'metadata.source': 'sell-page', 'metadata.submissionType': 'public' }),
    // Import PendingProduct model
    (async () => {
      const PendingProduct = (await import('../../models/PendingProduct')).default
      return PendingProduct.countDocuments({ status: 'pending' })
    })(),
    // Import WithdrawalRequest model
    (async () => {
      const WithdrawalRequest = (await import('../../models/WithdrawalRequest')).default
      return WithdrawalRequest.countDocuments({ status: { $in: ['pending', 'processing'] } })
    })(),
    // Count orders
    Order.countDocuments({})
  ])

  return (
    <main className="container" style={{ padding: '24px 0' }}>
      <h2 style={{ marginTop: 0, marginBottom: 10 }}>Admin Dashboard</h2>
      <Controls pendingCount={pendingCount} withdrawalCount={withdrawalCount} communityCount={communityCount} ordersCount={ordersCount} />

      <section className="products-section">
        <header className="products-header">
          <h3>Manage Sections</h3>
        </header>
        <div className="product-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          <Tile title="Orders Management" count={ordersCount} href="/admin/orders" priority={ordersCount > 0} />
          <Tile title="Pending Approvals" count={pendingCount} href="/admin/pending" priority />
          <Tile title="Withdrawal Requests" count={withdrawalCount} href="/admin/withdrawals" priority={withdrawalCount > 0} />
          <Tile title="Collection" count={allCount} href="/admin/products" primary />
          <Tile title="Community Marketplace" count={communityCount} href="/admin/community" />
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

function Controls({ pendingCount, withdrawalCount, communityCount, ordersCount }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
      <a className={`btn${ordersCount > 0 ? ' btn-primary' : ''}`} href="/admin/orders" style={ordersCount > 0 ? { background: '#28a745', borderColor: '#28a745' } : {}}>🛍️ Orders ({ordersCount})</a>
      <a className="btn btn-primary" href="/admin/pending">Pending ({pendingCount})</a>
      <a className={`btn${withdrawalCount > 0 ? ' btn-primary' : ''}`} href="/admin/withdrawals" style={withdrawalCount > 0 ? { background: '#f2994a', borderColor: '#f2994a' } : {}}>💳 Withdrawals ({withdrawalCount})</a>
      <a className="btn" href="/admin/products">Collection</a>
      <a className="btn" href="/admin/community">📢 Community ({communityCount})</a>
      <a className="btn" href="/admin/fashion">Fashion</a>
      <a className="btn" href="/admin/preowned">Pre-owned</a>
      <a className="btn" href="/admin/change-password">Change Password</a>
      <form action="/api/auth/logout" method="post" style={{ display: 'inline' }}>
        <button className="btn" type="submit">Logout</button>
      </form>
    </div>
  )
}

function Tile({ title, count, href, primary, priority }) {
  const getButtonClass = () => {
    if (priority) return 'btn' // Orange/warning style for pending
    if (primary) return 'btn btn-primary'
    return 'btn'
  }

  const getCardStyle = () => {
    if (priority && count > 0) {
      return { 
        textDecoration: 'none', 
        border: '2px solid #f2994a',
        background: 'rgba(242, 153, 74, 0.1)'
      }
    }
    return { textDecoration: 'none' }
  }

  return (
    <a href={href} className="product-card" style={getCardStyle()}>
      <div className="product-link" style={{ display: 'grid', gridTemplateColumns: '1fr' }}>
        <div className="info">
          <h4 className="name" style={{ marginBottom: 6 }}>
            {priority && count > 0 && '🔔 '}{title}
          </h4>
          <p className="meta">{count} item{count === 1 ? '' : 's'}</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <span className={getButtonClass()} style={priority && count > 0 ? { background: '#f2994a', color: 'white' } : {}}>
              {priority && count > 0 ? 'Review Now' : 'Open'}
            </span>
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
