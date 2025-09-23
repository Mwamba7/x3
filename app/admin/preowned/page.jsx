import { redirect } from 'next/navigation'
import prisma from '../../../lib/prisma'
import { requireAdmin } from '../../../lib/adminAuth'
import AdminProductsClient from '../../../components/AdminProductsClient'

export const dynamic = 'force-dynamic'

export default async function PreownedAdminPage() {
  const user = await requireAdmin()
  if (!user) redirect('/admin/login')
  const products = await prisma.product.findMany({
    where: { category: { startsWith: 'preowned' } },
    orderBy: { createdAt: 'desc' },
  })
  const items = products.map(p => ({
    id: p.id,
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
      <AdminProductsClient initial={items} />
    </main>
  )
}

function Controls({ current = '' }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <a className={`btn${current==='products'?' btn-primary':''}`} href="/admin/products" aria-current={current==='products'?'page':undefined} title={current==='products'?'You are on: Collection':'Go to: Collection'}>Collection</a>
      <a className={`btn${current==='fashion'?' btn-primary':''}`} href="/admin/fashion" aria-current={current==='fashion'?'page':undefined} title={current==='fashion'?'You are on: Fashion':'Go to: Fashion'}>Fashion</a>
      <a className={`btn${current==='preowned'?' btn-primary':''}`} href="/admin/preowned" aria-current={current==='preowned'?'page':undefined} title="You are on: Pre-owned">Pre-owned</a>
      <a className="btn btn-primary" href="/admin/preowned/new" title="Add product to Pre-owned">Add Product</a>
      <span className="helper" style={{ alignSelf: 'center' }}>(Current: Pre-owned)</span>
      <a className="btn" href="/admin/change-password">Change Password</a>
    </div>
  )
}
