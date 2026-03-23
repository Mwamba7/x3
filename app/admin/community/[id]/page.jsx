import { redirect } from 'next/navigation'
import connectDB from '../../../../lib/mongodb'
import Product from '../../../../models/Product'
import { requireAdmin } from '../../../../lib/adminAuth'
import AdminProductForm from '../../../../components/AdminProductForm'
import mongoose from 'mongoose'

export const dynamic = 'force-dynamic'

async function getCommunityProduct(id) {
  await connectDB()
  if (!mongoose.Types.ObjectId.isValid(id)) return null
  
  // Find community product (from sell page submissions)
  const p = await Product.findOne({
    _id: id,
    'metadata.source': 'sell-page',
    'metadata.submissionType': 'public'
  }).lean()
  
  if (!p) return null
  
  return {
    id: p._id.toString(),
    name: p.name,
    category: p.category,
    price: p.price,
    img: p.img,
    images: p.imagesJson ? JSON.parse(p.imagesJson) : (p.images || []),
    special: p.special || '',
    meta: p.meta || p.description || '',
    condition: p.condition || '',
    status: p.status || 'available',
    description: p.description || '',
    metadata: p.metadata
  }
}

export default async function AdminEditCommunityProductPage({ params }) {
  const user = await requireAdmin()
  if (!user) redirect('/admin/login')
  
  const product = await getCommunityProduct(params.id)
  if (!product) redirect('/admin/community')

  return (
    <main className="container" style={{ padding: '32px 24px 32px 0', maxWidth: 1200 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>📢 Edit Community Product</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 14 }}>
            Product submitted by: {product.metadata?.originalSeller?.name || 'Unknown'}
          </p>
        </div>
        <a href="/admin/community" className="btn">Back to Community</a>
      </div>
      
      <AdminProductForm 
        initial={product} 
        section="community"
        backUrl="/admin/community"
      />
    </main>
  )
}
