import { NextResponse } from 'next/server'
import connectDB from '../../../../lib/mongodb'
import PendingProduct from '../../../../models/PendingProduct'
import { verifyAuth } from '../../../../lib/auth-middleware'

const ADMIN_WHATSAPP = '254718176584'

export async function POST(request) {
  try {
    await connectDB()
    
    // Check if user is authenticated
    const authResult = await verifyAuth(request)
    let sellerId = null
    
    console.log('🔍 Auth check result:', authResult)
    
    if (authResult.authenticated) {
      sellerId = authResult.user.id
      console.log('✅ User authenticated, sellerId:', sellerId)
    } else {
      console.log('❌ User not authenticated:', authResult.error)
    }
    
    const formData = await request.formData()
    
    // Extract form fields
    const productData = {
      name: formData.get('name'),
      category: formData.get('category'),
      price: formData.get('price') ? parseInt(formData.get('price')) : null,
      description: formData.get('description'),
      sellerName: formData.get('sellerName'),
      sellerPhone: formData.get('sellerPhone'),
      sellerEmail: formData.get('sellerEmail') || '',
      submissionType: formData.get('submissionType') || 'public',
      sellerId: sellerId // Associate with user account if logged in
    }
    
    // Basic validation
    if (!productData.name || !productData.sellerName || !productData.sellerPhone) {
      return NextResponse.json(
        { error: 'Missing required fields: name, sellerName, or sellerPhone' },
        { status: 400 }
      )
    }
    
    // Handle image uploads (for now, we'll store as base64 or URLs)
    const images = []
    const imageFiles = formData.getAll('images')
    
    for (const file of imageFiles) {
      if (file && file.size > 0) {
        // Convert to base64 for storage (in production, you'd upload to cloud storage)
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const base64 = buffer.toString('base64')
        const dataUrl = `data:${file.type};base64,${base64}`
        images.push(dataUrl)
      }
    }
    
    productData.images = images
    
    // Save to database
    console.log('💾 Saving product data:', productData)
    const pendingProduct = new PendingProduct(productData)
    const savedProduct = await pendingProduct.save()
    console.log('✅ Product saved with ID:', savedProduct._id, 'sellerId:', savedProduct.sellerId)
    
    // Send WhatsApp notification to admin
    try {
      const notificationMessage = [
        '🔔 New product submitted for approval:',
        '',
        `📱 Product: ${productData.name}`,
        `💰 Price: ${productData.price ? `Ksh ${productData.price}` : 'Not specified'}`,
        `👤 Seller: ${productData.sellerName}`,
        `📞 Contact: ${productData.sellerPhone}`,
        `📂 Category: ${productData.category}`,
        `🎯 Type: ${productData.submissionType === 'direct_to_admin' ? 'Direct to Admin' : 'Public Listing'}`,
        '',
        '👉 Review on Admin Dashboard'
      ].join('\n')
      
      // Call WhatsApp notification API
      const notificationResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002'}/api/whatsapp/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: notificationMessage,
          phoneNumber: ADMIN_WHATSAPP
        })
      })
      
      if (notificationResponse.ok) {
        // Mark as notified
        await PendingProduct.findByIdAndUpdate(pendingProduct._id, { adminNotified: true })
      }
      
    } catch (notificationError) {
      console.error('Failed to send WhatsApp notification:', notificationError)
      // Don't fail the entire request if notification fails
    }
    
    return NextResponse.json({
      success: true,
      message: 'Product submitted successfully! Admin will review and approve shortly.',
      productId: pendingProduct._id
    })
    
  } catch (error) {
    console.error('Error submitting product:', error)
    return NextResponse.json(
      { error: 'Failed to submit product. Please try again.' },
      { status: 500 }
    )
  }
}

