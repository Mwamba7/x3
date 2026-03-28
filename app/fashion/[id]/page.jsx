import { notFound } from 'next/navigation'
import connectDB from '../../../lib/mongodb'
import Product from '../../../models/Product'
import mongoose from 'mongoose'
import ProductDetailClient from '../../../components/ProductDetailClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata({ params }) {
  // Try DB first
  try {
    await connectDB()
    if (mongoose.Types.ObjectId.isValid(params.id)) {
      const row = await Product.findById(params.id)
      if (row) {
        return {
          title: `${row.name} — Super Twice Resellers`,
          description: row.meta || '',
          openGraph: {
            title: `${row.name} — Super Twice Resellers`,
            description: row.meta || '',
            images: [row.img],
          },
        }
      }
    }
  } catch {}
  return { title: 'Item not found — Super Twice Resellers' }
}

export default async function FashionPage({ params }) {
  let prod = null
  try {
    await connectDB()
    if (mongoose.Types.ObjectId.isValid(params.id)) {
      const row = await Product.findById(params.id)
      if (row) {
        prod = {
          id: row._id.toString(),
          name: row.name,
          category: row.category,
          price: row.price,
          img: row.img,
          images: row.imagesJson ? JSON.parse(row.imagesJson) : (row.images || []), // Handle both imagesJson and images array
          description: row.description || '', // Include description field
          special: row.special || '',
          meta: row.meta || '',
          condition: row.condition || '',
          status: row.status || 'available',
        }
      }
    }
  } catch {}
  if (!prod) return notFound()
  const images = (prod.images && prod.images.length ? prod.images : [prod.img])
  const priceKsh = `Ksh ${Number(prod.price).toLocaleString('en-KE')}`
  const isSold = String(prod.status || '').toLowerCase() === 'sold'
  const status = isSold ? 'Sold' : 'Available'

  return (
    <ProductDetailClient 
      product={prod}
      images={images}
      priceKsh={priceKsh}
      status={status}
      mergedMeta={String(prod.meta || '')}
    />
  )
}
