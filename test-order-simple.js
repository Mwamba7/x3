// Simple Node.js script to test order creation
const fetch = require('node-fetch');

const testOrderData = {
  customer: {
    name: 'Test Customer',
    phone: '0712345678',
    email: 'test@example.com',
    address: {
      street: '123 Test Street',
      city: 'Nairobi',
      area: 'Westlands',
      instructions: 'Test instructions'
    }
  },
  items: [
    {
      id: 'test-product-1',
      name: 'Test iPhone',
      price: 50000,
      qty: 1,
      condition: 'excellent',
      img: 'test.jpg'
    }
  ],
  subtotalAmount: 50000,
  deliveryFee: 80,
  totalAmount: 50080,
  delivery: {
    method: 'delivery',
    estimatedDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  },
  transactionId: 'TEST123'
};

async function testOrder() {
  try {
    console.log('🧪 Testing order creation...');
    console.log('📋 Order data:', JSON.stringify(testOrderData, null, 2));
    
    const response = await fetch('http://localhost:3000/api/orders/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testOrderData)
    });
    
    const result = await response.json();
    
    console.log('📊 Response status:', response.status);
    console.log('📋 Response data:', JSON.stringify(result, null, 2));
    
    if (response.ok && result.success) {
      console.log('✅ Order creation successful!');
      console.log('🆔 Order ID:', result.orderId);
    } else {
      console.log('❌ Order creation failed!');
      console.log('🔍 Error:', result.error);
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

testOrder();
