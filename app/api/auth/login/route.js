import prisma from '../../../../lib/prisma'
import { NextResponse } from 'next/server'
import { verifyPassword, createSession, authConfig } from '../../../../lib/auth'

export async function POST(req) {
  try {
    const { username, password } = await req.json()
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 })
    }
    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    const ok = await verifyPassword(password, user.passwordHash)
    if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    const token = await createSession({ uid: user.id, username: user.username })
    const res = NextResponse.json({ ok: true })
    res.cookies.set(authConfig.sessionCookie, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: authConfig.cookieMaxAgeDays * 24 * 60 * 60,
    })
    return res
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
