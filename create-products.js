const http = require('http');

const postData = JSON.stringify({});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/test/create-community-products',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('Creating community products...');

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      if (res.statusCode === 200) {
        console.log('✅ Success!');
        console.log(`Created ${response.products.length} community products:`);
        response.products.forEach((product, index) => {
          console.log(`${index + 1}. ${product.name} - Ksh ${product.price.toLocaleString()}`);
        });
        console.log('\n🎉 Community products created! You can now:');
        console.log('- Visit http://localhost:3001 to see the Community Marketplace section');
        console.log('- Visit http://localhost:3001/admin/community to manage them');
      } else {
        console.error('❌ Error:', response.error);
      }
    } catch (e) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Request failed: ${e.message}`);
});

req.write(postData);
req.end();
