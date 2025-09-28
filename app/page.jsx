import StoreClient from '../components/StoreClient'
import FashionClient from '../components/FashionClient'
import ReusedClient from '../components/ReusedClient'
import { getProducts as getLocalProducts } from '../lib/products'
import { getFashionProducts } from '../lib/fashion'
import Link from 'next/link'
import prisma from '../lib/prisma'
import HeroRotator from '../components/HeroRotator'
import HeroCartButton from '../components/HeroCartButton'

export default async function Page() {
  let products = []
  try {
    const rows = await prisma.product.findMany({
      where: { category: { in: ['tv','radio','phone','electronics','accessory','appliances','fridge','cooler'] } },
      orderBy: { createdAt: 'desc' },
    })
    products = rows.map(r => ({
      id: r.id,
      name: r.name,
      category: r.category,
      price: r.price,
      img: r.img,
      images: r.imagesJson ? JSON.parse(r.imagesJson) : [],
      meta: r.meta || '',
      condition: r.condition || '',
      status: r.status || 'available',
    }))
  } catch (e) {
    // Fallback to local static data (filter to electronics)
    products = getLocalProducts().filter(p => ['tv','radio','phone','electronics','accessory','appliances','fridge','cooler'].includes(p.category))
  }
  let fashionProducts = []
  try {
    const frows = await prisma.product.findMany({
      where: { category: { in: ['outfits', 'hoodie', 'shoes', 'sneakers', 'ladies', 'men'] } },
      orderBy: { createdAt: 'desc' },
    })
    fashionProducts = frows.map(r => ({
      id: r.id,
      name: r.name,
      category: r.category,
      price: r.price,
      img: r.img,
      images: r.imagesJson ? JSON.parse(r.imagesJson) : [],
      meta: r.meta || '',
      condition: r.condition || '',
      status: r.status || 'available',
    }))
  } catch (e) {
    fashionProducts = getFashionProducts()
  }
  // Pre-owned Products (independent via category isolation)
  let reusedProducts = []
  try {
    const rrows = await prisma.product.findMany({
      where: { category: { startsWith: 'preowned' } },
      orderBy: { createdAt: 'desc' },
    })
    reusedProducts = rrows.map(r => ({
      id: r.id,
      name: r.name,
      category: r.category,
      price: r.price,
      img: r.img,
      images: r.imagesJson ? JSON.parse(r.imagesJson) : [],
      meta: r.meta || '',
      condition: r.condition || '',
      status: r.status || 'available',
    }))
  } catch (e) {
    // Fallback to local data if available
    try {
      const local = getLocalProducts()
      reusedProducts = Array.isArray(local) ? local.filter(p => typeof p.category === 'string' && p.category.toLowerCase().startsWith('preowned')) : []
    } catch {}
  }
  return (
    <>
      <section className="hero" aria-label="Featured promotions" style={{ position: 'relative' }}>
        <HeroCartButton />
        {/* Background: auto-rotating products from All Products + Fashion */}
        <HeroRotator products={[...products, ...fashionProducts]} intervalMs={10000} />
      </section>

      {/* Hero Content Section - Only visible on large screens */}
      <section className="hero-content-section" style={{ 
        background: 'linear-gradient(135deg, var(--bg) 0%, #0e1421 100%)', 
        borderBottom: '1px solid #223',
        padding: '40px 0',
        display: 'none'
      }}>
        <div className="container" style={{ textAlign: 'left' }}>
          <h2 style={{ fontSize: 'clamp(18px, 3vw, 32px)', marginBottom: 8, fontWeight: '700' }}>
            Quality Pre‑Owned + New Electronics & Appliances
          </h2>
          <h2 style={{ fontSize: 'clamp(16px, 2.5vw, 28px)', marginBottom: 24, color: 'var(--primary)', fontWeight: '600' }}>
            Outfits, Fashion & Sneakers.
          </h2>
          <p style={{ fontSize: 'clamp(14px, 1.5vw, 18px)', color: 'var(--muted)', marginBottom: 32, maxWidth: '600px', margin: '0 0 32px 0' }}>
            Save money. Reduce waste. Buy dependable, refurbished items with warranty.
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
            <Link href="/#collection" className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '16px' }}>
              Browse Products
            </Link>
            <Link href="/sell" className="btn" style={{ padding: '12px 24px', fontSize: '16px' }}>
              Want to Sell Product
            </Link>
          </div>
        </div>
      </section>

      <main className="container">
        <StoreClient products={products} />

        <FashionClient products={fashionProducts} />

        <ReusedClient products={reusedProducts} />

        <section id="about" className="info-section">
          <h3>About Super Twice Resellers</h3>
          <p>We source, test, and refurbish pre‑owned electronics and appliances. Every item is thoroughly inspected and comes with a 30‑day limited warranty.</p>
          <ul>
            <li>Environmentally responsible reuse</li>
            <li>Budget‑friendly pricing</li>
            <li>Local pickup or affordable delivery</li>
          </ul>
        </section>

        <section id="contact" className="info-section">
          <h3>Contact Us</h3>
          <p>Email: <a href="mailto:sales@supertwiceresellers.com">sales@supertwiceresellers.com</a></p> 
          <p>Phone: <a href="tel:+254718176584">+254718176584</a></p>
        </section>
      </main>
    </>
  )
}
