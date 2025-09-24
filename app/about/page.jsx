export const metadata = {
  title: 'About — Super Twice Resellers',
  description: 'Learn about Super Twice Resellers and our commitment to quality pre-owned products and sustainability.'
}

export default function AboutPage() {
  return (
    <main className="container" style={{ padding: '20px 0' }}>
      <h2 style={{ marginTop: 0, marginBottom: 8 }}>About Super Twice Resellers</h2>
      <p className="meta" style={{ fontSize: 16 }}>We source, test, and refurbish quality pre‑owned electronics and appliances. Every item is thoroughly inspected and comes with a 30‑day limited warranty.</p>

      <section className="info-section" style={{ borderTop: '1px solid #223', paddingTop: 16 }}>
        <h3 style={{ margin: '0 0 8px' }}>Our Main Shop</h3>
        <p>We are located along <strong>Naivasha Road</strong> (Nairobi). Visit us to experience our products in person, or order online for delivery.</p>
        <ul>
          <li>Easy access from Ngong Road and Dagoretti Corner</li>
          <li>On‑site product demonstrations</li>
          <li>Friendly support and after‑sales service</li>
        </ul>
        <p><strong>Payment policy:</strong> Payment is made once the goods have been delivered and confirmed.</p>
      </section>

      <section className="info-section">
        <h3 style={{ margin: '0 0 8px' }}>Map & Directions</h3>
        <div style={{ border: '1px solid #253049', borderRadius: 12, overflow: 'hidden', background: 'var(--card)' }}>
          <iframe
            title="Super Twice Resellers — Naivasha Road"
            width="100%"
            height="360"
            style={{ border: 0, display: 'block' }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            src={`https://www.google.com/maps?q=Naivasha+Road,Nairobi,Kenya&output=embed`}>
          </iframe>
        </div>
        <p className="meta" style={{ marginTop: 8 }}>Use the button below to open directions from your current location (geolocation permission required).</p>
        {/* Client component for live directions */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        {/* Import is safe: server page can render a client component */}
        {require('../../components/MapDirections.jsx').default && (() => {
          const MapDirections = require('../../components/MapDirections.jsx').default
          return <MapDirections />
        })()}
      </section>
    </main>
  )
}
