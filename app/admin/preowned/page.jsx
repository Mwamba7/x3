import { redirect } from 'next/navigation'
import connectDB from '../../../lib/mongodb'
import Product from '../../../models/Product'
import { requireAdmin } from '../../../lib/adminAuth'
import AdminProductsClient from '../../../components/AdminProductsClient'

export const dynamic = 'force-dynamic'

export default async function PreownedAdminPage() {
  const user = await requireAdmin()
  if (!user) redirect('/admin/login')
  await connectDB()
  const products = await Product.find({
    category: { $regex: '^preowned', $options: 'i' },
    // Exclude Community Marketplace products
    $nor: [
      { 'metadata.source': 'sell-page', 'metadata.submissionType': 'public' }
    ]
  }).sort({ createdAt: -1 }).lean()
  
  const items = products.map(p => ({
    id: p._id.toString(),
    name: p.name,
    category: p.category,
    price: Number(p.price),
    status: p.status,
    condition: p.condition,
    img: p.img,
  }))

  return (
    <main className="container" style={{ padding: '24px 0' }}>
      <h2 style={{ marginTop: 0, marginBottom: 10 }}>Products — Pre-owned</h2>
      <Controls current="preowned" />
      <AdminProductsClient initial={items} section="preowned" />
    </main>
  )
}

function Controls({ current = '' }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
      <a className="btn" href="/admin" title="Admin Dashboard">← Dashboard</a>
      <a className={`btn${current==='products'?' btn-primary':''}`} href="/admin/products" aria-current={current==='products'?'page':undefined} title={current==='products'?'You are on: Collection':'Go to: Collection'}>Collection</a>
      <a className={`btn${current==='fashion'?' btn-primary':''}`} href="/admin/fashion" aria-current={current==='fashion'?'page':undefined} title={current==='fashion'?'You are on: Fashion':'Go to: Fashion'}>Fashion</a>
      <a className={`btn${current==='preowned'?' btn-primary':''}`} href="/admin/preowned" aria-current={current==='preowned'?'page':undefined} title="You are on: Pre-owned">Pre-owned</a>
      <a className="btn btn-primary" href="/admin/preowned/new" title="Add product to Pre-owned">Add Product</a>
      <a className="btn" href="/admin/change-password">Change Password</a>
      <form action="/api/auth/logout" method="post" style={{ display: 'inline' }}>
        <button className="btn" type="submit">Logout</button>
      </form>
    </div>
  )
}
