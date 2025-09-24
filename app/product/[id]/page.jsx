import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProducts } from '../../../lib/products'
import prisma from '../../../lib/prisma'
import ProductGallery from '../../../components/ProductGallery'

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
    <main className="container" style={{ padding: '24px 0' }}>
      <nav style={{ marginBottom: 12 }}>
        <Link className="btn" href="/">← Back to products</Link>
      </nav>

      <article className="product-detail" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
        <ProductGallery images={images} name={prod.name} />
        <div className="info" style={{ background: 'var(--card)', border: '1px solid #253049', borderRadius: 14, padding: 16 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
            <span className="badge condition" style={{ position: 'static', display: 'inline-block' }}>{prod.condition}</span>
            <span className="badge" style={{ background: 'rgba(10,16,26,0.7)', border: '1px solid #2a3342', color: 'var(--text)', fontSize: 12, padding: '6px 8px', borderRadius: 999 }}>{status}</span>
          </div>
          <h1 style={{ marginTop: 0, fontSize: 20 }}>{prod.name}</h1>
          <p className="meta" style={{ marginTop: 6, fontSize: 13 }}>{mergedMeta}</p>
          <p className="price" style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>{priceKsh}</p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            <a className="btn btn-primary" target="_blank" rel="noopener noreferrer" href={`https://wa.me/254718176584?text=${encodeURIComponent('Hi, I am interested in ' + prod.name + ' (' + priceKsh + ')')}`}>
              WhatsApp to Buy
            </a>
            <a className="btn" href="tel:+254718176584">Contact Details</a>
          </div>

          <section style={{ marginTop: 10, marginBottom: 8 }}>
            <h3 style={{ margin: '6px 0' }}>Specs</h3>
            <ul style={{ color: 'var(--muted)', paddingLeft: 18, fontSize: 12 }}>
              {String(prod.meta || '')
                .split(/[|,]/)
                .map(s => s.trim())
                .filter(Boolean)
                .map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
            </ul>
          </section>
        </div>
      </article>
    </main>
  )
}
