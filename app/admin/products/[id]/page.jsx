import { redirect } from 'next/navigation'
import prisma from '../../../../lib/prisma'
import { requireAdmin } from '../../../../lib/adminAuth'
import AdminProductForm from '../../../../components/AdminProductForm'

export const dynamic = 'force-dynamic'

async function getProduct(id) {
  const p = await prisma.product.findUnique({ where: { id } })
  if (!p) return null
  return {
    id: p.id,
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

export default async function AdminEditProductPage({ params }) {
  const user = await requireAdmin()
  if (!user) redirect('/admin/login')
  const product = await getProduct(params.id)
  if (!product) redirect('/admin/products')

  return (
    <main className="container" style={{ padding: '24px 0', maxWidth: 720 }}>
      <h2 style={{ marginTop: 0, marginBottom: 10 }}>Edit Product</h2>
      <AdminProductForm initial={product} />
    </main>
  )
}
