import prisma from '../../../lib/prisma'
import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../lib/adminAuth'

export async function GET() {
  try {
    const items = await prisma.heroSlide.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    })
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
    const {
      imageUrl,
      popupType = 'flash_sale',
      title = null,
      subtitle = null,
      price = null,
      ctaLabel = null,
      ctaHref = null,
      productId = null,
      gallery = [],
      sortOrder = 0,
      active = true,
    } = body

    if (!imageUrl || imageUrl.trim() === '') {
      return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 })
    }

    const galleryArr = Array.isArray(gallery) ? gallery.filter(Boolean) : []
    const created = await prisma.heroSlide.create({
      data: {
        imageUrl: imageUrl.trim(),
        popupType: String(popupType || 'flash_sale').toLowerCase(),
        title,
        subtitle,
        price: price == null ? null : Number(price),
        ctaLabel,
        ctaHref: productId ? `/product/${productId}` : ctaHref,
        productId,
        galleryJson: galleryArr.length ? JSON.stringify(galleryArr) : null,
        sortOrder: Number(sortOrder) || 0,
        active: Boolean(active),
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (e) {
    console.error('POST /api/hero-slides error:', e)
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}
