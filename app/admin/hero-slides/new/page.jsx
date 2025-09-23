import { redirect } from 'next/navigation'
import { requireAdmin } from '../../../../lib/adminAuth'
import prisma from '../../../../lib/prisma'
import AdminHeroSlideForm from '../../../../components/AdminHeroSlideForm'

export const dynamic = 'force-dynamic'

export default async function NewHeroSlidePage({ searchParams }) {
  const user = await requireAdmin()
  if (!user) redirect('/admin/login')

  const id = searchParams?.id || ''
  let initial = null
  if (id) {
    initial = await prisma.heroSlide.findUnique({ where: { id } })
  }

  return (
    <main className="container" style={{ padding: '24px 0' }}>
      <h2 style={{ marginTop: 0, marginBottom: 10 }}>{initial ? 'Edit Hero Slide' : 'Add Hero Slide'}</h2>
      <AdminHeroSlideForm initial={initial || undefined} />
    </main>
  )
}
