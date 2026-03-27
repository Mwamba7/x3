import WithdrawalClient from '../../components/WithdrawalClient'

export const metadata = {
  title: 'Withdraw Money — Super Twice Resellers',
  description: 'Withdraw money from your sales to your mobile money account.',
}

export default function WithdrawalPage() {
  return (
    <main className="container" style={{ padding: '24px 0' }}>
      <header style={{ marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, marginBottom: 6, fontSize: 16 }}>💳 Withdraw Money</h2>
        <p className="meta" style={{ margin: '16px 0 0 0', fontSize: 14, lineHeight: 1.5 }}>
          Withdraw money from your sales to your mobile money account.
        </p>
      </header>

      <WithdrawalClient />
    </main>
  )
}
