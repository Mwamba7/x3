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
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 8px', marginLeft: '8px' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .dashboard-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .stat-card {
          background: var(--card);
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          border-left: 4px solid #3498db;
          transition: transform 0.2s ease;
        }
        
        .stat-card:hover {
          transform: translateY(-2px);
        }
        
        .stat-card.priority {
          border-left-color: #e74c3c;
        }
        
        .stat-card.success {
          border-left-color: #27ae60;
        }
        
        .stat-card.warning {
          border-left-color: #f39c12;
        }
        
        .stat-number {
          font-size: 2rem;
          font-weight: bold;
          color: var(--text);
          margin-bottom: 0.5rem;
        }
        
        .stat-label {
          color: var(--muted);
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .stat-icon {
          font-size: 2rem;
          float: right;
          opacity: 0.3;
        }
        
        .management-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1rem;
          margin-bottom: 1rem;
        }
        
        .management-card {
          background: #0f1521;
          border: 1px solid #2a3342;
          border-radius: 12px;
          padding: 10px 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          text-decoration: none;
          color: var(--text);
          transition: all 0.2s ease;
          min-height: 48px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        
        .management-card:hover {
          border-color: var(--primary-700);
          box-shadow: 0 0 0 3px var(--ring);
          text-decoration: none;
          color: inherit;
        }
        
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          margin-top: -0.5rem;
        }
        
        .card-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text);
          margin: 0;
        }
        
        .card-count {
          background: var(--border);
          color: var(--text);
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 600;
        }
        
        .card-count.priority {
          background: #e74c3c;
          color: white;
        }
        
        .section-title {
          color: var(--text);
          margin-bottom: 1.5rem;
          margin-top: 0;
          font-size: 1.25rem;
          font-weight: 600;
        }
      ` }} />
      

      {/* Management Sections */}
      <h3 className="section-title">Management Sections</h3>
      <div className="management-grid">
        <a href="/admin/orders" className="management-card">
          <div className="card-header">
            <h4 className="card-title">🛍️ Orders Management</h4>
            <span className={`card-count ${ordersCount > 0 ? 'priority' : ''}`}>{ordersCount}</span>
          </div>
          <p style={{ color: '#7f8c8d', margin: 0, fontSize: '0.875rem' }}>
            Manage customer orders and track deliveries
          </p>
        </a>
        
        <a href="/admin/pending" className="management-card">
          <div className="card-header">
            <h4 className="card-title">⏳ Pending Approvals</h4>
            <span className="card-count priority">{pendingCount}</span>
          </div>
          <p style={{ color: '#7f8c8d', margin: 0, fontSize: '0.875rem' }}>
            Review and approve pending product submissions
          </p>
        </a>
        
        <a href="/admin/withdrawals" className="management-card">
          <div className="card-header">
            <h4 className="card-title">💳 Withdrawal Requests</h4>
            <span className={`card-count ${withdrawalCount > 0 ? 'priority' : ''}`}>{withdrawalCount}</span>
          </div>
          <p style={{ color: '#7f8c8d', margin: 0, fontSize: '0.875rem' }}>
            Process user withdrawal requests
          </p>
        </a>
        
        <a href="/admin/products" className="management-card">
          <div className="card-header">
            <h4 className="card-title">📦 Product Collection</h4>
            <span className="card-count">{allCount}</span>
          </div>
          <p style={{ color: '#7f8c8d', margin: 0, fontSize: '0.875rem' }}>
            Manage electronics and appliances inventory
          </p>
        </a>
        
        <a href="/admin/community" className="management-card">
          <div className="card-header">
            <h4 className="card-title">👥 Community Marketplace</h4>
            <span className="card-count">{communityCount}</span>
          </div>
          <p style={{ color: '#7f8c8d', margin: 0, fontSize: '0.875rem' }}>
            Moderate community-submitted products
          </p>
        </a>
        
        <a href="/admin/fashion" className="management-card">
          <div className="card-header">
            <h4 className="card-title">👕 Fashion Products</h4>
            <span className="card-count">{fashionCount}</span>
          </div>
          <p style={{ color: '#7f8c8d', margin: 0, fontSize: '0.875rem' }}>
            Manage clothing, shoes, and fashion items
          </p>
        </a>
        
        <a href="/admin/preowned" className="management-card">
          <div className="card-header">
            <h4 className="card-title">♻️ Pre-owned Products</h4>
            <span className="card-count">{preownedCount}</span>
          </div>
          <p style={{ color: '#7f8c8d', margin: 0, fontSize: '0.875rem' }}>
            Manage second-hand and refurbished items
          </p>
        </a>
      </div>

      {/* Quick Actions */}
      <h3 className="section-title">Quick Actions</h3>
      <div className="management-grid">
        <a href="/admin/products/new" className="management-card">
          <div className="card-header">
            <h4 className="card-title">➕ Add Product</h4>
          </div>
          <p style={{ color: '#7f8c8d', margin: 0, fontSize: '0.875rem' }}>
            Add new products to the collection
          </p>
        </a>
        
        <a href="/admin/fashion/new" className="management-card">
          <div className="card-header">
            <h4 className="card-title">👕 Add Fashion Item</h4>
          </div>
          <p style={{ color: '#7f8c8d', margin: 0, fontSize: '0.875rem' }}>
            Add new fashion products
          </p>
        </a>
        
        <a href="/admin/preowned/new" className="management-card">
          <div className="card-header">
            <h4 className="card-title">♻️ Add Pre-owned</h4>
          </div>
          <p style={{ color: '#7f8c8d', margin: 0, fontSize: '0.875rem' }}>
            Add pre-owned products
          </p>
        </a>
        
        <a href="/admin/community/new" className="management-card">
          <div className="card-header">
            <h4 className="card-title">👥 Add Community Item</h4>
          </div>
          <p style={{ color: '#7f8c8d', margin: 0, fontSize: '0.875rem' }}>
            Add new community marketplace items
          </p>
        </a>
      </div>
    </div>
  )
}
