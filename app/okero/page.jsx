import { redirect } from 'next/navigation'
import connectDB from '../../lib/mongodb'
import Product from '../../models/Product'
import Order from '../../models/Order'
import { requireAdmin } from '../../lib/adminAuth'

export const dynamic = 'force-dynamic'

export default async function AdminHubPage() {
  const user = await requireAdmin()
  if (!user) redirect('/okero/login')

  // Basic counts to make navigation useful
  await connectDB()
  const [allCount, preownedCount, communityCount, pendingCount, withdrawalCount, ordersCount] = await Promise.all([
    // Product Collection - Electronics/Appliances (exclude marketplace, preowned, and fashion)
    Product.countDocuments({
      category: { $in: ['tv','radio','phone','electronics','accessory','appliances','fridge','cooler'] },
      section: { $in: ['collection', null] }, // Only collection products
      // Exclude products that are also in preowned or fashion sections
      $nor: [
        { section: 'preowned' },
        { section: 'fashion' }
      ],
      $or: [
        { metadata: { $exists: false } },
        { 'metadata.source': { $ne: 'sell-page' } },
        { 'metadata.submissionType': { $ne: 'public' } }
      ]
    }),
    // Pre-owned Products - All products sold to admin (exclude fashion and collection)
    Product.countDocuments({ 
      section: 'preowned',
      // Exclude products that are also in fashion or collection sections
      $nor: [
        { section: 'fashion' },
        { section: 'collection' }
      ]
    }),
    // Community Marketplace - All marketplace products
    Product.countDocuments({ 
      section: 'marketplace'
    }),
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
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        
        .management-card {
          background: #0f1521;
          border: 1px solid #2a3342;
          border-radius: 8px;
          padding: 8px 10px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          text-decoration: none;
          color: var(--text);
          transition: all 0.2s ease;
          min-height: 36px;
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
          padding: 0.15rem 0.5rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        
        .card-count.priority {
          background: #e74c3c;
          color: white;
        }
        
        .card-icon {
          font-size: 1.2rem;
          margin-bottom: 0.25rem;
        }
        
        .card-content h3 {
          margin: 0 0 0.25rem 0;
          font-size: 0.9rem;
          font-weight: 600;
        }
        
        .card-content p {
          margin: 0;
          font-size: 0.75rem;
          color: var(--muted);
          line-height: 1.2;
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
        <a href="/okero/orders" className="management-card">
          <div className="card-icon">🛍️</div>
          <div className="card-content">
            <h3>Orders Management</h3>
            <p className="card-count">{ordersCount}</p>
            <p>Manage customer orders and track deliveries</p>
          </div>
        </a>
        <a href="/okero/pending" className="management-card">
          <div className="card-icon">⏳</div>
          <div className="card-content">
            <h3>Pending Approvals</h3>
            <p className="card-count">{pendingCount}</p>
            <p>Review and approve pending product submissions</p>
          </div>
        </a>
        <a href="/okero/withdrawals" className="management-card">
          <div className="card-icon">💳</div>
          <div className="card-content">
            <h3>Withdrawal Requests</h3>
            <p className="card-count">{withdrawalCount}</p>
            <p>Process user withdrawal requests</p>
          </div>
        </a>
        <a href="/okero/products" className="management-card">
          <div className="card-icon">📦</div>
          <div className="card-content">
            <h3>Product Collection</h3>
            <p className="card-count">{allCount}</p>
            <p>Manage electronics and appliances inventory</p>
          </div>
        </a>
        <a href="/okero/community" className="management-card">
          <div className="card-icon">👥</div>
          <div className="card-content">
            <h3>Community Marketplace</h3>
            <p className="card-count">{communityCount}</p>
            <p>Moderate community-submitted products</p>
          </div>
        </a>
        <a href="/okero/preowned" className="management-card">
          <div className="card-icon">♻️</div>
          <div className="card-content">
            <h3>Pre-owned Products</h3>
            <p className="card-count">{preownedCount}</p>
            <p>Manage second-hand and refurbished items</p>
          </div>
        </a>
      </div>

      {/* Quick Actions */}
      <h3 className="section-title">Quick Actions</h3>
      <div className="management-grid">
        <a href="/okero/products/new" className="management-card">
          <div className="card-header">
            <h4 className="card-title">➕ Add Product</h4>
          </div>
          <div className="card-body">
            <p>Add new products to the collection</p>
          </div>
        </a>
        <a href="/okero/preowned/new" className="management-card">
          <div className="card-header">
            <h4 className="card-title">♻️ Add Pre-owned</h4>
          </div>
          <div className="card-body">
            <p>Add pre-owned products</p>
          </div>
        </a>
        <a href="/okero/community/new" className="management-card">
          <div className="card-header">
            <h4 className="card-title">👥 Add Community Item</h4>
          </div>
          <div className="card-body">
            <p>Add new community marketplace items</p>
          </div>
        </a>
      </div>
    </div>
  )
}
