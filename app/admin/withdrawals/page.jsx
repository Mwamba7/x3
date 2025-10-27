import { redirect } from 'next/navigation'
import { requireAdmin } from '../../../lib/adminAuth'
import connectDB from '../../../lib/mongodb'
import WithdrawalRequest from '../../../models/WithdrawalRequest'
import WithdrawalRequestsClient from '../../../components/WithdrawalRequestsClient'

export const dynamic = 'force-dynamic'

export default async function AdminWithdrawalsPage() {
  const user = await requireAdmin()
  if (!user) redirect('/admin/login')
  
  await connectDB()
  
  const rawWithdrawals = await WithdrawalRequest.find({})
    .sort({ createdAt: -1 })
    .lean()

  // Map _id to id for the client component
  const withdrawals = rawWithdrawals.map(w => ({
    ...w,
    id: w._id.toString(),
    _id: w._id.toString()
  }))

  return (
    <main className="container" style={{ padding: '24px 0' }}>
      <h2 style={{ marginTop: 0, marginBottom: 10 }}>Withdrawal Requests</h2>
      <Controls current="withdrawals" />
      <WithdrawalRequestsClient initial={withdrawals} />
    </main>
  )
}

function Controls({ current = '' }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
      <a className="btn" href="/admin" title="Admin Dashboard">← Dashboard</a>
      <a className={`btn${current==='products'?' btn-primary':''}`} href="/admin/products" aria-current={current==='products'?'page':undefined} title="Go to: Collection">Collection</a>
      <a className={`btn${current==='fashion'?' btn-primary':''}`} href="/admin/fashion" aria-current={current==='fashion'?'page':undefined} title="Go to: Fashion">Fashion</a>
      <a className={`btn${current==='preowned'?' btn-primary':''}`} href="/admin/preowned" aria-current={current==='preowned'?'page':undefined} title="Go to: Pre-owned">Pre-owned</a>
      <a className={`btn${current==='pending'?' btn-primary':''}`} href="/admin/pending" aria-current={current==='pending'?'page':undefined} title="Go to: Pending">Pending</a>
      <a className={`btn${current==='withdrawals'?' btn-primary':''}`} href="/admin/withdrawals" aria-current={current==='withdrawals'?'page':undefined} title="You are on: Withdrawals">Withdrawals</a>
      <a className="btn" href="/admin/change-password">Change Password</a>
      <form action="/api/auth/logout" method="post" style={{ display: 'inline' }}>
        <button className="btn" type="submit">Logout</button>
      </form>
    </div>
  )
}
