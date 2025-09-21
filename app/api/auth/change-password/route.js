import prisma from '../../../../lib/prisma'
import { NextResponse } from 'next/server'
import { verifyPassword, hashPassword } from '../../../../lib/auth'
import { requireAdmin } from '../../../../lib/adminAuth'

export async function POST(req) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { currentPassword, newPassword } = await req.json()
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Both current and new passwords are required' }, { status: 400 })
    }
    const dbUser = await prisma.user.findUnique({ where: { id: user.uid } })
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const ok = await verifyPassword(currentPassword, dbUser.passwordHash)
    if (!ok) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })

    const passwordHash = await hashPassword(newPassword)
    await prisma.user.update({ where: { id: user.uid }, data: { passwordHash } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
