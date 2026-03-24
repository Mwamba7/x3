import { NextResponse } from 'next/server'
import connectDB from '../../../lib/mongodb'
import Product from '../../../models/Product'
import User from '../../../models/User'
import bcrypt from 'bcryptjs'

const IS_PROD = process.env.NODE_ENV === 'production'

const sampleProducts = [
  // Electronics/Collection Products
  {
    name: "Samsung Galaxy S23 Ultra",
    category: "phone",
    price: 85000,
    img: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400",
    imagesJson: JSON.stringify([
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400",
      "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=400"
    ]),
    meta: "5G | 256GB Storage | 200MP Camera | S Pen | Excellent condition",
    condition: "excellent",
    status: "available"
  },
  {
    name: "Sony 55\" 4K Smart TV",
    category: "tv",
    price: 65000,
    img: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400",
    imagesJson: JSON.stringify([
      "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400"
    ]),
    meta: "4K HDR | Android TV | Voice Remote | Perfect for streaming",
    condition: "good",
    status: "available"
  },
  {
    name: "MacBook Pro M2",
    category: "electronics",
    price: 120000,
    img: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400",
    imagesJson: JSON.stringify([
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400"
    ]),
    meta: "M2 Chip | 16GB RAM | 512GB SSD | 13-inch Retina Display",
    condition: "excellent",
    status: "available"
  },
  {
    name: "Samsung Double Door Fridge",
    category: "fridge",
    price: 45000,
    img: "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400",
    imagesJson: JSON.stringify([
      "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400"
    ]),
    meta: "300L Capacity | Energy Efficient | Digital Display | Frost Free",
    condition: "good",
    status: "available"
  },
  {
    name: "JBL Bluetooth Speaker",
    category: "radio",
    price: 8500,
    img: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400",
    imagesJson: JSON.stringify([
      "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400"
    ]),
    meta: "Wireless | 20W Output | 12 Hour Battery | Waterproof",
    condition: "excellent",
    status: "available"
  },
  
  // Fashion Products
  {
    name: "Nike Air Jordan 1",
    category: "sneakers",
    price: 12000,
    img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
    imagesJson: JSON.stringify([
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400"
    ]),
    meta: "Size 42 | Leather Upper | Classic Design | Comfortable fit",
    condition: "good",
    status: "available"
  },
  {
    name: "Adidas Hoodie",
    category: "hoodie",
    price: 4500,
    img: "https://images.unsplash.com/photo-1556821840-3a9fbc86339e?w=400",
    imagesJson: JSON.stringify([
      "https://images.unsplash.com/photo-1556821840-3a9fbc86339e?w=400"
    ]),
    meta: "Size L | Cotton Blend | Front Pocket | Drawstring Hood",
    condition: "excellent",
    status: "available"
  },
  {
    name: "Vintage Denim Jacket",
    category: "outfits",
    price: 3500,
    img: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400",
    imagesJson: JSON.stringify([
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400"
    ]),
    meta: "Size M | Classic Blue | Button Front | Chest Pockets",
    condition: "good",
    status: "available"
  },
  {
    name: "Leather Boots",
    category: "shoes",
    price: 7500,
    img: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400",
    imagesJson: JSON.stringify([
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400"
    ]),
    meta: "Size 41 | Genuine Leather | Waterproof | Ankle Height",
    condition: "good",
    status: "available"
  },
  {
    name: "Summer Dress",
    category: "ladies",
    price: 2800,
    img: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400",
    imagesJson: JSON.stringify([
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400"
    ]),
    meta: "Size M | Floral Print | Knee Length | Sleeveless",
    condition: "excellent",
    status: "available"
  },
  {
    name: "Men's Polo Shirt",
    category: "men",
    price: 2200,
    img: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
    imagesJson: JSON.stringify([
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400"
    ]),
    meta: "Size L | Cotton | Collar | Short Sleeve | Navy Blue",
    condition: "good",
    status: "available"
  },

  // Pre-owned Products
  {
    name: "iPhone 12 Pro",
    category: "preowned-phone",
    price: 55000,
    img: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400",
    imagesJson: JSON.stringify([
      "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400"
    ]),
    meta: "128GB | Good Battery | Minor Scratches | Fully Functional",
    condition: "good",
    status: "available"
  },
  {
    name: "Dell Laptop",
    category: "preowned-electronics",
    price: 35000,
    img: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400",
    imagesJson: JSON.stringify([
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400"
    ]),
    meta: "Intel i5 | 8GB RAM | 256GB SSD | 15.6 inch | Windows 11",
    condition: "fair",
    status: "available"
  },
  {
    name: "Gaming Chair",
    category: "preowned-furniture",
    price: 15000,
    img: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400",
    imagesJson: JSON.stringify([
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400"
    ]),
    meta: "Ergonomic | Adjustable Height | Lumbar Support | RGB Lighting",
    condition: "good",
    status: "available"
  }
]

export async function GET() {
  if (IS_PROD) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const requiredToken = process.env.SEED_TOKEN
  if (requiredToken) {
    return NextResponse.json({
      error: 'Seed endpoint disabled: use POST with token'
    }, { status: 405 })
  }

  try {
    await connectDB()
    console.log('Connected to MongoDB')

    // Check if data already exists
    const existingProducts = await Product.countDocuments()
    const existingUsers = await User.countDocuments()

    if (existingProducts > 0 && existingUsers > 0) {
      return NextResponse.json({ 
        message: 'Database already seeded', 
        products: existingProducts, 
        users: existingUsers 
      })
    }

    // Clear existing data
    await Product.deleteMany({})
    await User.deleteMany({})
    console.log('Cleared existing data')

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12)
    const adminUser = await User.create({
      email: 'admin@supertwiceresellers.com',
      password: hashedPassword,
      role: 'admin'
    })
    console.log('Created admin user:', adminUser.email)

    // Create sample products
    const products = await Product.insertMany(sampleProducts)
    console.log(`Created ${products.length} sample products`)

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully!',
      admin: {
        email: 'admin@supertwiceresellers.com',
        password: 'admin123'
      },
      productsCreated: products.length
    })
    
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    return NextResponse.json({ 
      error: 'Failed to seed database', 
      details: error.message 
    }, { status: 500 })
  }
}

export async function POST(req) {
  if (IS_PROD) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const requiredToken = process.env.SEED_TOKEN
  if (!requiredToken) {
    return NextResponse.json({
      error: 'Seed endpoint disabled: missing SEED_TOKEN'
    }, { status: 403 })
  }

  let body = {}
  try { body = await req.json() } catch {}
  if (body?.token !== requiredToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await connectDB()

    // Clear existing data
    await Product.deleteMany({})
    await User.deleteMany({})

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12)
    const adminUser = await User.create({
      email: 'admin@supertwiceresellers.com',
      password: hashedPassword,
      role: 'admin'
    })

    // Create sample products
    const products = await Product.insertMany(sampleProducts)

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully!',
      admin: {
        email: adminUser.email,
        password: 'admin123'
      },
      productsCreated: products.length
    })
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    return NextResponse.json({
      error: 'Failed to seed database',
      details: error.message
    }, { status: 500 })
  }
}
