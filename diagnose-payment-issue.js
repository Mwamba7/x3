/**
 * PAYMENT CONFIRMATION DIAGNOSTIC
 * This script identifies why payments aren't being confirmed
 */

console.log('🔍 DIAGNOSING PAYMENT CONFIRMATION ISSUE')
console.log('========================================\n')

// Check 1: Environment Variables
console.log('1. 🔧 Checking M-Pesa Environment Variables...')
const requiredEnvVars = [
  'MPESA_CONSUMER_KEY',
  'MPESA_CONSUMER_SECRET', 
  'MPESA_BUSINESS_SHORT_CODE',
  'MPESA_PASSKEY',
  'NEXT_PUBLIC_BASE_URL'
]

let missingVars = []
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.log(`❌ MISSING: ${envVar}`)
    missingVars.push(envVar)
  } else {
    console.log(`✅ FOUND: ${envVar}`)
  }
})

if (missingVars.length > 0) {
  console.log(`\n🚨 CRITICAL ISSUE FOUND!`)
  console.log(`Missing ${missingVars.length} required environment variables.`)
  console.log(`This is why payments can't be processed or confirmed.\n`)
  
  console.log('💡 IMMEDIATE SOLUTION:')
  console.log('1. Create .env.local file in your project root')
  console.log('2. Add your M-Pesa sandbox credentials')
  console.log('3. Restart your server\n')
  
  console.log('📋 Required .env.local content:')
  console.log('MPESA_CONSUMER_KEY=your_consumer_key_here')
  console.log('MPESA_CONSUMER_SECRET=your_consumer_secret_here')
  console.log('MPESA_BUSINESS_SHORT_CODE=your_shortcode_here')
  console.log('MPESA_PASSKEY=your_passkey_here')
  console.log('MPESA_ENVIRONMENT=sandbox')
  console.log('NEXT_PUBLIC_BASE_URL=http://localhost:3001\n')
  
  console.log('🔗 Get M-Pesa credentials from:')
  console.log('https://developer.safaricom.co.ke/\n')
} else {
  console.log('✅ All environment variables are set!\n')
}

// Check 2: Server Status
console.log('2. 🌐 Testing Server Connectivity...')
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3001/api/mpesa/payment-callback?test=health')
    if (response.ok) {
      console.log('✅ Server is running and accessible')
    } else {
      console.log('⚠️  Server responding but with issues')
    }
  } catch (error) {
    console.log('❌ Server not accessible:', error.message)
    console.log('💡 Make sure your Next.js server is running: npm run dev')
  }
}

// Check 3: Common Issues
console.log('\n3. 🔍 Common Payment Confirmation Issues:')
console.log('')
console.log('Issue A: STK Push not sent')
console.log('  Cause: Missing M-Pesa credentials')
console.log('  Solution: Add credentials to .env.local')
console.log('')
console.log('Issue B: Payment made but not detected')
console.log('  Cause: M-Pesa callback URL not configured')
console.log('  Solution: Configure callback URL in M-Pesa dashboard')
console.log('')
console.log('Issue C: Frontend not updating after payment')
console.log('  Cause: Polling stopped or localStorage issues')
console.log('  Solution: Check browser console for errors')
console.log('')
console.log('Issue D: Wrong phone number format')
console.log('  Cause: Phone number not in correct format')
console.log('  Solution: Use format 254XXXXXXXXX')
console.log('')

// Check 4: Testing Steps
console.log('4. 🧪 Step-by-Step Testing Process:')
console.log('')
console.log('Step 1: Set up credentials')
console.log('  - Create .env.local with M-Pesa credentials')
console.log('  - Restart server: npm run dev')
console.log('')
console.log('Step 2: Test payment initiation')
console.log('  - Go to http://localhost:3001/cart')
console.log('  - Add items to cart')
console.log('  - Enter phone number (254XXXXXXXXX format)')
console.log('  - Click "Pay Deposit"')
console.log('')
console.log('Step 3: Monitor payment process')
console.log('  - Check phone for STK Push notification')
console.log('  - Enter M-Pesa PIN to complete payment')
console.log('  - Watch browser console for status updates')
console.log('  - Wait up to 3 minutes for automatic confirmation')
console.log('')
console.log('Step 4: Manual verification')
console.log('  - Use "Check Payment Status" button if needed')
console.log('  - Check server logs for callback reception')
console.log('  - Verify cart locks and WhatsApp button enables')
console.log('')

console.log('5. 🆘 If Still Not Working:')
console.log('')
console.log('Debug Commands:')
console.log('  node test-payment-detection.js')
console.log('  node debug-payment-flow.js')
console.log('')
console.log('Browser Debugging:')
console.log('  - Open Developer Tools (F12)')
console.log('  - Check Console tab for JavaScript errors')
console.log('  - Check Network tab for failed API calls')
console.log('  - Check Application > Local Storage for payment state')
console.log('')

// Run server check
checkServer().catch(console.error)
