import MySalesClient from '../../components/MySalesClient'

export const metadata = {
  title: 'My Sales — Super Twice Resellers',
  description: 'View all your sales and withdrawal history.',
}

export default function MySalesPage() {
  return (
    <main className="container" style={{ padding: '24px 0' }}>
      <header style={{ marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, marginBottom: 6, fontSize: 16 }}>My Sales</h2>
        <p className="meta" style={{ margin: '16px 0 0 0', fontSize: 14, lineHeight: 1.5 }}>
          Track all your sales and manage withdrawal requests.
        </p>
      </header>

      <MySalesClient />
    </main>
  )
}
