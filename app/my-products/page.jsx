import MyProductsClient from '../../components/MyProductsClient'

export const metadata = {
  title: 'My Products — Super Twice Resellers',
  description: 'View all your submitted products and their approval status.',
}

export default function MyProductsPage() {
  return (
    <main className="container" style={{ padding: '24px 0' }}>
      <header style={{ marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, marginBottom: 6, fontSize: 16 }}>My Products</h2>
        <p className="meta" style={{ margin: '16px 0 0 0', fontSize: 14, lineHeight: 1.5 }}>
          Track the status of all your submitted products and see their approval progress.
        </p>
      </header>

      <MyProductsClient />
    </main>
  )
}
