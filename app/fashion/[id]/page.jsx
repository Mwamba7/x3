import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getFashionProducts } from '../../../lib/fashion'
import prisma from '../../../lib/prisma'
import ProductGallery from '../../../components/ProductGallery'

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
        title: `${row.name} — Think Twice Resellers`,
        description: row.meta || '',
        openGraph: {
          title: `${row.name} — Think Twice Resellers`,
          description: row.meta || '',
          images: [row.img],
        },
      }
    }
  } catch {}
  const products = getFashionProducts()
  const prod = products.find(p => p.id === params.id)
  if (!prod) return { title: 'Item not found — Think Twice Resellers' }
  return {
    title: `${prod.name} — Think Twice Resellers`,
    description: prod.meta,
    openGraph: {
      title: `${prod.name} — Think Twice Resellers`,
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
          <p className="meta" style={{ marginTop: 6, fontSize: 13 }}>{prod.meta}</p>
          <p className="price" style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>{priceKsh}</p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            <a className="btn btn-primary" target="_blank" rel="noopener noreferrer" href={`https://wa.me/254718176584?text=${encodeURIComponent('Hi, I am interested in ' + prod.name + ' (' + priceKsh + ')')}`}>WhatsApp to Buy</a>
            <a className="btn" href={`mailto:sales@thinktwiceresellers.com?subject=Interested in ${encodeURIComponent(prod.name)}&body=Hi,%0D%0AI'm interested in ${encodeURIComponent(prod.name)} priced at ${encodeURIComponent(priceKsh)}.`}>Email</a>
            <a className="btn" href="/contact">Contact Details</a>
          </div>

          <section style={{ marginTop: 10, marginBottom: 8 }}>
            <h3 style={{ margin: '6px 0' }}>Details</h3>
            <ul style={{ color: 'var(--muted)', paddingLeft: 18 }}>
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
