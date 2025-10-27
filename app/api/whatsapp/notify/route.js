import { NextResponse } from 'next/server'

const ADMIN_WHATSAPP = '254718176584'

export async function POST(request) {
  try {
    const { message, phoneNumber = ADMIN_WHATSAPP, type, data } = await request.json()
    
    let formattedMessage = message
    
    // Handle different notification types
    if (type && data) {
      switch (type) {
        case 'withdrawal_request':
          formattedMessage = formatWithdrawalNotification(data)
          break
        case 'product_submission':
          formattedMessage = formatProductNotification(data)
          break
        case 'product_approval':
          formattedMessage = formatApprovalNotification(data)
          break
        case 'product_rejection':
          formattedMessage = formatRejectionNotification(data, data.reason)
          break
        default:
          formattedMessage = message
      }
    }
    
    if (!formattedMessage) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }
    
    // In a production environment, you would use WhatsApp Business API
    // For now, we'll create a WhatsApp URL that can be opened
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(formattedMessage)}`
    
    // Log the notification for debugging
    console.log('WhatsApp Notification:')
    console.log('To:', phoneNumber)
    console.log('Message:', formattedMessage)
    console.log('URL:', whatsappUrl)
    
    // In production, you could:
    // 1. Use WhatsApp Business API to send automatically
    // 2. Use a service like Twilio WhatsApp API
    // 3. Use a webhook to trigger notifications
    // 4. Queue the message for batch processing
    
    // For demonstration, we'll return the URL
    return NextResponse.json({
      success: true,
      message: 'Notification prepared',
      whatsappUrl,
      // In production, you might not return the URL for security
      debug: {
        phoneNumber,
        messageLength: formattedMessage.length
      }
    })
    
  } catch (error) {
    console.error('WhatsApp notification error:', error)
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    )
  }
}

// Helper function to format product notification
export function formatProductNotification(productData) {
  return [
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
}

// Helper function to format approval notification
export function formatApprovalNotification(productData) {
  return [
    '✅ Product Approved!',
    '',
    `Your product "${productData.name}" has been approved and published.`,
    '',
    `💰 Price: ${productData.price ? `Ksh ${productData.price}` : 'Not specified'}`,
    '',
    'Thank you for using our platform!'
  ].join('\n')
}

// Helper function to format rejection notification
export function formatRejectionNotification(productData, reason) {
  return [
    '❌ Product Not Approved',
    '',
    `Your product "${productData.name}" was not approved.`,
    '',
    reason ? `Reason: ${reason}` : 'Please contact admin for more details.',
    '',
    'You can resubmit with corrections if needed.'
  ].join('\n')
}

// Helper function to format withdrawal notification
export function formatWithdrawalNotification(data) {
  return [
    '💳 New Withdrawal Request',
    '',
    `📱 Product: ${data.productName}`,
    `👤 Seller: ${data.sellerName}`,
    `📞 Phone: ${data.sellerPhone}`,
    '',
    '💰 Payment Breakdown:',
    `Sale Amount: Ksh ${data.productPrice}`,
    `Service Fee (15%): Ksh ${data.serviceFee}`,
    `Withdrawal Amount: Ksh ${data.withdrawalAmount}`,
    '',
    '👉 Process withdrawal in Admin Dashboard'
  ].join('\n')
}
