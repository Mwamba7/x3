import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  const diagnosis = {
    timestamp: new Date().toISOString(),
    issues: [],
    warnings: [],
    status: 'unknown',
    details: {}
  }

  try {
    // 1. Check if .env file exists
    const projectRoot = process.cwd()
    const envPath = path.join(projectRoot, '.env')
    const envExamplePath = path.join(projectRoot, '.env.example')
    
    diagnosis.details.files = {
      envExists: fs.existsSync(envPath),
      envExampleExists: fs.existsSync(envExamplePath),
      projectRoot
    }

    if (!diagnosis.details.files.envExists) {
      diagnosis.issues.push('❌ CRITICAL: .env file does not exist')
      diagnosis.issues.push('💡 SOLUTION: Run "copy .env.example .env" in your project root')
    }

    // 2. Check environment variables
    const envVars = {
      MPESA_CONSUMER_KEY: process.env.MPESA_CONSUMER_KEY,
      MPESA_CONSUMER_SECRET: process.env.MPESA_CONSUMER_SECRET,
      MPESA_BUSINESS_SHORT_CODE: process.env.MPESA_BUSINESS_SHORT_CODE,
      MPESA_PASSKEY: process.env.MPESA_PASSKEY,
      MPESA_ENVIRONMENT: process.env.MPESA_ENVIRONMENT,
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL
    }

    diagnosis.details.environment = {
      hasConsumerKey: !!envVars.MPESA_CONSUMER_KEY && envVars.MPESA_CONSUMER_KEY !== 'your_consumer_key',
      hasConsumerSecret: !!envVars.MPESA_CONSUMER_SECRET && envVars.MPESA_CONSUMER_SECRET !== 'your_consumer_secret',
      hasBusinessShortCode: !!envVars.MPESA_BUSINESS_SHORT_CODE,
      hasPasskey: !!envVars.MPESA_PASSKEY,
      environment: envVars.MPESA_ENVIRONMENT || 'not_set',
      baseUrl: envVars.NEXT_PUBLIC_BASE_URL || 'not_set',
      consumerKeyLength: envVars.MPESA_CONSUMER_KEY ? envVars.MPESA_CONSUMER_KEY.length : 0,
      consumerSecretLength: envVars.MPESA_CONSUMER_SECRET ? envVars.MPESA_CONSUMER_SECRET.length : 0
    }

    // Check each environment variable
    if (!envVars.MPESA_CONSUMER_KEY || envVars.MPESA_CONSUMER_KEY === 'your_consumer_key') {
      diagnosis.issues.push('❌ MPESA_CONSUMER_KEY not set or using placeholder')
    }

    if (!envVars.MPESA_CONSUMER_SECRET || envVars.MPESA_CONSUMER_SECRET === 'your_consumer_secret') {
      diagnosis.issues.push('❌ MPESA_CONSUMER_SECRET not set or using placeholder')
    }

    if (!envVars.MPESA_BUSINESS_SHORT_CODE) {
      diagnosis.issues.push('❌ MPESA_BUSINESS_SHORT_CODE not set')
    }

    if (!envVars.MPESA_PASSKEY) {
      diagnosis.issues.push('❌ MPESA_PASSKEY not set')
    }

    if (!envVars.MPESA_ENVIRONMENT) {
      diagnosis.warnings.push('⚠️ MPESA_ENVIRONMENT not set, defaulting to sandbox')
    }

    // 3. Test M-Pesa authentication if credentials are available
    if (envVars.MPESA_CONSUMER_KEY && envVars.MPESA_CONSUMER_SECRET) {
      try {
        const baseUrl = envVars.MPESA_ENVIRONMENT === 'production' 
          ? 'https://api.safaricom.co.ke' 
          : 'https://sandbox.safaricom.co.ke'

        const auth = Buffer.from(`${envVars.MPESA_CONSUMER_KEY}:${envVars.MPESA_CONSUMER_SECRET}`).toString('base64')
        
        const authResponse = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        })

        diagnosis.details.authTest = {
          attempted: true,
          status: authResponse.status,
          ok: authResponse.ok,
          baseUrl
        }

        if (authResponse.ok) {
          const authData = await authResponse.json()
          diagnosis.details.authTest.success = true
          diagnosis.details.authTest.hasToken = !!authData.access_token
          diagnosis.details.authTest.tokenLength = authData.access_token ? authData.access_token.length : 0
        } else {
          const errorText = await authResponse.text()
          diagnosis.details.authTest.success = false
          diagnosis.details.authTest.error = errorText
          diagnosis.issues.push(`❌ M-Pesa authentication failed: HTTP ${authResponse.status}`)
        }
      } catch (authError) {
        diagnosis.details.authTest = {
          attempted: true,
          success: false,
          error: authError.message
        }
        diagnosis.issues.push(`❌ M-Pesa authentication error: ${authError.message}`)
      }
    } else {
      diagnosis.details.authTest = {
        attempted: false,
        reason: 'Missing credentials'
      }
    }

    // 4. Check API routes exist
    const apiRoutes = [
      'app/api/pay/route.js',
      'app/api/mpesa-callback/route.js'
    ]

    diagnosis.details.apiRoutes = {}
    for (const route of apiRoutes) {
      const routePath = path.join(projectRoot, route)
      diagnosis.details.apiRoutes[route] = fs.existsSync(routePath)
      if (!diagnosis.details.apiRoutes[route]) {
        diagnosis.issues.push(`❌ Missing API route: ${route}`)
      }
    }

    // 5. Check components exist
    const components = [
      'components/SimplePayment.jsx'
    ]

    diagnosis.details.components = {}
    for (const component of components) {
      const componentPath = path.join(projectRoot, component)
      diagnosis.details.components[component] = fs.existsSync(componentPath)
      if (!diagnosis.details.components[component]) {
        diagnosis.issues.push(`❌ Missing component: ${component}`)
      }
    }

    // 6. Determine overall status
    if (diagnosis.issues.length === 0) {
      diagnosis.status = 'healthy'
    } else if (diagnosis.issues.length <= 2) {
      diagnosis.status = 'needs_attention'
    } else {
      diagnosis.status = 'broken'
    }

    // 7. Generate solutions
    diagnosis.solutions = []
    
    if (!diagnosis.details.files.envExists) {
      diagnosis.solutions.push('1. Create .env file: copy .env.example .env')
      diagnosis.solutions.push('2. Restart development server: npm run dev')
    }
    
    if (!diagnosis.details.environment.hasConsumerKey || !diagnosis.details.environment.hasConsumerSecret) {
      diagnosis.solutions.push('3. Add your M-Pesa credentials to .env file')
      diagnosis.solutions.push('4. Get credentials from https://developer.safaricom.co.ke/')
    }

    if (diagnosis.details.authTest && !diagnosis.details.authTest.success) {
      diagnosis.solutions.push('5. Verify M-Pesa credentials are correct')
      diagnosis.solutions.push('6. Check network connectivity to Safaricom API')
    }

    return NextResponse.json(diagnosis)

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
      issues: ['❌ CRITICAL: Diagnostic tool failed to run'],
      solutions: ['Check server logs for detailed error information']
    }, { status: 500 })
  }
}
