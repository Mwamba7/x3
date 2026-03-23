import { redirect } from 'next/navigation'
import connectDB from '../../../../lib/mongodb'
import Product from '../../../../models/Product'
import { requireAdmin } from '../../../../lib/adminAuth'
import AdminProductForm from '../../../../components/AdminProductForm'
import mongoose from 'mongoose'

export const dynamic = 'force-dynamic'

async function getProduct(id) {
  await connectDB()
  if (!mongoose.Types.ObjectId.isValid(id)) return null
  
  const p = await Product.findById(id).lean()
  if (!p) return null
  return {
    id: p._id.toString(),
    name: p.name,
    category: p.category,
    price: p.price,
    img: p.img,
    images: p.imagesJson ? JSON.parse(p.imagesJson) : [],
    special: p.special || '',
    meta: p.meta || '',
    condition: p.condition || '',
    status: p.status || 'available',
  }
}

export default async function AdminEditPreownedProductPage({ params }) {
  const user = await requireAdmin()
  if (!user) redirect('/admin/login')
  const product = await getProduct(params.id)
  if (!product) redirect('/admin/preowned')

  return (
    <main className="container" style={{ padding: '32px 24px 32px 0', maxWidth: 1200 }}>
      <h2 style={{ marginTop: 0, marginBottom: 10 }}>Edit Pre-owned Product</h2>
      <div style={{ marginBottom: 16 }}>
        <a className="btn" href="/admin/preowned">Back to Pre-owned Products</a>
      </div>
      <AdminProductForm initial={product} />
    </main>
  )
}
