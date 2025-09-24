'use client'

import { useState } from 'react'

// Approximate coordinates for Naivasha Road, Nairobi (near Junction Mall area)
const DEST_LAT = -1.3006
const DEST_LNG = 36.7532
const DEST_LABEL = 'Super Twice Resellers (Naivasha Road)'

export default function MapDirections() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const openDirections = () => {
    setError('')
    if (!('geolocation' in navigator)) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(DEST_LABEL)}&destination_place_id=&destination=${DEST_LAT},${DEST_LNG}`,'_blank')
      return
    }
    setBusy(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBusy(false)
        const { latitude, longitude } = pos.coords
        const url = `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${encodeURIComponent(DEST_LABEL)}&destination=${DEST_LAT},${DEST_LNG}`
        window.open(url, '_blank')
      },
      (err) => {
        setBusy(false)
        setError('Could not get your location. You can still open the map and get directions there.')
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(DEST_LABEL)}&destination=${DEST_LAT},${DEST_LNG}`,'_blank')
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    )
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div>
        <button className="btn btn-primary" onClick={openDirections} disabled={busy}>
          {busy ? 'Fetching your location…' : 'Get Directions from My Location'}
        </button>
      </div>
      {error && <p style={{ color: '#f2994a', margin: 0 }}>{error}</p>}
      <div>
        <a className="btn" target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(DEST_LABEL)}&query_place_id=&query=${DEST_LAT},${DEST_LNG}`}>
          Open Location in Google Maps
        </a>
      </div>
    </div>
  )
}
