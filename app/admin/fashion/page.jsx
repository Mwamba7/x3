import { redirect } from 'next/navigation'
import prisma from '../../../lib/prisma'
import { requireAdmin } from '../../../lib/adminAuth'
import AdminProductsClient from '../../../components/AdminProductsClient'

export const dynamic = 'force-dynamic'

export default async function AdminFashionPage() {
  const user = await requireAdmin()
  if (!user) redirect('/admin/login')
  const products = await prisma.product.findMany({
    where: { category: { in: ['hoodie', 'shoes', 'sneakers'] } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <main className="container" style={{ padding: '24px 0' }}>
      <h2 style={{ marginTop: 0, marginBottom: 10 }}>Products — Fashion (Hoodies, Shoes & Sneakers)</h2>
      <Controls />
      <AdminProductsClient initial={products} />
    </main>
  )
}

function Controls() {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <a className="btn" href="/admin/products">All Products</a>
      <a className="btn btn-primary" href="/admin/fashion/new">Add Product</a>
      <a className="btn" href="/admin/change-password">Change Password</a>
      <form action="/api/auth/logout" method="post">
        <button className="btn" type="submit">Logout</button>
      </form>
    </div>
  )
}
