import { redirect } from 'next/navigation'
import { requireAdmin } from '../../../../lib/adminAuth'
import prisma from '../../../../lib/prisma'
import AdminHeroSlideForm from '../../../../components/AdminHeroSlideForm'

export const dynamic = 'force-dynamic'

export default async function EditHeroSlidePage({ params }) {
  const user = await requireAdmin()
  if (!user) redirect('/admin/login')

  const slide = await prisma.heroSlide.findUnique({ where: { id: params.id } })
  if (!slide) redirect('/admin/hero-slides')

  // Fetch minimal product list server-side so the form works independently
  let products = []
  try {
    const rows = await prisma.product.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } })
    products = rows || []
  } catch {}

  return (
    <main className="container" style={{ padding: '24px 0' }}>
      <h2 style={{ marginTop: 0, marginBottom: 10 }}>Edit Hero Slide</h2>
      <AdminHeroSlideForm initial={slide} products={products} />
    </main>
  )
}
