import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const config = {
      consumerKey: process.env.MPESA_CONSUMER_KEY,
      consumerSecret: process.env.MPESA_CONSUMER_SECRET,
      businessShortCode: process.env.MPESA_BUSINESS_SHORT_CODE,
      passkey: process.env.MPESA_PASSKEY,
      environment: process.env.MPESA_ENVIRONMENT,
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL
    }

    const status = {
      configured: false,
      issues: [],
      config: {
        hasConsumerKey: !!config.consumerKey && config.consumerKey !== 'your_consumer_key',
        hasConsumerSecret: !!config.consumerSecret && config.consumerSecret !== 'your_consumer_secret',
        hasBusinessShortCode: !!config.businessShortCode,
        hasPasskey: !!config.passkey,
        environment: config.environment || 'not_set',
        baseUrl: config.baseUrl || 'not_set',
        consumerKeyLength: config.consumerKey ? config.consumerKey.length : 0,
        consumerSecretLength: config.consumerSecret ? config.consumerSecret.length : 0
      }
    }

    // Check for issues
    if (!config.consumerKey || config.consumerKey === 'your_consumer_key') {
      status.issues.push('MPESA_CONSUMER_KEY not set or using default value')
    }

    if (!config.consumerSecret || config.consumerSecret === 'your_consumer_secret') {
      status.issues.push('MPESA_CONSUMER_SECRET not set or using default value')
    }

    if (!config.businessShortCode) {
      status.issues.push('MPESA_BUSINESS_SHORT_CODE not set')
    }

    if (!config.passkey) {
      status.issues.push('MPESA_PASSKEY not set')
    }

    if (!config.environment) {
      status.issues.push('MPESA_ENVIRONMENT not set')
    }

    status.configured = status.issues.length === 0

    return NextResponse.json(status)

  } catch (error) {
    return NextResponse.json({
      configured: false,
      error: error.message,
      issues: ['Failed to check environment configuration']
    }, { status: 500 })
  }
}
