import { redirect } from 'next/navigation'
import prisma from '../../../lib/prisma'
import { requireAdmin } from '../../../lib/adminAuth'
import AdminProductsClient from '../../../components/AdminProductsClient'

export const dynamic = 'force-dynamic'

export default async function AdminFashionPage() {
  const user = await requireAdmin()
  if (!user) redirect('/admin/login')
  const products = await prisma.product.findMany({
    where: { category: { in: ['outfits', 'hoodie', 'shoes', 'sneakers', 'ladies', 'men'] } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <main className="container" style={{ padding: '24px 0' }}>
      <h2 style={{ marginTop: 0, marginBottom: 10 }}>Products — Outfits, Hoodies, Shoes, Sneakers, Ladies, Men</h2>
      <Controls current="fashion" />
      <AdminProductsClient initial={products} />
    </main>
  )
}

function Controls({ current = '' }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <a className={`btn${current==='products'?' btn-primary':''}`} href="/admin/products" aria-current={current==='products'?'page':undefined} title={current==='products'?'You are on: Collection':'Go to: Collection'}>Collection</a>
      <a className={`btn${current==='fashion'?' btn-primary':''}`} href="/admin/fashion" aria-current={current==='fashion'?'page':undefined} title="You are on: Fashion">Fashion</a>
      <a className={`btn${current==='preowned'?' btn-primary':''}`} href="/admin/preowned" aria-current={current==='preowned'?'page':undefined} title={current==='preowned'?'You are on: Pre-owned':'Go to: Pre-owned'}>Pre-owned</a>
      <a className="btn btn-primary" href="/admin/fashion/new" title="Add product to Fashion">Add Product</a>
      <span className="helper" style={{ alignSelf: 'center' }}>(Current: Fashion)</span>
      <a className="btn" href="/admin/change-password">Change Password</a>
    </div>
  )
}
