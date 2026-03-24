import Link from 'next/link'
import { notFound } from 'next/navigation'
import connectDB from '../../../lib/mongodb'
import Product from '../../../models/Product'
import ProductDetailClient from '../../../components/ProductDetailClient'
import mongoose from 'mongoose'

export async function generateMetadata({ params }) {
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
  return { title: 'Product not found — Super Twice Resellers' }
}

export default async function ProductPage({ params }) {
  // Try DB first
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
  if (!prod) return notFound()
  // Hero slides functionality removed for MongoDB migration
  // TODO: Implement HeroSlide model if needed
  let slide = null

  // Build merged gallery (slide images first), de-duplicated
  let slideGallery = []
  if (slide) {
    try { slideGallery = slide.galleryJson ? JSON.parse(slide.galleryJson) : [] } catch {}
    if (!Array.isArray(slideGallery)) slideGallery = []
    if (slide.imageUrl) slideGallery = [slide.imageUrl, ...slideGallery]
  }
  const baseImages = (prod.images && prod.images.length ? prod.images : [prod.img]).filter(Boolean)
  const images = Array.from(new Set([...(slideGallery || []), ...baseImages]))
  
  // Debug: Log image data
  console.log('Product page debug:', {
    productId: params.id,
    productName: prod.name,
    rawImages: prod.images,
    baseImages,
    finalImages: images,
    slideGallery
  })

  // Prefer slide.price when present, else product price
  const effPrice = (slide && typeof slide.price === 'number') ? slide.price : prod.price
  const priceKsh = `Ksh ${Number(effPrice).toLocaleString('en-KE')}`
  const status = prod.status === 'sold' ? 'Sold' : 'Available'
  const mergedMeta = [slide?.subtitle || '', prod.meta || ''].filter(Boolean).join(' | ')

  return (
    <ProductDetailClient 
      product={prod} 
      images={images} 
      priceKsh={priceKsh} 
      status={status} 
      mergedMeta={mergedMeta} 
    />
  )
}
