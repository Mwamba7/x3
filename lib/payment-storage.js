// Payment storage utility - simple in-memory storage for now
// In production, this should use a proper database

// Global in-memory storage that persists across API calls
if (typeof global.paymentResults === 'undefined') {
  global.paymentResults = new Map()
}

const memoryStorage = global.paymentResults

export async function storePaymentResult(checkoutRequestId, paymentResult) {
  try {
    console.log('💾 Storing payment result for:', checkoutRequestId)
    
    // Store in memory with timestamp
    const enrichedResult = {
      ...paymentResult,
      storedAt: new Date().toISOString()
    }
    
    memoryStorage.set(checkoutRequestId, enrichedResult)
    console.log('✅ Stored in memory storage')
    
    return true
  } catch (error) {
    console.error('❌ Error storing payment result:', error)
    return false
  }
}

export async function getPaymentResult(checkoutRequestId) {
  try {
    console.log('🔍 Getting payment result for:', checkoutRequestId)
    
    // Check memory storage
    const memoryResult = memoryStorage.get(checkoutRequestId)
    if (memoryResult) {
      console.log('✅ Found in memory storage')
      return memoryResult
    }
    
    console.log('❌ Payment result not found')
    return null
  } catch (error) {
    console.error('❌ Error getting payment result:', error)
    return null
  }
}

export async function getAllPaymentResults() {
  try {
    return Array.from(memoryStorage.entries())
  } catch (error) {
    console.error('❌ Error getting all payment results:', error)
    return []
  }
}

export async function clearPaymentResults() {
  try {
    // Clear memory
    const memoryCount = memoryStorage.size
    memoryStorage.clear()
    
    console.log(`🧹 Cleared ${memoryCount} from memory`)
    return { memoryCount, dbCount: 0 }
  } catch (error) {
    console.error('❌ Error clearing payment results:', error)
    return { memoryCount: 0, dbCount: 0 }
  }
}

export function getMemoryStorageStats() {
  return {
    size: memoryStorage.size,
    keys: Array.from(memoryStorage.keys())
  }
}
