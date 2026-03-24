import StoreClient from '../components/StoreClient'
import FashionClient from '../components/FashionClient'
import ReusedClient from '../components/ReusedClient'
import SellPageProductsClient from '../components/SellPageProductsClient'
import Link from 'next/link'
import connectDB from '../lib/mongodb'
import Product from '../models/Product'
import HeroRotator from '../components/HeroRotator'
import HeroCartButton from '../components/HeroCartButton'

export default async function Page() {
  let products = []
  try {
    await connectDB()
    const rows = await Product.find({
      category: { $in: ['tv','radio','phone','electronics','accessory','appliances','fridge','cooler'] },
      // Exclude Community Marketplace products - they should only appear in marketplace
      $nor: [
        { 'metadata.source': 'sell-page', 'metadata.submissionType': 'public' }
      ]
    }).sort({ createdAt: -1 })
    
    products = rows.map(r => ({
      id: r._id.toString(),
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
    products = []
  }
  let fashionProducts = []
  try {
    await connectDB()
    const frows = await Product.find({
      category: { $in: ['outfits', 'hoodie', 'shoes', 'sneakers', 'ladies', 'men'] },
      // Exclude Community Marketplace products - they should only appear in marketplace
      $nor: [
        { 'metadata.source': 'sell-page', 'metadata.submissionType': 'public' }
      ]
    }).sort({ createdAt: -1 })
    
    fashionProducts = frows.map(r => ({
      id: r._id.toString(),
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
    fashionProducts = []
  }
  // Pre-owned Products (independent via category isolation)
  let reusedProducts = []
  try {
    await connectDB()
    const rrows = await Product.find({
      category: { $regex: '^preowned', $options: 'i' },
      // Exclude Community Marketplace products
      $nor: [
        { 'metadata.source': 'sell-page', 'metadata.submissionType': 'public' }
      ]
    }).sort({ createdAt: -1 })
    
    reusedProducts = rrows.map(r => ({
      id: r._id.toString(),
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
    reusedProducts = []
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
      images: r.imagesJson ? JSON.parse(r.imagesJson) : (r.images || []),
      meta: r.meta || r.description || '',
      condition: r.condition || 'Used',
      status: r.status || 'available',
      createdAt: r.createdAt.toISOString(),
      metadata: r.metadata
    }))
  } catch (e) {
    console.error('Error fetching community products:', e)
    communityProducts = []
  }
  return (
    <>
      <section className="hero" aria-label="Featured promotions" style={{ position: 'relative' }}>
        <HeroCartButton />
        {/* Background: auto-rotating products from All Products + Fashion + Pre-owned */}
        <HeroRotator products={[...products, ...fashionProducts, ...reusedProducts, ...communityProducts]} intervalMs={10000} />
      </section>


      <main className="container">
        <StoreClient products={products} />

        <FashionClient products={fashionProducts} />

        <ReusedClient products={reusedProducts} />

        <SellPageProductsClient products={communityProducts} />
      </main>
    </>
  )
}
