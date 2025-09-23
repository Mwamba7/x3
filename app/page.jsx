import StoreClient from '../components/StoreClient'
import FashionClient from '../components/FashionClient'
import ReusedClient from '../components/ReusedClient'
import { getProducts as getLocalProducts } from '../lib/products'
import { getFashionProducts } from '../lib/fashion'
import Link from 'next/link'
import prisma from '../lib/prisma'
import HeroRotator from '../components/HeroRotator'

export default async function Page() {
  let products = []
  try {
    const rows = await prisma.product.findMany({
      where: { category: { in: ['tv','radio','phone','fridge','cooler','accessory'] } },
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
    products = getLocalProducts().filter(p => ['tv','radio','phone','fridge','cooler','accessory'].includes(p.category))
  }
  let fashionProducts = []
  try {
    const frows = await prisma.product.findMany({
      where: { category: { in: ['hoodie', 'shoes', 'sneakers'] } },
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
      <section className="hero" aria-label="Featured promotions">
        {/* Background: auto-rotating products from All Products + Fashion */}
        <HeroRotator products={[...products, ...fashionProducts]} intervalMs={10000} />
        <div className="hero-overlay">
          <div className="container hero-content" style={{ paddingTop: 58 }}>
            {/* Animated wave text for the heading */}
            <h2 style={{ fontSize: 'clamp(14.6px, 2vw, 28px)', marginBottom: 6 }} aria-label="Quality Pre‑Owned + New Electronics & Appliances">
              {'Quality Pre‑Owned + New Electronics & Appliances'.split('').map((ch, i) => (
                <span
                  key={i}
                  style={{
                    display: 'inline-block',
                    animation: 'wave 1.8s ease-in-out infinite',
                    animationDelay: `${i * 0.05}s`,
                    willChange: 'transform',
                  }}
                >
                  {ch === ' ' ? '\u00A0' : ch}
                </span>
              ))}
            </h2>
            <style>{`@keyframes wave { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }`}</style>
            <h2 style={{ fontSize: 'clamp(14px, 2.4vw, 28px)', marginBottom: 26 }}>Outfits + Fasion, Hoodies, Shoes & Sneakers.</h2>
            <p>Save money. Reduce waste. Buy dependable, refurbished items with warranty.</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link href="/#collection" className="btn btn-primary">Browse Products</Link>
              <Link href="/sell" className="btn">Want to Sell Product</Link>
            </div>
          </div>
        </div>
      </section>

      <main className="container">
        <StoreClient products={products} />

        <FashionClient products={fashionProducts} />

        <ReusedClient products={reusedProducts} />

        <section id="about" className="info-section">
          <h3>About Think Twice Resellers</h3>
          <p>We source, test, and refurbish pre‑owned electronics and appliances. Every item is thoroughly inspected and comes with a 30‑day limited warranty.</p>
          <ul>
            <li>Environmentally responsible reuse</li>
            <li>Budget‑friendly pricing</li>
            <li>Local pickup or affordable delivery</li>
          </ul>
        </section>

        <section id="contact" className="info-section">
          <h3>Contact Us</h3>
          <p>Email: <a href="mailto:sales@thinktwiceresellers.com">sales@thinktwiceresellers.com</a></p> 
          <p>Phone: <a href="tel:+254718176584">+254718176584</a></p>
        </section>
      </main>
    </>
  )
}
