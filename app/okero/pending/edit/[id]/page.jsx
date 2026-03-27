import { redirect } from 'next/navigation'
import connectDB from '../../../../../lib/mongodb'
import PendingProduct from '../../../../../models/PendingProduct'
import { requireAdmin } from '../../../../../lib/adminAuth'
import EditPendingProductClient from '../../../../../components/EditPendingProductClient'

export const dynamic = 'force-dynamic'

export default async function EditPendingProductPage({ params }) {
  const user = await requireAdmin()
  if (!user) {
    console.log('Admin authentication failed')
    redirect('/okero/login')
  }

  await connectDB()
  
  try {
    const product = await PendingProduct.findById(params.id)
    
    if (!product) {
      console.log('Product not found for ID:', params.id)
      redirect('/okero/pending')
    }

    // Convert ObjectId to string for client component
    const serializedProduct = {
      ...product.toObject(),
      _id: product._id.toString(),
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      reviewedAt: product.reviewedAt ? product.reviewedAt.toISOString() : null
    }

    console.log('Product loaded successfully:', serializedProduct.name)

    return (
      <main className="container" style={{ padding: '32px 8px', maxWidth: '1200px', marginLeft: '2px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ marginTop: 0, marginBottom: 4 }}>✏️ Edit Product Submission</h2>
            <p style={{ margin: 0, color: 'var(--muted)' }}>
              Edit product details before approval and posting
            </p>
          </div>
          <a href="/okero/pending" className="btn">← Back to Submissions</a>
        </div>

        <EditPendingProductClient product={serializedProduct} />
      </main>
    )
  } catch (error) {
    console.error('Error loading product for edit:', error)
    redirect('/okero/pending')
  }
}
