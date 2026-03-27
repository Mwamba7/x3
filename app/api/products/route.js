import connectDB from '../../../lib/mongodb'
import Product from '../../../models/Product'
import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../lib/adminAuth'

// Mock products data for testing when database is not available
const mockProducts = [
  {
    _id: 'mock1',
    id: 'mock1',
    name: 'Sony 55" 4K Smart TV',
    category: 'tv',
    price: 19000,
    img: 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=400',
    images: ['https://images.unsplash.com/photo-1590736969955-71cc94901144?w=400'],
    condition: 'good',
    status: 'available',
    description: '55-inch 4K Ultra HD Smart TV\nHDR support\nSmart TV features\nMultiple HDMI ports\nUSB connectivity\nBuilt-in WiFi',
    meta: 'Smart TV, 4K, HDR',
    section: 'collection'
  },
  {
    _id: 'mock2',
    id: 'mock2',
    name: 'Samsung Sound System',
    category: 'radio',
    price: 15000,
    img: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400',
    images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400'],
    condition: 'excellent',
    status: 'available',
    description: 'Powerful sound system\nBluetooth connectivity\nMultiple audio inputs\nRemote control included\nWall mountable',
    meta: 'Sound System, Bluetooth',
    section: 'collection'
  },
  {
    _id: 'mock3',
    id: 'mock3',
    name: 'iPhone 12 Pro',
    category: 'phone',
    price: 45000,
    img: 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=400',
    images: ['https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=400'],
    condition: 'good',
    status: 'available',
    description: 'iPhone 12 Pro 128GB\nA14 Bionic chip\nTriple camera system\n5G capable\nFace ID',
    meta: 'iPhone, 5G, Pro',
    section: 'preowned'
  },
  {
    _id: 'mock4',
    id: 'mock4',
    name: 'Laptop Stand',
    category: 'accessory',
    price: 2500,
    img: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400',
    images: ['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400'],
    condition: 'excellent',
    status: 'available',
    description: 'Adjustable laptop stand\nAluminum construction\nErgonomic design\nPortable and lightweight',
    meta: 'Laptop Stand, Aluminum',
    section: 'marketplace'
  }
]

export async function GET() {
  try {
    await connectDB()
    // Fetch products from collection section OR products without section (backward compatibility)
    const items = await Product.find({ 
      $or: [
        { section: 'collection' },
        { section: { $exists: false } },
        { section: null }
      ]
    }).sort({ createdAt: -1 })
    return NextResponse.json(items)
  } catch (e) {
    console.error('❌ Database connection failed, using mock data:', e.message)
    // Return mock data as fallback when database is not available
    return NextResponse.json({ 
      products: mockProducts,
      note: 'Using mock data due to database connection issues'
    })
  }
}

export async function POST(req) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const { name, category, price, img, images = [], meta = '', condition = '', status = 'available', adminContact = '', deliveryFees } = body
    if (!name || !category || img == null || img.trim() === '') {
      return NextResponse.json({ error: 'Missing required fields (name, category, img).' }, { status: 400 })
    }
    const priceNum = Number(price)
    if (!Number.isFinite(priceNum) || !Number.isInteger(priceNum) || priceNum < 0) {
      return NextResponse.json({ error: 'Price must be a non-negative integer.' }, { status: 400 })
    }
    const imagesArr = Array.isArray(images)
      ? images.filter(Boolean)
      : []
    await connectDB()
    const created = await Product.create({
      name, 
      category, 
      section: 'collection', // Explicitly set section for new products
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
    console.error('POST /api/products error:', e)
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}
