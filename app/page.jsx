import StoreClient from '../components/StoreClient'
import FashionClient from '../components/FashionClient'
import { getProducts as getLocalProducts } from '../lib/products'
import { getFashionProducts } from '../lib/fashion'
import Link from 'next/link'
import prisma from '../lib/prisma'

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
  return (
    <>
      <section className="hero" aria-label="Featured video">
        <video className="hero-video" autoPlay muted loop playsInline poster="https://images.unsplash.com/photo-1517059224940-d4af9eec41e5?q=80&w=1600&auto=format&fit=crop">
          <source src="https://cdn.coverr.co/videos/coverr-electronics-circuit-board-3429/1080p.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="hero-overlay">
          <div className="container hero-content">
            <h2>Quality Pre‑Owned Electronics & Appliances</h2>
            <p>Save money. Reduce waste. Buy dependable, refurbished items with warranty.</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link href="/#all-products" className="btn btn-primary">Browse Products</Link>
              <Link href="/sell" className="btn">Sell Products</Link>
            </div>
          </div>
        </div>
      </section>

      <main className="container">
        <StoreClient products={products} />

        <FashionClient products={fashionProducts} />

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
          <p>Phone: +254718176584</p>
        </section>
      </main>
    </>
  )
}
