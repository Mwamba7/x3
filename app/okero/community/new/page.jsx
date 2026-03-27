import { redirect } from 'next/navigation'
import { requireAdmin } from '../../../../lib/adminAuth'
import AdminProductForm from '../../../../components/AdminProductForm'

export const dynamic = 'force-dynamic'

export default async function NewCommunityItemPage() {
  const user = await requireAdmin()
  if (!user) redirect('/okero/login')

  return (
    <main className="container" style={{ padding: '32px 8px 32px 0', maxWidth: 1200, marginLeft: '8px' }}>
      <h2 style={{ marginTop: 0, marginBottom: 10, fontSize: '1.4rem' }}>Add Community Item</h2>
      <AdminProductForm section="marketplace" backUrl="/okero/community" />
    </main>
  )
}
