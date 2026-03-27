import { cookies } from 'next/headers'

export async function getAdminSession() {
  const cookieStore = cookies()
  const adminSession = cookieStore.get('admin_session')?.value
  
  if (!adminSession) return null
  
  try {
    const sessionData = JSON.parse(adminSession)
    
    // Check session timeout (8 minutes of inactivity)
    const sessionTimeout = parseInt(process.env.ADMIN_SESSION_TIMEOUT || '480000') // 8 minutes default
    const currentTime = Date.now()
    const timeSinceLastActivity = currentTime - sessionData.lastActivity
    
    if (timeSinceLastActivity > sessionTimeout) {
      // Session expired, clear it
      try {
        cookieStore.delete('admin_session')
      } catch (cookieError) {
        console.error('Error clearing expired session:', cookieError)
      }
      return null
    }
    
    // Update last activity time
    sessionData.lastActivity = currentTime
    
    // Update the cookie with new activity time
    try {
      cookieStore.set('admin_session', JSON.stringify(sessionData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours max
        path: '/'
      })
    } catch (cookieError) {
      console.error('Error updating session:', cookieError)
      // Continue even if we can't update the cookie
    }
    
    return sessionData
    
  } catch (error) {
    console.error('Error parsing admin session:', error)
    // Clear invalid session
    try {
      cookieStore.delete('admin_session')
    } catch (cookieError) {
      console.error('Error clearing invalid session:', cookieError)
    }
    return null
  }
}

export async function requireAdmin() {
  const session = await getAdminSession()
  
  if (!session || !session.isAdmin) {
    return null
  }
  
  return session
}

export async function isSessionExpired() {
  const cookieStore = cookies()
  const adminSession = cookieStore.get('admin_session')?.value
  
  if (!adminSession) return true
  
  try {
    const sessionData = JSON.parse(adminSession)
    const sessionTimeout = parseInt(process.env.ADMIN_SESSION_TIMEOUT || '480000')
    const currentTime = Date.now()
    const timeSinceLastActivity = currentTime - sessionData.lastActivity
    
    return timeSinceLastActivity > sessionTimeout
  } catch (error) {
    return true
  }
}
