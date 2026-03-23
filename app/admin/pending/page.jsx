import { redirect } from 'next/navigation'
import connectDB from '../../../lib/mongodb'
import PendingProduct from '../../../models/PendingProduct'
import { requireAdmin } from '../../../lib/adminAuth'
import PendingProductsClient from '../../../components/PendingProductsClient'

export const dynamic = 'force-dynamic'

export default async function PendingProductsPage() {
  const user = await requireAdmin()
  if (!user) redirect('/admin/login')

  await connectDB()
  
  // Get all products (pending, approved, rejected), sorted by newest first
  const allProducts = await PendingProduct.find({})
    .sort({ createdAt: -1 })
    .lean()

  // Convert ObjectId to string for client component
  const serializedProducts = allProducts.map(product => ({
    ...product,
    _id: product._id.toString(),
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    reviewedAt: product.reviewedAt ? product.reviewedAt.toISOString() : null
  }))

  const totalCount = serializedProducts.length
  const pendingCount = serializedProducts.filter(p => p.status === 'pending').length
  const approvedCount = serializedProducts.filter(p => p.status === 'approved').length
  const rejectedCount = serializedProducts.filter(p => p.status === 'rejected').length

  return (
    <main className="container" style={{ padding: '32px 8px', maxWidth: '1400px', marginLeft: '2px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ marginTop: 0, marginBottom: 4 }}>🔔 Product Submissions ({totalCount})</h2>
          <div style={{ display: 'flex', gap: '12px', fontSize: '14px', color: 'var(--muted)' }}>
            <span>⏳ Pending: {pendingCount}</span>
            <span>✅ Approved: {approvedCount}</span>
            <span>❌ Rejected: {rejectedCount}</span>
          </div>
        </div>
        <a href="/admin" className="btn">Back to Dashboard</a>
      </div>

      {totalCount === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
          <h3>No product submissions</h3>
          <p>No products have been submitted for review yet.</p>
        </div>
      ) : (
        <PendingProductsClient products={serializedProducts} />
      )}
    </main>
  )
}
