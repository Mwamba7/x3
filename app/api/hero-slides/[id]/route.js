import prisma from '../../../../lib/prisma'
import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../../lib/adminAuth'

export async function GET(_req, { params }) {
  try {
    const slide = await prisma.heroSlide.findUnique({ where: { id: params.id } })
    if (!slide) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(slide)
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
    if (body.imageUrl != null) data.imageUrl = String(body.imageUrl)
    if (body.popupType != null) data.popupType = String(body.popupType).toLowerCase()
    if (body.title !== undefined) data.title = body.title
    if (body.subtitle !== undefined) data.subtitle = body.subtitle
    if (body.price !== undefined) data.price = body.price == null ? null : Number(body.price)
    if (body.ctaLabel !== undefined) data.ctaLabel = body.ctaLabel
    if (body.ctaHref !== undefined) data.ctaHref = body.ctaHref
    if (body.productId !== undefined) {
      const pid = body.productId || null
      data.productId = pid
      if (pid && (body.ctaHref === undefined || body.ctaHref === null || String(body.ctaHref).trim() === '')) {
        data.ctaHref = `/product/${pid}`
      }
    }
    if (body.gallery !== undefined) {
      const arr = Array.isArray(body.gallery) ? body.gallery.filter(Boolean) : []
      data.galleryJson = arr.length ? JSON.stringify(arr) : null
    }
    if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder)
    if (body.active !== undefined) data.active = Boolean(body.active)

    const updated = await prisma.heroSlide.update({ where: { id: params.id }, data })
    return NextResponse.json(updated)
  } catch (e) {
    console.error('PATCH /api/hero-slides/[id] error:', e)
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}

export async function DELETE(_req, { params }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    await prisma.heroSlide.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('DELETE /api/hero-slides/[id] error:', e)
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}
