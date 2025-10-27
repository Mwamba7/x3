import { NextResponse } from 'next/server'
import connectDB from '../../../lib/mongodb'
import Product from '../../../models/Product'
import User from '../../../models/User'
import bcrypt from 'bcryptjs'

const comprehensiveProducts = [
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
  {
    name: "iPhone 14 Pro Max",
    category: "phone",
    price: 95000,
    img: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400",
    imagesJson: JSON.stringify([
      "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400"
    ]),
    meta: "256GB | ProRAW Camera | Dynamic Island | A16 Bionic Chip",
    condition: "excellent",
    status: "available"
  },
  {
    name: "LG Washing Machine",
    category: "appliances",
    price: 35000,
    img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
    imagesJson: JSON.stringify([
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400"
    ]),
    meta: "7KG Capacity | Front Load | Steam Wash | Energy Efficient",
    condition: "good",
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
  {
    name: "Puma Sneakers",
    category: "sneakers",
    price: 6500,
    img: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400",
    imagesJson: JSON.stringify([
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400"
    ]),
    meta: "Size 40 | Running Shoes | Lightweight | Breathable Mesh",
    condition: "excellent",
    status: "available"
  },
  {
    name: "Champion Hoodie",
    category: "hoodie",
    price: 3800,
    img: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400",
    imagesJson: JSON.stringify([
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400"
    ]),
    meta: "Size XL | Gray | Logo Print | Kangaroo Pocket",
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
  },
  {
    name: "PlayStation 4 Console",
    category: "preowned-electronics",
    price: 25000,
    img: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400",
    imagesJson: JSON.stringify([
      "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400"
    ]),
    meta: "500GB | 2 Controllers | 5 Games Included | Good Condition",
    condition: "good",
    status: "available"
  }
]

export async function GET() {
  try {
    await connectDB()
    console.log('Connected to MongoDB')

    // Clear existing data
    await Product.deleteMany({})
    console.log('Cleared existing products')

    // Ensure admin user exists
    let adminUser = await User.findOne({ email: 'admin@supertwiceresellers.com' })
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('admin123', 12)
      adminUser = await User.create({
        email: 'admin@supertwiceresellers.com',
        password: hashedPassword,
        role: 'admin'
      })
      console.log('Created admin user')
    }

    // Create comprehensive products
    const products = await Product.insertMany(comprehensiveProducts)
    console.log(`Created ${products.length} comprehensive products`)

    return NextResponse.json({
      success: true,
      message: 'Database reseeded with comprehensive data!',
      admin: {
        email: 'admin@supertwiceresellers.com',
        password: 'admin123'
      },
      productsCreated: products.length,
      sections: {
        electronics: products.filter(p => ['tv','radio','phone','electronics','accessory','appliances','fridge','cooler'].includes(p.category)).length,
        fashion: products.filter(p => ['outfits', 'hoodie', 'shoes', 'sneakers', 'ladies', 'men'].includes(p.category)).length,
        preowned: products.filter(p => p.category.startsWith('preowned')).length
      }
    })
    
  } catch (error) {
    console.error('❌ Error reseeding database:', error)
    return NextResponse.json({ 
      error: 'Failed to reseed database', 
      details: error.message 
    }, { status: 500 })
  }
}
