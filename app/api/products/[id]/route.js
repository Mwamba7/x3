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
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const data = {}
    const allowed = ['name','category','price','img','images','meta','condition','status']
    for (const k of allowed) if (k in body) data[k] = body[k]
    if ('price' in data) {
      const priceNum = Number(data.price)
      if (!Number.isFinite(priceNum) || !Number.isInteger(priceNum) || priceNum < 0) {
        return NextResponse.json({ error: 'Price must be a non-negative integer.' }, { status: 400 })
      }
      data.price = priceNum
    }
    if ('images' in data) {
      data.imagesJson = JSON.stringify(data.images || [])
      delete data.images
    }
    // Keep pre-owned items within the pre-owned section even if category is edited
    try {
      await connectDB()
      const current = await Product.findById(params.id).select('category')
      const isPreowned = typeof current?.category === 'string' && current.category.toLowerCase().startsWith('preowned')
      if (isPreowned && 'category' in data) {
        const incoming = String(data.category || '').trim().toLowerCase()
        // Normalize: allow either full key like 'preowned-tv' or subcategory like 'tv'
        data.category = incoming.startsWith('preowned') ? incoming : (incoming ? `preowned-${incoming}` : current.category)
      }
      // Keep fashion items within fashion categories when edited from admin pages
      const fashionSet = new Set(['outfits','hoodie','shoes','sneakers','ladies','men'])
      const isFashion = typeof current?.category === 'string' && fashionSet.has(current.category.toLowerCase())
      if (isFashion && 'category' in data) {
        const incoming = String(data.category || '').trim().toLowerCase()
        // Only allow switching within the fashion set; otherwise keep current category
        data.category = fashionSet.has(incoming) ? incoming : current.category
      }
      // Keep electronics items within the electronics set when edited
      const electronicsSet = new Set(['tv','radio','phone','electronics','accessory','appliances','fridge','cooler','laptop','tablet'])
      const isElectronics = typeof current?.category === 'string' && electronicsSet.has(current.category.toLowerCase())
      if (isElectronics && 'category' in data) {
        const incoming = String(data.category || '').trim().toLowerCase()
        // Only allow switching within the electronics set; otherwise keep current category
        data.category = electronicsSet.has(incoming) ? incoming : current.category
      }
    } catch {}
    await connectDB()
    const updated = await Product.findByIdAndUpdate(params.id, data, { new: true })
    return NextResponse.json(updated)
  } catch (e) {
    console.error('PATCH /api/products/[id] error:', e)
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}

export async function DELETE(_req, { params }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    await connectDB()
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }
    await Product.findByIdAndDelete(params.id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
