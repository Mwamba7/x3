import { NextResponse } from 'next/server'
import connectDB from '../../../../lib/mongodb'
import Product from '../../../../models/Product'

const IS_PROD = process.env.NODE_ENV === 'production'

export async function POST() {
  if (IS_PROD) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    await connectDB()
    
    // Clear existing community products and create new ones with fashion categories
    await Product.deleteMany({
      'metadata.source': 'sell-page',
      'metadata.submissionType': 'public'
    })

    // Create test community products
    const testProducts = [
      {
        name: 'iPhone 13 Pro Max - Excellent Condition',
        category: 'phone',
        price: 95000,
        img: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMDA3YWZmIi8+PHRleHQgeD0iNTAlIiB5PSI0NSUiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+aVBob25lIDEzIFBybyBNYXg8L3RleHQ+PC9zdmc+',
        description: 'iPhone 13 Pro Max in excellent condition. Used for 8 months, comes with original box, charger, and case. Battery health at 96%. No scratches or damage.',
        meta: 'iPhone 13 Pro Max, 256GB, Pacific Blue. Excellent condition with original accessories.',
        condition: 'Excellent',
        status: 'available',
        inStock: true,
        featured: false,
        metadata: {
          originalSeller: {
            name: 'Sarah Johnson',
            phone: '254712345678',
            email: 'sarah@example.com'
          },
          submissionType: 'public',
          approvedBy: 'admin',
          approvedAt: new Date(),
          source: 'sell-page'
        }
      },
      {
        name: 'MacBook Air M1 - Like New',
        category: 'electronics',
        price: 120000,
        img: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY3Ii8+PHRleHQgeD0iNTAlIiB5PSI0NSUiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiMzMzMiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5NYWNCb29rIEFpciBNMTwvdGV4dD48L3N2Zz4=',
        description: 'MacBook Air M1 in like-new condition. Purchased 6 months ago, barely used. Comes with original packaging, charger, and laptop sleeve.',
        meta: 'MacBook Air M1, 8GB RAM, 256GB SSD. Like new with original packaging.',
        condition: 'Like New',
        status: 'available',
        inStock: true,
        featured: false,
        metadata: {
          originalSeller: {
            name: 'Michael Chen',
            phone: '254798765432',
            email: 'michael@example.com'
          },
          submissionType: 'public',
          approvedBy: 'admin',
          approvedAt: new Date(),
          source: 'sell-page'
        }
      },
      {
        name: 'Samsung 55" 4K Smart TV',
        category: 'tv',
        price: 65000,
        img: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMDAwIi8+PHRleHQgeD0iNTAlIiB5PSI0NSUiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+U2Ftc3VuZyA1NSIgNEs8L3RleHQ+PC9zdmc+',
        description: 'Samsung 55-inch 4K Smart TV in good condition. Works perfectly, comes with remote and original stand. Minor scuff on back (not visible when mounted).',
        meta: 'Samsung 55" 4K Smart TV, Model UN55TU8000. Good condition with remote.',
        condition: 'Good',
        status: 'available',
        inStock: true,
        featured: false,
        metadata: {
          originalSeller: {
            name: 'David Kimani',
            phone: '254723456789',
            email: 'david@example.com'
          },
          submissionType: 'public',
          approvedBy: 'admin',
          approvedAt: new Date(),
          source: 'sell-page'
        }
      },
      {
        name: 'Sony WH-1000XM4 Headphones',
        category: 'accessory',
        price: 25000,
        img: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI0NSUiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+U29ueSBXSC0xMDAwWE00PC90ZXh0Pjwvc3ZnPg==',
        description: 'Sony WH-1000XM4 noise-canceling headphones. Excellent sound quality, active noise cancellation works perfectly. Comes with case and cables.',
        meta: 'Sony WH-1000XM4 wireless noise-canceling headphones. Excellent condition.',
        condition: 'Excellent',
        status: 'available',
        inStock: true,
        featured: false,
        metadata: {
          originalSeller: {
            name: 'Grace Wanjiku',
            phone: '254734567890',
            email: 'grace@example.com'
          },
          submissionType: 'public',
          approvedBy: 'admin',
          approvedAt: new Date(),
          source: 'sell-page'
        }
      },
      {
        name: 'LG Double Door Refrigerator',
        category: 'fridge',
        price: 45000,
        img: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI0NSUiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiMzMzMiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5MRyBEb3VibGUgRG9vcjwvdGV4dD48dGV4dCB4PSI1MCUiIHk9IjU1JSIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzMzMyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkZyaWRnZTwvdGV4dD48L3N2Zz4=',
        description: 'LG double door refrigerator, 420L capacity. Works perfectly, energy efficient. Moving house, need to sell quickly. Includes warranty papers.',
        meta: 'LG 420L double door refrigerator. Good condition, energy efficient.',
        condition: 'Good',
        status: 'available',
        inStock: true,
        featured: false,
        metadata: {
          originalSeller: {
            name: 'Peter Mwangi',
            phone: '254745678901',
            email: 'peter@example.com'
          },
          submissionType: 'public',
          approvedBy: 'admin',
          approvedAt: new Date(),
          source: 'sell-page'
        }
      },
      {
        name: 'Canon EOS 2000D DSLR Camera',
        category: 'electronics',
        price: 38000,
        img: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMDAwIi8+PHRleHQgeD0iNTAlIiB5PSI0NSUiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Q2Fub24gRU9TIDIwMDBEPC90ZXh0Pjwvc3ZnPg==',
        description: 'Canon EOS 2000D DSLR camera with 18-55mm lens. Great for beginners, excellent image quality. Comes with battery, charger, and camera bag.',
        meta: 'Canon EOS 2000D DSLR with 18-55mm lens. Great condition for photography.',
        condition: 'Very Good',
        status: 'available',
        inStock: true,
        featured: false,
        metadata: {
          originalSeller: {
            name: 'Alice Njeri',
            phone: '254756789012',
            email: 'alice@example.com'
          },
          submissionType: 'public',
          approvedBy: 'admin',
          approvedAt: new Date(),
          source: 'sell-page'
        }
      },
      {
        name: 'Nike Air Force 1 - White',
        category: 'sneakers',
        price: 12000,
        img: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmZmIiBzdHJva2U9IiNkZGQiLz48dGV4dCB4PSI1MCUiIHk9IjQ1JSIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzMzMyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5pa2UgQWlyIEZvcmNlIDE8L3RleHQ+PC9zdmc+',
        description: 'Classic Nike Air Force 1 sneakers in white. Size 42, worn only a few times. Clean and in excellent condition.',
        meta: 'Nike Air Force 1 White, Size 42. Classic sneakers in excellent condition.',
        condition: 'Excellent',
        status: 'available',
        inStock: true,
        featured: false,
        metadata: {
          originalSeller: {
            name: 'Kevin Ochieng',
            phone: '254767890123',
            email: 'kevin@example.com'
          },
          submissionType: 'public',
          approvedBy: 'admin',
          approvedAt: new Date(),
          source: 'sell-page'
        }
      },
      {
        name: 'Champion Hoodie - Black',
        category: 'hoodies',
        price: 3500,
        img: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI0NSUiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Q2hhbXBpb24gSG9vZGllPC90ZXh0Pjwvc3ZnPg==',
        description: 'Authentic Champion hoodie in black. Size L, comfortable fit. Perfect for casual wear or workouts.',
        meta: 'Champion Black Hoodie, Size L. Comfortable and authentic.',
        condition: 'Good',
        status: 'available',
        inStock: true,
        featured: false,
        metadata: {
          originalSeller: {
            name: 'Mary Wanjiku',
            phone: '254778901234',
            email: 'mary@example.com'
          },
          submissionType: 'public',
          approvedBy: 'admin',
          approvedAt: new Date(),
          source: 'sell-page'
        }
      },
      {
        name: 'Casual Summer Dress',
        category: 'ladies',
        price: 2800,
        img: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmY2YmI2Ii8+PHRleHQgeD0iNTAlIiB5PSI0NSUiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+U3VtbWVyIERyZXNzPC90ZXh0Pjwvc3ZnPg==',
        description: 'Beautiful floral summer dress, perfect for casual outings. Size M, lightweight and comfortable fabric.',
        meta: 'Casual Summer Dress, Size M. Floral pattern, lightweight fabric.',
        condition: 'Like New',
        status: 'available',
        inStock: true,
        featured: false,
        metadata: {
          originalSeller: {
            name: 'Jane Akinyi',
            phone: '254789012345',
            email: 'jane@example.com'
          },
          submissionType: 'public',
          approvedBy: 'admin',
          approvedAt: new Date(),
          source: 'sell-page'
        }
      },
      {
        name: 'Formal Business Suit',
        category: 'men',
        price: 8500,
        img: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMjIyIi8+PHRleHQgeD0iNTAlIiB5PSI0NSUiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+QnVzaW5lc3MgU3VpdDwvdGV4dD48L3N2Zz4=',
        description: 'Professional navy blue business suit. Size 40R, worn only twice. Perfect for interviews and formal events.',
        meta: 'Navy Blue Business Suit, Size 40R. Professional and formal.',
        condition: 'Excellent',
        status: 'available',
        inStock: true,
        featured: false,
        metadata: {
          originalSeller: {
            name: 'James Mutua',
            phone: '254790123456',
            email: 'james@example.com'
          },
          submissionType: 'public',
          approvedBy: 'admin',
          approvedAt: new Date(),
          source: 'sell-page'
        }
      }
    ]

    // Insert all test products
    const createdProducts = await Product.insertMany(testProducts)

    return NextResponse.json({
      success: true,
      message: `Created ${createdProducts.length} test community products`,
      products: createdProducts.map(p => ({
        id: p._id.toString(),
        name: p.name,
        price: p.price,
        category: p.category
      }))
    })

  } catch (error) {
    console.error('Error creating test products:', error)
    return NextResponse.json(
      { error: 'Failed to create test products' },
      { status: 500 }
    )
  }
}
