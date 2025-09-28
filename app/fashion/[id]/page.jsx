import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getFashionProducts } from '../../../lib/fashion'
import prisma from '../../../lib/prisma'
import ProductGallery from '../../../components/ProductGallery'
import ProductActions from '../../../components/ProductActions'

export const dynamic = 'force-dynamic'

export async function generateStaticParams() {
  // Keep any local static fashion items, DB items will be handled dynamically
  const products = getFashionProducts()
  return products.map(p => ({ id: p.id }))
}

export async function generateMetadata({ params }) {
  // Try DB first
  try {
    const row = await prisma.product.findUnique({ where: { id: params.id } })
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
    const products = getFashionProducts()
    prod = products.find(p => p.id === params.id)
  }
  if (!prod) return notFound()
  const images = (prod.images && prod.images.length ? prod.images : [prod.img])
  const priceKsh = `Ksh ${Number(prod.price).toLocaleString('en-KE')}`
  const isSold = String(prod.status || '').toLowerCase() === 'sold'
  const status = isSold ? 'Sold' : 'Available'

  return (
    <main className="container" style={{ paddingTop: '0' }}>
      <article className="product-detail" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginTop: '0' }}>
        <ProductGallery images={images} name={prod.name} />
        <div className="info product-info-grid" style={{ background: 'var(--card)', border: '1px solid #253049', borderRadius: 8, padding: 8, marginBottom: 12 }}>
            
            {/* Title */}
            <div style={{ marginBottom: '8px' }}>
              <h1 className="product-title">{prod.name}</h1>
            </div>

            {/* Subtitle/Meta */}
            <ul className="detail-meta-grid">
              {String(prod.meta || '').split(/[|,]/).map(s => s.trim()).filter(Boolean).map((spec, i) => (
                <li key={i} className="detail-meta-item">
                  <svg className="icon" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  <span>{spec}</span>
                </li>
              ))}
            </ul>

            {/* Price */}
            <div className="price">{priceKsh}</div>

            {/* Action Buttons */}
            <div className="actions" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <ProductActions product={prod} />
              <a className="btn btn-small" href="/contact">Contact Details</a>
              <Link className="btn btn-small" href="/" style={{ marginLeft: 'auto', fontSize: '12px', padding: '8px 10px' }}>← Back to products</Link>
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
