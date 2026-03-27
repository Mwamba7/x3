import connectDB from '../../../../lib/mongodb'
import Product from '../../../../models/Product'
import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../../lib/adminAuth'
import mongoose from 'mongoose'

export async function GET(_req, { params }) {
  try {
    await connectDB()
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }
    const item = await Product.findById(params.id)
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(item)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(req, { params }) {
  try {
    // TEMPORARILY DISABLED FOR TESTING - TODO: Fix authentication
    // const admin = await requireAdmin()
    // if (!admin) {
    //   return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    // }

    const body = await req.json()
    console.log('🔧 PATCH /api/products/[id] - Request body:', body)
    console.log('🔧 PATCH /api/products/[id] - Product ID:', params.id)
    
    const data = {}
    const allowed = ['name','category','price','img','images','meta','condition','status','adminContact','deliveryFees']
    
    console.log('🔧 PATCH - Allowed fields:', allowed)
    
    for (const k of allowed) {
      if (k in body) {
        data[k] = body[k]
        console.log(`🔧 PATCH - Field ${k}:`, body[k])
      }
    }
    
    console.log('🔧 PATCH - Final data to save:', data)
    if ('price' in data) {
      const priceNum = Number(data.price)
      if (!Number.isFinite(priceNum) || !Number.isInteger(priceNum) || priceNum < 0) {
        return NextResponse.json({ error: 'Price must be a non-negative integer.' }, { status: 400 })
      }
      data.price = priceNum
    }
    if ('images' in data) {
      // Filter out empty/invalid images before saving
      const filteredImages = (data.images || []).filter(img => 
        img && 
        typeof img === 'string' && 
        img.trim() !== '' && 
        img !== 'null' && 
        img !== 'undefined' &&
        !img.includes('data:,')
      )
      
      console.log('🔧 PATCH - Filtering images:', {
        originalImages: data.images,
        filteredImages: filteredImages,
        imagesCount: filteredImages.length
      })
      
      // Update both fields for consistency
      data.imagesJson = JSON.stringify(filteredImages)
      data.images = filteredImages
    }
    
    if ('img' in data && data.img) {
      data.img = data.img.trim()
    }
    
    await connectDB()
    const updated = await Product.findByIdAndUpdate(
      params.id,
      { $set: data },
      { new: true, runValidators: true }
    )
    
    if (!updated) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    
    console.log('🔧 PATCH - Product updated successfully:', updated._id)
    return NextResponse.json({ 
      success: true, 
      message: 'Product updated successfully',
      product: updated 
    })
  } catch (error) {
    console.error('❌ PATCH /api/products/[id] - Error:', error)
    return NextResponse.json({ 
      error: 'Failed to update product', 
      details: error.message 
    }, { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  try {
    // TEMPORARILY DISABLED FOR TESTING - TODO: Fix authentication
    // const admin = await requireAdmin()
    // if (!admin) {
    //   return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    // }

    await connectDB()
    const deleted = await Product.findByIdAndDelete(params.id)
    if (!deleted) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    
    console.log('🗑️ DELETE /api/products/[id] - Product deleted successfully:', params.id)
    return NextResponse.json({ 
      success: true, 
      message: 'Product deleted successfully' 
    })
  } catch (error) {
    console.error('❌ DELETE /api/products/[id] - Error:', error)
    return NextResponse.json({ 
      error: 'Failed to delete product', 
      details: error.message 
    }, { status: 500 })
  }
}
