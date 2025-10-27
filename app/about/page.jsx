"use client"

import { useEffect, useMemo, useState } from 'react'

export default function AboutPage() {
  const [now, setNow] = useState(null)

  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 60 * 1000)
    return () => clearInterval(id)
  }, [])

  const schedule = useMemo(() => ([
    { day: 'Monday',    window: [8, 17],  delivery: null },
    { day: 'Tuesday',   window: [8, 17],  delivery: null },
    { day: 'Wednesday', window: [8, 17],  delivery: 'Nairobi & Surrounds' },
    { day: 'Thursday',  window: [8, 17],  delivery: 'Naivasha' },
    { day: 'Friday',    window: [8, 17],  delivery: null },
    { day: 'Saturday',  window: [10, 16], delivery: null },
    { day: 'Sunday',    window: null,     delivery: null },
  ]), [])

  // Public holidays (YYYY-MM-DD). Add more as needed.
  const PUBLIC_HOLIDAYS = useMemo(() => new Set([
    // '2025-12-25', '2025-12-26',
  ]), [])

  function isOpen(d) {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const date = String(d.getDate()).padStart(2, '0')
    const iso = `${year}-${month}-${date}`
    if (PUBLIC_HOLIDAYS.has(iso)) return false

    const dayIdx = d.getDay() // 0=Sun
    const entry = schedule[(dayIdx + 6) % 7] // map Sun(0) to index 6
    if (!entry || !entry.window) return false
    const hour = d.getHours() + d.getMinutes() / 60
    const [start, end] = entry.window
    return hour >= start && hour < end
  }

  const open = now ? isOpen(now) : false
  const dayIdx = now ? now.getDay() : 0
  const today = schedule[(dayIdx + 6) % 7]

  function formatTime(h) {
    const period = h >= 12 ? 'pm' : 'am'
    const hr = ((h + 11) % 12) + 1 // 0->12, 13->1
    return `${hr}:00 ${period}`
  }

  return (
    <main className="container" style={{ padding: '20px 0' }}>
      {/* About Section */}
      <h2 style={{ marginTop: 0, marginBottom: 8, fontSize: 18 }}>About Super Twice Resellers</h2>
      <p className="meta" style={{ fontSize: 14 }}>We source, test, and refurbish quality pre‑owned electronics and appliances. Every item is thoroughly inspected and comes with a 30‑day limited warranty.</p>

      <section className="info-section" style={{ borderTop: '1px solid #223', paddingTop: 16 }}>
        <h3 style={{ margin: '0 0 8px' }}>Our Main Shop</h3>
        <p>We are located along <strong>Naivasha Road</strong> (Nairobi). Visit us to experience our products in person, or order online for delivery.</p>
        <ul>
          <li>Easy access from Ngong Road and Dagoretti Corner</li>
          <li>On‑site product demonstrations</li>
          <li>Friendly support and after‑sales service</li>
        </ul>
        <p style={{ marginBottom: 8 }}><strong>Payment policy:</strong> Payment is made once the goods have been delivered and confirmed.</p>
      </section>

      {/* Contact Section */}
      <section className="info-section" style={{ borderTop: '1px solid #223', paddingTop: 8, marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 8px' }}>Contact Us</h3>
        <p>Email: <a href="mailto:sales@supertwiceresellers.com">sales@supertwiceresellers.com</a></p>
        <p>Phone: <a href="tel:+254718176584">+254718176584</a></p>

        <div className="status" style={{ marginTop: 8, marginBottom: 0, fontWeight: 600 }}>
          Status: {open ? <span style={{ color: '#22c55e' }}>Open</span> : <span style={{ color: '#f2994a' }}>Closed</span>} {today?.window ? `— Today: ${today.day} ${formatTime(today.window[0])}–${formatTime(today.window[1])}` : `— Today: ${today?.day} Closed`}
        </div>

      </section>

      {/* Order Processing & Delivery Section */}
      <section className="info-section" style={{ marginTop: -8 }}>
        <h3 style={{ margin: '12px 0', fontSize: 18 }}>Order Processing & Delivery</h3>
        
        {/* Processing Information */}
        <div style={{ 
          border: '1px solid #253049', 
          borderRadius: 10, 
          padding: '12px 16px', 
          marginBottom: 16 
        }}>
          <h4 style={{ margin: '0 0 8px', color: '#22c55e', fontSize: 14 }}>⚡ Immediate Processing</h4>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.4 }}>
            <strong>Your order processing begins immediately upon confirmation.</strong> We prepare, test, and package your items as soon as your deposit is received, ensuring the fastest possible turnaround time.
          </p>
        </div>

        {/* Delivery Schedule */}
        <h4 style={{ margin: '16px 0 8px', fontSize: 13 }}>Weekly Delivery Coverage</h4>
        <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--muted)' }}>
          Our dedicated delivery teams ensure reliable service across key regions with optimized routes for maximum efficiency.
        </p>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
          <li style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', border: '1px solid #253049', background: 'var(--card)', borderRadius: 10, padding: '10px 14px', columnGap: 12 }}>
            <div style={{ textAlign: 'left' }}>
              <span style={{ fontWeight: 700, display: 'block' }}>Wednesday</span>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>Metro Route</span>
            </div>
            <span style={{ color: 'var(--muted)', textAlign: 'center', minWidth: 120, fontSize: 13 }}>{`${formatTime(8)} – ${formatTime(17)}`}</span>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontWeight: 600, display: 'block' }}>Nairobi & Surrounds</span>
            </div>
          </li>
          <li style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', border: '1px solid #253049', background: 'var(--card)', borderRadius: 10, padding: '10px 14px', columnGap: 12 }}>
            <div style={{ textAlign: 'left' }}>
              <span style={{ fontWeight: 700, display: 'block' }}>Thursday</span>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>Regional Route</span>
            </div>
            <span style={{ color: 'var(--muted)', textAlign: 'center', minWidth: 120, fontSize: 13 }}>{`${formatTime(8)} – ${formatTime(17)}`}</span>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontWeight: 600, display: 'block' }}>Naivasha</span>
            </div>
          </li>
        </ul>
        
        {/* Additional Information */}
        <div style={{ marginTop: 12, padding: '12px', background: 'rgba(42, 51, 66, 0.3)', borderRadius: 8 }}>
          <h5 style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--primary)' }}>Delivery Process</h5>
          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, lineHeight: 1.5 }}>
            <li><strong>Same-day processing:</strong> Orders confirmed before 2 PM are processed the same day</li>
            <li><strong>Quality assurance:</strong> All items undergo final testing before dispatch</li>
            <li><strong>Secure packaging:</strong> Professional packaging with protective materials</li>
            <li><strong>Real-time updates:</strong> SMS/WhatsApp notifications throughout the delivery process</li>
            <li><strong>Flexible scheduling:</strong> Coordinate delivery times that work for you</li>
          </ul>
        </div>
        
        <p className="helper" style={{ marginTop: 8, fontSize: 13, color: 'var(--muted)' }}>
          *Delivery schedules may be adjusted during public holidays. Express delivery available upon request for urgent orders.
        </p>
      </section>

      {/* How We Can Help Section */}
      <section className="info-section">
        <h3 style={{ margin: '12px 0', fontSize: 16 }}>How We Can Help</h3>
        <p className="meta" style={{ margin: 0, fontSize: 13 }}>We are available during working hours to assist with product questions, availability, and order support.</p>
        <ul style={{ margin: '10px 0 0', paddingLeft: 18 }}>
          <li><strong>Address:</strong> Along Naivasha Road, Nairobi.</li>
          <li><strong>Response time:</strong> We aim to respond within 1 business day.</li>
          <li><strong>Service areas:</strong> Nairobi & Surrounding areas, Naivasha (scheduled days).</li>
          <li><strong>Payment policy:</strong> Payment is made once the goods have been delivered and confirmed.</li>
        </ul>
      </section>

      {/* Map & Directions Section */}
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
