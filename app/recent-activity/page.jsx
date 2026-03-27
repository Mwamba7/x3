import RecentActivityClient from '../../components/RecentActivityClient'

export const metadata = {
  title: 'Recent Activity — Super Twice Resellers',
  description: 'View your recent orders, sales, and activity from the last 60 days.',
}

export default function RecentActivityPage() {
  return (
    <main className="container" style={{ padding: '24px 0' }}>
      <header style={{ marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, marginBottom: 6, fontSize: 16 }}>Recent Activity</h2>
        <p className="meta" style={{ margin: '16px 0 0 0', fontSize: 14, lineHeight: 1.5 }}>
          Track your recent orders, sales, and activity from the last 60 days.
        </p>
      </header>

      <RecentActivityClient />
    </main>
  )
}
