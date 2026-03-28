import ReusedClient from '../components/ReusedClient'
import SellPageProductsClient from '../components/SellPageProductsClient'
import Link from 'next/link'
import connectDB from '../lib/mongodb'
import Product from '../models/Product'
import HeroRotator from '../components/HeroRotator'
import HeroCartButton from '../components/HeroCartButton'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Page() {
  // Pre-owned Products (independent via section field)
  let reusedProducts = []
  try {
    await connectDB()
    const rrows = await Product.find({
      section: 'preowned',
      status: 'available'
    }).sort({ createdAt: -1 })
    
    reusedProducts = rrows.map(r => ({
      id: r._id.toString(),
      name: r.name,
      category: r.category,
      price: r.price,
      img: r.img,
      images: r.images || [], // Use images array instead of imagesJson
      meta: r.meta || '',
      condition: r.condition || '',
      status: r.status || 'available',
    }))
  } catch (e) {
    console.log('❌ Database connection failed for Pre-owned, using mock data:', e.message)
    // Fallback mock data for Pre-owned section
    reusedProducts = [
      {
        id: 'mock3',
        name: 'iPhone 12 Pro',
        category: 'phone',
        price: 45000,
        img: 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=400',
        images: ['https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=400'],
        meta: 'iPhone, 5G, Pro',
        condition: 'good',
        status: 'available',
      }
    ]
  }

  // Community Marketplace Products (approved from sell page)
  let communityProducts = []
  try {
    await connectDB()
    const crows = await Product.find({
      'metadata.source': 'sell-page',
      'metadata.submissionType': 'public',
      status: 'available'
    }).sort({ createdAt: -1 }).limit(12)
    
    communityProducts = crows.map(r => ({
      id: r._id.toString(),
      name: r.name,
      category: r.category,
      price: r.price,
      img: r.img,
      images: r.images || [], // Use images array instead of imagesJson
      meta: r.meta || r.description || '',
      condition: r.condition || 'Used',
      status: r.status || 'available',
      createdAt: r.createdAt.toISOString(),
      metadata: r.metadata
    }))
  } catch (e) {
    console.log('❌ Database connection failed for Community Marketplace, using mock data:', e.message)
    // Fallback mock data for Community Marketplace section
    communityProducts = [
      {
        id: 'mock4',
        name: 'Laptop Stand',
        category: 'accessory',
        price: 2500,
        img: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400',
        images: ['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400'],
        meta: 'Laptop Stand, Aluminum',
        condition: 'excellent',
        status: 'available',
        createdAt: new Date().toISOString(),
        metadata: { source: 'sell-page', submissionType: 'public' }
      }
    ]
  }
  return (
    <>
      <section className="hero" aria-label="Featured promotions" style={{ position: 'relative' }}>
        <HeroCartButton />
        {/* Background: auto-rotating products from Pre-owned + Community */}
        <HeroRotator products={[...reusedProducts, ...communityProducts]} intervalMs={10000} />
      </section>

      <main className="container">
        <section id="preowned">
          <ReusedClient products={reusedProducts} />
        </section>

        <section id="marketplace">
          <SellPageProductsClient products={communityProducts} />
        </section>
      </main>
    </>
  )
}
