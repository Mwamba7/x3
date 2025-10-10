
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
