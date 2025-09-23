"use client"

import { useEffect, useMemo, useState } from 'react'

export default function ContactPage() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
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

  const open = isOpen(now)
  const dayIdx = now.getDay()
  const today = schedule[(dayIdx + 6) % 7]

  function formatTime(h) {
    const period = h >= 12 ? 'pm' : 'am'
    const hr = ((h + 11) % 12) + 1 // 0->12, 13->1
    return `${hr}:00 ${period}`
  }

  return (
    <main className="container" style={{ padding: '24px 0' }}>
      <h2 style={{ marginTop: 0, marginBottom: 8 }}>Contact Us</h2>
      <p>Email: <a href="mailto:sales@thinktwiceresellers.com">sales@thinktwiceresellers.com</a></p>
      <p>Phone: <a href="tel:+254718176584">+254718176584</a></p>

      <div className="status" style={{ marginTop: 8, fontWeight: 600 }}>
        Status: {open ? <span style={{ color: 'var(--primary)' }}>Open</span> : <span style={{ color: '#f2994a' }}>Closed</span>} {today?.window ? `— Today: ${today.day} ${formatTime(today.window[0])}–${formatTime(today.window[1])}` : `— Today: ${today?.day} Closed`}
      </div>

      <section style={{ marginTop: 14 }}>
        <h3 style={{ margin: '12px 0' }}>Deliveries</h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 6 }}>
          <li style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', border: '1px solid #253049', background: 'var(--card)', borderRadius: 10, padding: '8px 12px', columnGap: 10 }}>
            <span style={{ fontWeight: 700, textAlign: 'left' }}>Wednesday</span>
            <span style={{ color: 'var(--muted)', textAlign: 'center', minWidth: 120 }}>{`${formatTime(8)} – ${formatTime(17)}`}</span>
            <span style={{ textAlign: 'right' }}>Nairobi & Surrounds</span>
          </li>
          <li style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', border: '1px solid #253049', background: 'var(--card)', borderRadius: 10, padding: '8px 12px', columnGap: 10 }}>
            <span style={{ fontWeight: 700, textAlign: 'left' }}>Thursday</span>
            <span style={{ color: 'var(--muted)', textAlign: 'center', minWidth: 120 }}>{`${formatTime(8)} – ${formatTime(17)}`}</span>
            <span style={{ textAlign: 'right' }}>Naivasha</span>
          </li>
        </ul>
        <p className="helper" style={{ marginTop: 8, fontSize: 14 }}>Closed on public holidays.</p>
      </section>

      <section className="info-section">
        <h3 style={{ margin: '12px 0' }}>How We Can Help</h3>
        <p className="meta" style={{ margin: 0, fontSize: 15 }}>We are available during working hours to assist with product questions, availability, and order support.</p>
        <ul style={{ margin: '10px 0 0', paddingLeft: 18 }}>
          <li><strong>Address:</strong> Along Naivasha Road, Nairobi.</li>
          <li><strong>Response time:</strong> We aim to respond within 1 business day.</li>
          <li><strong>Service areas:</strong> Nairobi & Surrounding areas, Naivasha (scheduled days).</li>
          <li><strong>Payment policy:</strong> Payment is made once the goods have been delivered and confirmed.</li>
        </ul>
      </section>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
        <a className="btn btn-primary" target="_blank" rel="noopener noreferrer" href="https://wa.me/254718176584">WhatsApp</a>
        <a className="btn" href="mailto:sales@thinktwiceresellers.com?subject=Inquiry">Email Us</a>
      </div>
    </main>
  )
}
