import { NextResponse } from 'next/server'
import connectDB from '../../../../lib/mongodb'
import Product from '../../../../models/Product'

export async function GET() {
  try {
    await connectDB()
    
    // Fetch all community products
    const products = await Product.find({
      'metadata.source': 'sell-page',
      'metadata.submissionType': 'public'
    }).sort({ createdAt: -1 }).lean()

    // Convert ObjectId to string and format for response
    const formattedProducts = products.map(p => ({
      id: p._id.toString(),
      name: p.name,
      category: p.category,
      price: p.price,
      status: p.status || 'available',
      condition: p.condition || 'Used',
      createdAt: p.createdAt?.toISOString(),
      sellerName: p.metadata?.originalSeller?.name || 'Unknown'
    }))

    return NextResponse.json({
      success: true,
      count: products.length,
      products: formattedProducts
    })

  } catch (error) {
    console.error('Error fetching community products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch community products' },
      { status: 500 }
    )
  }
}
