import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProducts } from '../../../lib/products'
import prisma from '../../../lib/prisma'
import ProductGallery from '../../../components/ProductGallery'
import ProductActions from '../../../components/ProductActions'

export async function generateStaticParams() {
  const products = getProducts()
  return products.map(p => ({ id: p.id }))
}

export function generateMetadata({ params }) {
  const products = getProducts()
  const prod = products.find(p => p.id === params.id)
  if (!prod) return { title: 'Product not found — Super Twice Resellers' }
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

export default async function ProductPage({ params }) {
  // Try DB first
  let prod = null
  try {
    const row = await prisma.product.findUnique({ where: { id: params.id } })
    if (row) {
      prod = {
        id: row.id,
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
  } catch {}
  if (!prod) {
    const products = getProducts()
    prod = products.find(p => p.id === params.id)
  }
  if (!prod) return notFound()
  // If there is an active hero slide linking to this product, merge its gallery/details
  let slide = null
  try {
    slide = await prisma.heroSlide.findFirst({
      where: { productId: params.id, active: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      select: { imageUrl: true, galleryJson: true, subtitle: true, price: true },
    })
  } catch {}

  // Build merged gallery (slide images first), de-duplicated
  let slideGallery = []
  if (slide) {
    try { slideGallery = slide.galleryJson ? JSON.parse(slide.galleryJson) : [] } catch {}
    if (!Array.isArray(slideGallery)) slideGallery = []
    if (slide.imageUrl) slideGallery = [slide.imageUrl, ...slideGallery]
  }
  const baseImages = (prod.images && prod.images.length ? prod.images : [prod.img]).filter(Boolean)
  const images = Array.from(new Set([...(slideGallery || []), ...baseImages]))

  // Prefer slide.price when present, else product price
  const effPrice = (slide && typeof slide.price === 'number') ? slide.price : prod.price
  const priceKsh = `Ksh ${Number(effPrice).toLocaleString('en-KE')}`
  const status = prod.status === 'sold' ? 'Sold' : 'Available'
  const mergedMeta = [slide?.subtitle || '', prod.meta || ''].filter(Boolean).join(' | ')

  return (
    <main className="container" style={{ paddingTop: '12px' }}>
      <nav>
        <Link className="btn" href="/">← Back to products</Link>
      </nav>

      <article className="product-detail" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginTop: '12px' }}>
        <ProductGallery images={images} name={prod.name} />
        <div className="info product-info-grid" style={{ background: 'var(--card)', border: '1px solid #253049', borderRadius: 14, padding: 16, marginBottom: 24 }}>
            
            {/* Title */}
            <div style={{ marginBottom: '8px' }}>
              <h1 className="product-title">{prod.name}</h1>
            </div>

            {/* Subtitle/Meta */}
            <ul className="detail-meta-grid">
              {mergedMeta.split(/[|,]/).map(s => s.trim()).filter(Boolean).map((spec, i) => (
                <li key={i} className="detail-meta-item">
                  <svg className="icon" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  <span>{spec}</span>
                </li>
              ))}
            </ul>

            {/* Price */}
            <div className="price">{priceKsh}</div>

            {/* Action Buttons */}
            <div className="actions">
              <ProductActions product={prod} />
              <a className="btn btn-small" href="#contact">Contact Details</a>
            </div>

            {/* Features/Highlights Section */}
            <div className="product-features">
              <ul className="product-features-list">
                {String(prod.details || '').split(/[\n•-]/).map(s => s.trim()).filter(Boolean).map((feature, i) => (
                  <li key={i}>
                    <svg className="icon" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            
                      </div>
      </article>
    </main>
  )
}
