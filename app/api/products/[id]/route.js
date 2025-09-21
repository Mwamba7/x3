import prisma from '../../../../lib/prisma'
import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../../lib/adminAuth'

export async function GET(_req, { params }) {
  try {
    const item = await prisma.product.findUnique({ where: { id: params.id } })
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
    const updated = await prisma.product.update({ where: { id: params.id }, data })
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
    await prisma.product.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
