import { NextResponse } from 'next/server'

// This is a clean M-Pesa route file for deployment
// The original route.js has structural issues that prevent building

export async function POST(request) {
  return NextResponse.json(
    { success: false, error: 'M-Pesa route temporarily disabled for deployment' },
    { status: 503 }
  )
}

export async function GET(request) {
  return NextResponse.json(
    { success: false, error: 'M-Pesa status query temporarily disabled for deployment' },
    { status: 503 }
  )
}
