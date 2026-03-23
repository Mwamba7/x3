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
    <main className="container" style={{ padding: '32px 8px', maxWidth: '1400px', marginLeft: '2px' }}>
      <h2 style={{ marginTop: 0, marginBottom: 10 }}>Products — Pre-owned</h2>
      <AdminProductsClient initial={items} section="preowned" />
    </main>
  )
}
