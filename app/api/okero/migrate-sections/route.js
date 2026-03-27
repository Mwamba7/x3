import { NextResponse } from 'next/server'
import { migrateToSections, rollbackMigration } from '../../../../scripts/migrate-sections'
import { requireAdmin } from '../../../../lib/adminAuth'

export async function POST(req) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { action } = await req.json()
    
    if (action === 'migrate') {
      const result = await migrateToSections()
      return NextResponse.json(result)
    } else if (action === 'rollback') {
      const result = await rollbackMigration()
      return NextResponse.json(result)
    } else {
      return NextResponse.json({ error: 'Invalid action. Use "migrate" or "rollback"' }, { status: 400 })
    }
  } catch (error) {
    console.error('Migration API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
