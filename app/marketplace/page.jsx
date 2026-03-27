import StoreClient from '../../components/StoreClient'
import FashionClient from '../../components/FashionClient'
import connectDB from '../../lib/mongodb'
import Product from '../../models/Product'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function MarketplacePage() {
  let products = []
  let fashionProducts = []
  
  try {
    await connectDB()
    
    // Get Community Marketplace electronics products
    const rows = await Product.find({
      category: { $in: ['tv','radio','phone','electronics','accessory','appliances','fridge','cooler'] },
      section: 'marketplace', // Only marketplace section products
      // Only Community Marketplace products
      'metadata.source': 'sell-page',
      'metadata.submissionType': 'public',
      // Exclude products that are in other sections
      $nor: [
        { section: 'fashion' },
        { section: 'preowned' },
        { section: 'collection' }
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

    // Get Community Marketplace fashion products
    const frows = await Product.find({
      category: { $in: ['outfits', 'hoodie', 'shoes', 'sneakers', 'ladies', 'men'] },
      section: 'marketplace', // Only marketplace section products
      // Only Community Marketplace products
      'metadata.source': 'sell-page',
      'metadata.submissionType': 'public',
      // Exclude products that are in other sections
      $nor: [
        { section: 'fashion' },
        { section: 'preowned' },
        { section: 'collection' }
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
    console.error('Error fetching marketplace products:', e)
  }

  return (
    <>
      <main className="container" style={{ padding: '24px 0' }}>
        <header style={{ marginBottom: 32, textAlign: 'center' }}>
          <h1 style={{ marginTop: 0, marginBottom: 12, fontSize: 28, fontWeight: '700' }}>
            🏪 Community Marketplace
          </h1>
          <p style={{ 
            margin: '0 auto', 
            fontSize: 16, 
            lineHeight: 1.6, 
            color: '#666',
            maxWidth: '600px'
          }}>
            Discover unique products from our community members. All items are verified and approved by our team.
          </p>
          <div style={{
            marginTop: '16px',
            padding: '12px 20px',
            backgroundColor: '#e0f2fe',
            borderRadius: '8px',
            border: '1px solid #0284c7',
            display: 'inline-block'
          }}>
            <span style={{ fontSize: '14px', color: '#0369a1', fontWeight: '600' }}>
              💡 Want to sell your items? <Link href="/sell" style={{ color: '#0369a1', textDecoration: 'underline' }}>Submit your product</Link>
            </span>
          </div>
        </header>

        {/* Electronics Section */}
        {products.length > 0 && (
          <section id="electronics" style={{ marginBottom: 48 }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: 24 
            }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: '600' }}>
                📱 Electronics & Appliances
              </h2>
              <span style={{ 
                fontSize: '14px', 
                color: '#666',
                backgroundColor: '#f3f4f6',
                padding: '4px 12px',
                borderRadius: '12px'
              }}>
                {products.length} items
              </span>
            </div>
            <StoreClient initial={products} />
          </section>
        )}

        {/* Fashion Section */}
        {fashionProducts.length > 0 && (
          <section id="fashion" style={{ marginBottom: 48 }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: 24 
            }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: '600' }}>
                👕 Fashion & Accessories
              </h2>
              <span style={{ 
                fontSize: '14px', 
                color: '#666',
                backgroundColor: '#f3f4f6',
                padding: '4px 12px',
                borderRadius: '12px'
              }}>
                {fashionProducts.length} items
              </span>
            </div>
            <FashionClient initial={fashionProducts} />
          </section>
        )}

        {/* Empty State */}
        {products.length === 0 && fashionProducts.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            backgroundColor: '#f9fafb',
            borderRadius: '12px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏪</div>
            <h3 style={{ marginBottom: '12px', fontSize: '18px', color: '#374151' }}>
              No Community Products Yet
            </h3>
            <p style={{ 
              margin: '0 0 24px 0', 
              fontSize: '14px', 
              color: '#6b7280',
              maxWidth: '400px',
              marginLeft: 'auto',
              marginRight: 'auto'
            }}>
              Be the first to contribute to our community marketplace! Submit your products and help build our community.
            </p>
            <Link 
              href="/sell"
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                backgroundColor: '#3b82f6',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Submit Your Product
            </Link>
          </div>
        )}
      </main>
    </>
  )
}
