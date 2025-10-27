import { redirect } from 'next/navigation'
import { requireAdmin } from '../../../lib/adminAuth'
import connectDB from '../../../lib/mongodb'
import Product from '../../../models/Product'
import AdminProductsClient from '../../../components/AdminProductsClient'

export const dynamic = 'force-dynamic'

export default async function AdminCommunityPage() {
  const user = await requireAdmin()
  if (!user) redirect('/admin/login')
  
  await connectDB()
  
  // Fetch Community Marketplace products (from sell page submissions)
  const rawProducts = await Product.find({
    'metadata.source': 'sell-page',
    'metadata.submissionType': 'public'
  }).sort({ createdAt: -1 }).lean()

  // Map _id to id for the client component
  const products = rawProducts.map(p => ({
    ...p,
    id: p._id.toString()
  }))

  return (
    <main className="container" style={{ padding: '24px 0' }}>
      <h2 style={{ marginTop: 0, marginBottom: 10 }}>📢 Community Marketplace</h2>
      <Controls current="community" />
      <AdminProductsClient initial={products} section="community" />
    </main>
  )
}

function Controls({ current = '' }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
      <a className="btn" href="/admin" title="Admin Dashboard">← Dashboard</a>
      <a className={`btn${current==='products'?' btn-primary':''}`} href="/admin/products" aria-current={current==='products'?'page':undefined} title="Go to: Collection">Collection</a>
      <a className={`btn${current==='fashion'?' btn-primary':''}`} href="/admin/fashion" aria-current={current==='fashion'?'page':undefined} title="Go to: Fashion">Fashion</a>
      <a className={`btn${current==='preowned'?' btn-primary':''}`} href="/admin/preowned" aria-current={current==='preowned'?'page':undefined} title="Go to: Pre-owned">Pre-owned</a>
      <a className={`btn${current==='community'?' btn-primary':''}`} href="/admin/community" aria-current={current==='community'?'page':undefined} title="You are on: Community Marketplace">📢 Community</a>
      <a className="btn" href="/admin/change-password">Change Password</a>
      <form action="/api/auth/logout" method="post" style={{ display: 'inline' }}>
        <button className="btn" type="submit">Logout</button>
      </form>
    </div>
  )
}
