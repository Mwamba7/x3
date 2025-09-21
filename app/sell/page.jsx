import SellForm from '../../components/SellForm'

export const metadata = {
  title: 'Sell Your Product — Think Twice Resellers',
  description: 'Upload images and describe your product. We will receive your details via WhatsApp or email.',
}

export default function SellPage() {
  return (
    <main className="container" style={{ padding: '24px 0' }}>
      <header style={{ marginBottom: 14 }}>
        <h2 style={{ marginTop: 0, marginBottom: 6 }}>Sell Your Product</h2>
        <p className="meta" style={{ margin: 0, fontSize: 16, lineHeight: 1.5 }}>Kindly provide accurate details to help us value your product and process your request quickly.</p>
      </header>

      <div className="sell-layout" style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr', alignItems: 'start' }}>
        <section style={{ padding: 0 }}>
          <SellForm />
        </section>
        <aside style={{ padding: 0 }}>
          <h3 style={{ marginTop: 0, marginBottom: 8 }}>Tips for Faster Processing</h3>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>Include clear photos (front, back, close‑ups).</li>
            <li>Describe condition honestly (scratches, battery health, etc.).</li>
            <li>Add accessories included (charger, box, cables).</li>
          </ul>
          <h4 style={{ marginTop: 14, marginBottom: 6 }}>Payment & Policy</h4>
          <p className="meta" style={{ margin: 0, fontSize: 14 }}>Payment is made once the goods have been delivered and confirmed. Closed on public holidays.</p>
        </aside>
      </div>
    </main>
  )
}
