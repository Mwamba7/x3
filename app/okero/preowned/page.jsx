import { redirect } from 'next/navigation'
import connectDB from '../../../lib/mongodb'
import Product from '../../../models/Product'
import { requireAdmin } from '../../../lib/adminAuth'
import AdminProductsClient from '../../../components/AdminProductsClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0 // Disable caching completely

export default async function PreownedAdminPage() {
  const user = await requireAdmin()
  if (!user) redirect('/okero/login')
  await connectDB()
  const products = await Product.find({
    section: 'preowned',
    // Exclude products that are also in fashion or collection sections
    $nor: [
      { section: 'fashion' },
      { section: 'collection' }
    ]
  }).sort({ createdAt: -1 }).lean()
  
  console.log('Preowned products query result:', {
    query: {
      section: 'preowned',
      excludedSections: ['fashion', 'collection']
    },
    totalFound: products.length,
    products: products.map(p => ({ 
      name: p.name, 
      category: p.category, 
      section: p.section,
      sectionType: typeof p.section,
      metadata: p.metadata 
    }))
  })
  
  const items = products.map(p => ({
    id: p._id.toString(),
    name: p.name,
    category: p.category,
    price: Number(p.price),
    status: p.status,
    condition: p.condition,
    img: p.img,
  }))

  return (
    <main className="container" style={{ padding: '32px 8px', maxWidth: '1400px', marginLeft: '2px' }}>
      <h2 style={{ marginTop: 0, marginBottom: 10 }}>Products — Pre-owned</h2>
      <AdminProductsClient initial={items} section="preowned" />
    </main>
  )
}
