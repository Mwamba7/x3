import connectDB from '../../../lib/mongodb'
import Product from '../../../models/Product'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    await connectDB()
    // Get unique categories from products
    const categories = await Product.distinct('category')
    
    // Format as expected by the frontend
    const formattedCategories = categories.map(cat => ({
      id: cat,
      label: cat.charAt(0).toUpperCase() + cat.slice(1),
      value: cat
    }))
    
    return NextResponse.json(formattedCategories)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
