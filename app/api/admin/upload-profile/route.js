import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../../lib/adminAuth'

export async function POST(request) {
  try {
    const adminUser = await requireAdmin()
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('profilePicture')

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 })
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`

    return NextResponse.json({
      success: true,
      message: 'Profile picture uploaded successfully!',
      profilePicture: base64
    })

  } catch (error) {
    console.error('❌ Profile picture upload error:', error)
    return NextResponse.json({
      error: 'Failed to upload profile picture'
    }, { status: 500 })
  }
}
