import { redirect } from 'next/navigation'
import { requireAdmin } from '../../../../lib/adminAuth'
import AdminProductForm from '../../../../components/AdminProductForm'

export const dynamic = 'force-dynamic'

export default async function NewPreownedProductPage() {
  const user = await requireAdmin()
  if (!user) redirect('/admin/login')

  return (
    <main className="container" style={{ padding: '24px 0', maxWidth: 720 }}>
      <h2 style={{ marginTop: 0, marginBottom: 10 }}>Add Pre-owned Product</h2>
      <AdminProductForm />
    </main>
  )
}
