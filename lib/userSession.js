import { cookies } from 'next/headers'

/**
 * Database-first user session management
 * No localStorage dependencies - all data from database
 */

// Get current user from session/database
export async function getCurrentUser() {
  try {
    // Get session token from cookies
    const cookieStore = cookies()
    const sessionToken = cookieStore.get('session-token')?.value
    
    if (!sessionToken) {
      return null
    }
    
    // Verify session with database
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/verify-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `session-token=${sessionToken}`
      }
    })
    
    if (!response.ok) {
      return null
    }
    
    const data = await response.json()
    return data.user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

// Get user activities from database
export async function getUserActivities(userPhone) {
  try {
    if (!userPhone) return []
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/user/activities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userPhone })
    })
    
    if (!response.ok) {
      return []
    }
    
    const data = await response.json()
    return data.activities || []
  } catch (error) {
    console.error('Error getting user activities:', error)
    return []
  }
}

// Get user purchases from database
export async function getUserPurchases(userPhone) {
  try {
    if (!userPhone) return []
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/user/purchases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userPhone })
    })
    
    if (!response.ok) {
      return []
    }
    
    const data = await response.json()
    return data.purchases || []
  } catch (error) {
    console.error('Error getting user purchases:', error)
    return []
  }
}

// Get user sales from database
export async function getUserSales(userPhone) {
  try {
    if (!userPhone) return []
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/user/sales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userPhone })
    })
    
    if (!response.ok) {
      return []
    }
    
    const data = await response.json()
    return data.sales || []
  } catch (error) {
    console.error('Error getting user sales:', error)
    return []
  }
}

// Get user payments from database
export async function getUserPayments(userPhone) {
  try {
    if (!userPhone) return []
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/user/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userPhone })
    })
    
    if (!response.ok) {
      return []
    }
    
    const data = await response.json()
    return data.payments || []
  } catch (error) {
    console.error('Error getting user payments:', error)
    return []
  }
}
