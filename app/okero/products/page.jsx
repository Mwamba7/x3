import { redirect } from 'next/navigation'
import { requireAdmin } from '../../../lib/adminAuth'
import connectDB from '../../../lib/mongodb'
import Product from '../../../models/Product'
import AdminProductsClient from '../../../components/AdminProductsClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0 // Disable caching completely

export default async function AdminProductsPage() {
  const user = await requireAdmin()
  if (!user) redirect('/okero/login')
  await connectDB()
  const rawProducts = await Product.find({
    category: { $in: ['tv','radio','phone','electronics','accessory','appliances','fridge','cooler'] },
    section: { $in: ['collection', null] }, // Only collection products
    // Exclude products that are also in preowned or fashion sections
    $nor: [
      { section: 'preowned' },
      { section: 'fashion' }
    ],
    $or: [
      { metadata: { $exists: false } },
      { 'metadata.source': { $ne: 'sell-page' } },
      { 'metadata.submissionType': { $ne: 'public' } }
    ]
  }).sort({ createdAt: -1 }).lean()

  console.log('Collection products query result:', {
    query: {
      categories: ['tv','radio','phone','electronics','accessory','appliances','fridge','cooler'],
      allowedSections: ['collection', null],
      excludedSections: ['preowned', 'fashion']
    },
    totalFound: rawProducts.length,
    products: rawProducts.map(p => ({ 
      name: p.name, 
      category: p.category, 
      section: p.section,
      sectionType: typeof p.section,
      metadata: p.metadata 
    }))
  })

  // Map _id to id for the client component
  const products = rawProducts.map(p => ({
    ...p,
    id: p._id.toString()
  }))

  return (
    <main className="container" style={{ padding: '32px 8px', maxWidth: '1400px', marginLeft: '2px' }}>
      <h2 style={{ marginTop: 0, marginBottom: 10 }}>Products — Collection</h2>
      <AdminProductsClient initial={products} section="products" />
    </main>
  )
}

