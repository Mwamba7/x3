import connectDB from '../../../../lib/mongodb'
import Product from '../../../../models/Product'

export async function GET() {
  try {
    await connectDB()
    
    // Get all products
    const allProducts = await Product.find({}).lean()
    
    // Get products by category
    const collectionProducts = await Product.find({
      category: { $in: ['tv','radio','phone','electronics','accessory','appliances','fridge','cooler'] },
      $nor: [
        { 'metadata.source': 'sell-page', 'metadata.submissionType': 'public' }
      ]
    }).lean()
    
    const fashionProducts = await Product.find({
      category: { $in: ['outfits', 'hoodie', 'shoes', 'sneakers', 'ladies', 'men'] },
      $nor: [
        { 'metadata.source': 'sell-page', 'metadata.submissionType': 'public' }
      ]
    }).lean()
    
    const preownedProducts = await Product.find({
      category: { $regex: '^preowned', $options: 'i' },
      $nor: [
        { 'metadata.source': 'sell-page', 'metadata.submissionType': 'public' }
      ]
    }).lean()
    
    const communityProducts = await Product.find({
      'metadata.source': 'sell-page',
      'metadata.submissionType': 'public',
      status: 'available'
    }).lean()
    
    return Response.json({
      success: true,
      counts: {
        total: allProducts.length,
        collection: collectionProducts.length,
        fashion: fashionProducts.length,
        preowned: preownedProducts.length,
        community: communityProducts.length
      },
      allProducts: allProducts.map(p => ({
        id: p._id.toString(),
        name: p.name,
        category: p.category,
        price: p.price,
        status: p.status,
        metadata: p.metadata
      })),
      collectionProducts: collectionProducts.map(p => ({
        id: p._id.toString(),
        name: p.name,
        category: p.category,
        price: p.price,
        status: p.status
      }))
    })
  } catch (error) {
    console.error('Debug API Error:', error)
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
