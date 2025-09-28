import { redirect } from 'next/navigation'
import { requireAdmin } from '../../../lib/adminAuth'
import prisma from '../../../lib/prisma'
import AdminProductsClient from '../../../components/AdminProductsClient'

export const dynamic = 'force-dynamic'

export default async function AdminProductsPage() {
  const user = await requireAdmin()
  if (!user) redirect('/admin/login')
  const products = await prisma.product.findMany({
    where: { category: { in: ['tv','radio','phone','electronics','accessory','appliances','fridge','cooler'] } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <main className="container" style={{ padding: '24px 0' }}>
      <h2 style={{ marginTop: 0, marginBottom: 10 }}>Products — Collection</h2>
      <Controls current="products" />
      <AdminProductsClient initial={products} />
    </main>
  )
}

function Controls({ current = '' }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <a className={`btn${current==='products'?' btn-primary':''}`} href="/admin/products" aria-current={current==='products'?'page':undefined} title="You are on: Collection">Collection</a>
      <a className={`btn${current==='fashion'?' btn-primary':''}`} href="/admin/fashion" aria-current={current==='fashion'?'page':undefined} title="Go to: Fashion">Fashion</a>
      <a className={`btn${current==='preowned'?' btn-primary':''}`} href="/admin/preowned" aria-current={current==='preowned'?'page':undefined} title="Go to: Pre-owned">Pre-owned</a>
      <a className="btn btn-primary" href="/admin/products/new" title="Add product to Collection">Add Product</a>
      <span className="helper" style={{ alignSelf: 'center' }}>(Current: Collection)</span>
      <a className="btn" href="/admin/change-password">Change Password</a>
    </div>
  )
}

