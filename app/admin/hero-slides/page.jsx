import { redirect } from 'next/navigation'
import { requireAdmin } from '../../../lib/adminAuth'

export const dynamic = 'force-dynamic'

export default async function AdminHeroSlidesPage() {
  const user = await requireAdmin()
  if (!user) redirect('/admin/login')
  // Hero Slides are deprecated. Redirect to Products admin.
  redirect('/admin/products')
}
