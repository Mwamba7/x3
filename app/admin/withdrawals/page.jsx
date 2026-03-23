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
    <main className="container" style={{ padding: '32px 8px', maxWidth: '1400px', marginLeft: '2px' }}>
      <h2 style={{ marginTop: 0, marginBottom: 10 }}>Withdrawal Requests</h2>
      <WithdrawalRequestsClient initial={withdrawals} />
    </main>
  )
}
