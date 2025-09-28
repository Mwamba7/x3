import Link from 'next/link'
import prisma from '../../../lib/prisma'
import ProductGallery from '../../../components/ProductGallery'
import { getProducts } from '../../../lib/products'
import ProductActions from '../../../components/ProductActions'

export async function generateMetadata({ params }) {
  try {
    const slide = await prisma.heroSlide.findUnique({ where: { id: params.id } })
    if (!slide) return { title: 'Promotion not found — Super Twice Resellers' }
    return {
      title: `${slide.title || 'Promotion'} — Super Twice Resellers`,
      description: slide.subtitle || 'Promotion details',
      openGraph: {
        title: slide.title || 'Promotion',
        description: slide.subtitle || 'Promotion details',
        images: [slide.imageUrl].filter(Boolean),
      },
    }
  } catch {
    return { title: 'Promotion — Super Twice Resellers' }
  }
}

export default async function PromoPage({ params }) {
  // Load the slide
  const slide = await prisma.heroSlide.findUnique({ where: { id: params.id } })
  if (!slide) {
    return (
      <main className="container" style={{ padding: '24px 0' }}>
        <h2>Promotion not found</h2>
        <p className="meta">The promotion you are looking for does not exist or has been removed.</p>
        <div style={{ marginTop: 16 }}>
          <Link className="btn" href="/" style={{ fontSize: '12px', padding: '8px 10px' }}>← Back to products</Link>
        </div>
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
  const emailHref = `mailto:sales@supertwiceresellers.com?subject=${encodeURIComponent('Interested in ' + name)}&body=${encodeURIComponent('Hi,%0D%0AI\'m interested in ' + name + (priceKsh ? ' priced at ' + priceKsh : '') + '.')}`

  // Fallback products for static params
  // This page is dynamic, but we can still provide ProductGallery component
  return (
    <main className="container promo-page" style={{ padding: '0' }}>

      <article className="product-detail" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
        <ProductGallery images={gallery} name={name} />
        <div className="info" style={{ background: 'var(--card)', border: '1px solid #253049', borderRadius: 8, padding: 8 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
            {product?.condition ? (
              <span className="badge condition" style={{ position: 'static', display: 'inline-block' }}>{product.condition}</span>
            ) : null}
            {status ? (
              <span className="badge" style={{ background: 'rgba(10,16,26,0.7)', border: '1px solid #2a3342', color: 'var(--text)', fontSize: 12, padding: '6px 8px', borderRadius: 999 }}>{status}</span>
            ) : null}
          </div>
          <h1 style={{ marginTop: 0, fontSize: 20, textAlign: 'left' }}>{name}</h1>
          {metaText ? <p className="meta" style={{ marginTop: 6, fontSize: 13 }}>{metaText}</p> : null}
          {priceKsh ? <p className="price" style={{ fontSize: 15, fontWeight: 800, color: 'var(--primary)' }}>{priceKsh}</p> : null}

          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            <a className="btn btn-primary" target="_blank" rel="noopener noreferrer" href={whatsappHref}>WhatsApp to Buy</a>
            <a className="btn" href="#contact">Contact Details</a>
            {product?.id ? <Link className="btn" href={`/product/${product.id}`}>View Product Page</Link> : null}
            <Link className="btn" href="/" style={{ marginLeft: 'auto', fontSize: '12px', padding: '8px 10px' }}>← Back to products</Link>
          </div>

          {product ? (
            <div style={{ marginTop: 8 }}>
              <ProductActions product={product} />
            </div>
          ) : null}

          {metaText ? (
            <section style={{ marginTop: 8, marginBottom: 6 }}>
              <h3 style={{ margin: '6px 0' }}>Specs</h3>
              <ul className="detail-meta-grid">
                {String(metaText)
                  .split(/[|,]/)
                  .map(s => s.trim())
                  .filter(Boolean)
                  .map((s, i) => (
                    <li key={i} className="detail-meta-item">
                      <svg className="icon" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      <span>{s}</span>
                    </li>
                  ))}
              </ul>
            </section>
          ) : null}
        </div>
      </article>

      {/* More Photos & Specifications (bottom section) */}
      <section style={{ marginTop: 16 }}>
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
            <ul className="detail-meta-grid">
              {String(metaText)
                .split(/[|,]/)
                .map(s => s.trim())
                .filter(Boolean)
                .map((s, i) => (
                  <li key={i} className="detail-meta-item">
                    <svg className="icon" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    <span>{s}</span>
                  </li>
                ))}
            </ul>
          </div>
        ) : null}
      </section>
    </main>
  )
}
