import { notFound } from 'next/navigation'
import { getFashionProducts } from '../../../lib/fashion'
import connectDB from '../../../lib/mongodb'
import Product from '../../../models/Product'
import mongoose from 'mongoose'
import FashionProductDetailClient from '../../../components/FashionProductDetailClient'

export const dynamic = 'force-dynamic'

export async function generateStaticParams() {
  // Keep any local static fashion items, DB items will be handled dynamically
  const products = getFashionProducts()
  return products.map(p => ({ id: p.id }))
}

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
  const products = getFashionProducts()
  const prod = products.find(p => p.id === params.id)
  if (!prod) return { title: 'Item not found — Super Twice Resellers' }
  return {
    title: `${prod.name} — Super Twice Resellers`,
    description: prod.meta,
    openGraph: {
      title: `${prod.name} — Super Twice Resellers`,
      description: prod.meta,
      images: [prod.img],
    },
  }
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
          images: row.imagesJson ? JSON.parse(row.imagesJson) : [],
          special: row.special || '',
          meta: row.meta || '',
          condition: row.condition || '',
          status: row.status || 'available',
        }
      }
    }
  } catch {}
  if (!prod) {
    const products = getFashionProducts()
    prod = products.find(p => p.id === params.id)
  }
  if (!prod) return notFound()
  const images = (prod.images && prod.images.length ? prod.images : [prod.img])
  const priceKsh = `Ksh ${Number(prod.price).toLocaleString('en-KE')}`
  const isSold = String(prod.status || '').toLowerCase() === 'sold'
  const status = isSold ? 'Sold' : 'Available'

  return (
    <FashionProductDetailClient 
      product={prod}
      images={images}
      priceKsh={priceKsh}
      status={status}
      mergedMeta={String(prod.meta || '')}
    />
  )
}
