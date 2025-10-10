/**
 * Clear Cart Script
 * This script clears the cart localStorage to reset it to empty state
 */

const fs = require('fs');
const path = require('path');

function clearCart() {
  console.log('🛒 Clearing Cart Data');
  console.log('====================\n');

  // Since this is a Node.js script, we can't directly access localStorage
  // But we can provide instructions and create a browser script

  console.log('To clear the cart, you have several options:\n');

  console.log('Option 1: Clear via Browser Console');
  console.log('1. Open your browser and go to the cart page');
  console.log('2. Open Developer Tools (F12)');
  console.log('3. Go to Console tab');
  console.log('4. Run this command:');
  console.log('   localStorage.removeItem("cart:v1")');
  console.log('   localStorage.removeItem("fulfillmentDetails")');
  console.log('5. Refresh the page\n');

  console.log('Option 2: Use the Clear Cart Button');
  console.log('1. Go to the cart page');
  console.log('2. Click the "Clear Cart" button at the bottom\n');

  console.log('Option 3: Programmatic Clear (for development)');
  console.log('Add this to your cart page component:');
  console.log(`
  useEffect(() => {
    // Uncomment this line to clear cart on page load (development only)
    // clear()
  }, [])
  `);

  // Create a browser script file
  const browserScript = `
// Clear Cart Browser Script
// Run this in your browser console to clear the cart

console.log('🛒 Clearing cart data...');

// Clear cart items
localStorage.removeItem('cart:v1');

// Clear fulfillment details
localStorage.removeItem('fulfillmentDetails');

// Clear any M-Pesa payment state (if stored)
localStorage.removeItem('mpesaPayment');

console.log('✅ Cart cleared successfully!');
console.log('🔄 Please refresh the page to see changes.');

// Auto refresh after 2 seconds
setTimeout(() => {
  window.location.reload();
}, 2000);
`;

  fs.writeFileSync(path.join(__dirname, 'clear-cart-browser.js'), browserScript);
  console.log('✅ Created clear-cart-browser.js');
  console.log('   You can copy and paste this script into your browser console\n');

  console.log('🎯 Result: Cart will be empty with no products by default');
}

clearCart();
