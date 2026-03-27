import { redirect } from 'next/navigation'
import { requireAdmin } from '../../../lib/adminAuth'
import connectDB from '../../../lib/mongodb'
import Product from '../../../models/Product'
import AdminProductsClient from '../../../components/AdminProductsClient'

export const dynamic = 'force-dynamic'

export default async function AdminCommunityPage() {
  const user = await requireAdmin()
  if (!user) redirect('/okero/login')
  
  await connectDB()
  
  // Fetch Community Marketplace products (from sell page submissions)
  const rawProducts = await Product.find({
    section: 'marketplace'
  }).sort({ createdAt: -1 }).lean()

  // Map _id to id for the client component and include images field
  const products = rawProducts.map(p => ({
    id: p._id.toString(),
    name: p.name,
    category: p.category,
    price: Number(p.price),
    status: p.status,
    condition: p.condition,
    img: p.img, // Explicitly include img field
    images: p.images || [], // Include images array for gallery
    description: p.description || '',
    metadata: p.metadata || {}
  }))

  return (
    <main className="container" style={{ padding: '32px 8px', maxWidth: '1400px', marginLeft: '2px' }}>
      <h2 style={{ marginTop: 0, marginBottom: 10 }}>📢 Community Marketplace</h2>
      <AdminProductsClient initial={products} section="community" />
    </main>
  )
}
