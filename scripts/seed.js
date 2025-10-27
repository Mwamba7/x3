import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import connectDB from '../lib/mongodb.js'
import Product from '../models/Product.js'
import User from '../models/User.js'

const sampleProducts = [
  {
    name: "Samsung Galaxy A54 5G",
    category: "phone",
    price: 35000,
    img: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400",
    imagesJson: JSON.stringify([
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400",
      "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=400"
    ]),
    meta: "Excellent condition, barely used smartphone with 5G connectivity",
    condition: "excellent",
    status: "available"
  },
  {
    name: "Sony 43\" Smart TV",
    category: "tv",
    price: 45000,
    img: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400",
    imagesJson: JSON.stringify([
      "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400"
    ]),
    meta: "4K Smart TV with Android OS, perfect for streaming",
    condition: "good",
    status: "available"
  },
  {
    name: "MacBook Air M1",
    category: "electronics",
    price: 85000,
    img: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400",
    imagesJson: JSON.stringify([
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400"
    ]),
    meta: "Excellent condition laptop, perfect for work and creativity",
    condition: "excellent",
    status: "available"
  },
  {
    name: "Nike Air Max 270",
    category: "sneakers",
    price: 8500,
    img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
    imagesJson: JSON.stringify([
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400"
    ]),
    meta: "Comfortable running shoes in great condition",
    condition: "good",
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
    meta: "Classic denim jacket, perfect for casual wear",
    condition: "good",
    status: "available"
  }
]

async function seed() {
  try {
    await connectDB()
    console.log('Connected to MongoDB')

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

    console.log('✅ Database seeded successfully!')
    console.log('Admin login: admin@supertwiceresellers.com / admin123')
    
  } catch (error) {
    console.error('❌ Error seeding database:', error)
  } finally {
    await mongoose.connection.close()
    console.log('Database connection closed')
  }
}

seed()
