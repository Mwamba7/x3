import { cookies } from 'next/headers'
import { verifySession } from './auth'

export async function getSessionUser() {
  const cookieStore = cookies()
  const token = cookieStore.get('tt_session')?.value
  if (!token) return null
  const payload = await verifySession(token)
  return payload
}

export async function requireAdmin() {
  const user = await getSessionUser()
  if (!user) return null
  return user
}
