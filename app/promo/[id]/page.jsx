import Link from 'next/link'
import prisma from '../../../lib/prisma'
import ProductGallery from '../../../components/ProductGallery'
import { getProducts } from '../../../lib/products'

export async function generateMetadata({ params }) {
  try {
    const slide = await prisma.heroSlide.findUnique({ where: { id: params.id } })
    if (!slide) return { title: 'Promotion not found — Think Twice Resellers' }
    return {
      title: `${slide.title || 'Promotion'} — Think Twice Resellers`,
      description: slide.subtitle || 'Promotion details',
      openGraph: {
        title: slide.title || 'Promotion',
        description: slide.subtitle || 'Promotion details',
        images: [slide.imageUrl].filter(Boolean),
      },
    }
  } catch {
    return { title: 'Promotion — Think Twice Resellers' }
  }
}

export default async function PromoPage({ params }) {
  // Load the slide
  const slide = await prisma.heroSlide.findUnique({ where: { id: params.id } })
  if (!slide) {
    return (
      <main className="container" style={{ padding: '24px 0' }}>
        <nav style={{ marginBottom: 12 }}>
          <Link className="btn" href="/">← Back to home</Link>
        </nav>
        <h2>Promotion not found</h2>
        <p className="meta">The promotion you are looking for does not exist or has been removed.</p>
      </main>
    )
  }

  // If slide links to a product, try fetch full product for specs/gallery
  let product = null
  if (slide.productId) {
    try {
      const row = await prisma.product.findUnique({ where: { id: slide.productId } })
      if (row) {
        product = {
          id: row.id,
          name: row.name,
          category: row.category,
          price: row.price,
          img: row.img,
          images: row.imagesJson ? JSON.parse(row.imagesJson) : [],
          meta: row.meta || '',
          condition: row.condition || '',
          status: row.status || 'available',
        }
      }
    } catch {}
  }

  // Build gallery: merge slide gallery + cover with product gallery, de-duplicate (slide images first)
  let slideGallery = []
  try {
    slideGallery = slide.galleryJson ? JSON.parse(slide.galleryJson) : []
  } catch {
    slideGallery = []
  }
  if (!Array.isArray(slideGallery)) slideGallery = []
  if (slide.imageUrl) slideGallery = [slide.imageUrl, ...slideGallery]
  const productImages = product ? ((product.images && product.images.length ? product.images : (product.img ? [product.img] : []))) : []
  const gallery = Array.from(new Set([...(slideGallery || []), ...productImages]))

  const name = slide.title || (product?.name || 'Promotion')
  const metaText = [slide.subtitle || '', product?.meta || ''].filter(Boolean).join(' | ')
  const price = (slide.price != null ? slide.price : product?.price)
  const priceKsh = price != null ? `Ksh ${Number(price).toLocaleString('en-KE')}` : null
  const status = product ? (product.status === 'sold' ? 'Sold' : 'Available') : null

  const whatsappHref = `https://wa.me/254718176584?text=${encodeURIComponent('Hi, I am interested in ' + name + (priceKsh ? ' (' + priceKsh + ')' : ''))}`
  const emailHref = `mailto:sales@thinktwiceresellers.com?subject=${encodeURIComponent('Interested in ' + name)}&body=${encodeURIComponent('Hi,%0D%0AI\'m interested in ' + name + (priceKsh ? ' priced at ' + priceKsh : '') + '.')}`

  // Fallback products for static params
  // This page is dynamic, but we can still provide ProductGallery component
  return (
    <main className="container" style={{ padding: '24px 0' }}>
      <nav style={{ marginBottom: 12 }}>
        <Link className="btn" href="/">← Back to home</Link>
        {product?.id ? <Link className="btn" style={{ marginLeft: 8 }} href={`/product/${product.id}`}>View Product Page</Link> : null}
      </nav>

      <article className="product-detail" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
        <ProductGallery images={gallery} name={name} />
        <div className="info" style={{ background: 'var(--card)', border: '1px solid #253049', borderRadius: 14, padding: 16 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
            {product?.condition ? (
              <span className="badge condition" style={{ position: 'static', display: 'inline-block' }}>{product.condition}</span>
            ) : null}
            {status ? (
              <span className="badge" style={{ background: 'rgba(10,16,26,0.7)', border: '1px solid #2a3342', color: 'var(--text)', fontSize: 12, padding: '6px 8px', borderRadius: 999 }}>{status}</span>
            ) : null}
          </div>
          <h1 style={{ marginTop: 0, fontSize: 20 }}>{name}</h1>
          {metaText ? <p className="meta" style={{ marginTop: 6, fontSize: 13 }}>{metaText}</p> : null}
          {priceKsh ? <p className="price" style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>{priceKsh}</p> : null}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            <a className="btn btn-primary" target="_blank" rel="noopener noreferrer" href={whatsappHref}>WhatsApp to Buy</a>
            <a className="btn" href={emailHref}>Email</a>
            <a className="btn" href="#contact">Contact Details</a>
          </div>

          {metaText ? (
            <section style={{ marginTop: 10, marginBottom: 8 }}>
              <h3 style={{ margin: '6px 0' }}>Specs</h3>
              <ul style={{ color: 'var(--muted)', paddingLeft: 18 }}>
                {String(metaText)
                  .split(/[|,]/)
                  .map(s => s.trim())
                  .filter(Boolean)
                  .map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
              </ul>
            </section>
          ) : null}
        </div>
      </article>

      {/* More Photos & Specifications (bottom section) */}
      <section style={{ marginTop: 24 }}>
        {gallery?.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <h3 style={{ margin: '0 0 8px' }}>More Photos</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
              {gallery.map((src, i) => (
                <a key={i} href={src} target="_blank" rel="noreferrer" style={{ display: 'block', borderRadius: 10, overflow: 'hidden', border: '1px solid #253049' }}>
                  <img src={src} alt={`${name} ${i+1}`} style={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }} />
                </a>
              ))}
            </div>
          </div>
        )}

        {metaText ? (
          <div>
            <h3 style={{ margin: '0 0 8px' }}>Specifications</h3>
            <ul style={{ color: 'var(--muted)', paddingLeft: 18, margin: 0 }}>
              {String(metaText)
                .split(/[|,]/)
                .map(s => s.trim())
                .filter(Boolean)
                .map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
            </ul>
          </div>
        ) : null}
      </section>
    </main>
  )
}
