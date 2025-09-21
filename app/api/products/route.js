import prisma from '../../../lib/prisma'
import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../lib/adminAuth'

export async function GET() {
  try {
    const items = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(items)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const { name, category, price, img, images = [], meta = '', condition = '', status = 'available' } = body
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
    const created = await prisma.product.create({
      data: { name, category, price: priceNum, img, imagesJson: JSON.stringify(imagesArr), meta, condition, status },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (e) {
    console.error('POST /api/products error:', e)
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}
