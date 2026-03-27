import connectDB from '../../../../lib/mongodb.js'
import Product from '../../../../models/Product.js'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    await connectDB()
    
    // Get only Pre-owned section products
    const items = await Product.find({ 
      section: 'preowned',
      status: 'available'
    }).sort({ createdAt: -1 })
    
    return NextResponse.json(items)
  } catch (e) {
    console.error('GET /api/products/preowned error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    await connectDB()
    const body = await req.json()
    
    const { name, category, price, img, images = [], meta = '', condition = '', status = 'available', adminContact = '', deliveryFees } = body
    
    if (!name || !category || img == null || img.trim() === '') {
      return NextResponse.json({ error: 'Missing required fields (name, category, img).' }, { status: 400 })
    }
    
    const priceNum = Number(price)
    if (!Number.isFinite(priceNum) || !Number.isInteger(priceNum) || priceNum < 0) {
      return NextResponse.json({ error: 'Price must be a non-negative integer.' }, { status: 400 })
    }
    
    const imagesArr = Array.isArray(images) ? images.filter(Boolean) : []
    
    const created = await Product.create({
      name, 
      category, 
      section: 'preowned', // Explicitly set section
      price: priceNum, 
      img, 
      imagesJson: JSON.stringify(imagesArr), 
      meta, 
      condition, 
      status,
      adminContact,
      deliveryFees
    })
    
    return NextResponse.json(created, { status: 201 })
  } catch (e) {
    console.error('POST /api/products/preowned error:', e)
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}
