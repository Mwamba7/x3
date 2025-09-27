'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

export default function HeroRotator({ products = [], intervalMs = 7000 }) {
  const list = useMemo(() => (Array.isArray(products) ? products.filter(p => p?.id && p?.img) : []), [products])
  const [idx, setIdx] = useState(0)
  const [lightText, setLightText] = useState(true) // true => light text on dark bg

  useEffect(() => {
    if (!list.length) return
    const t = setInterval(() => {
      setIdx(i => (i + 1) % list.length)
    }, Math.max(1500, intervalMs || 5000))
    return () => clearInterval(t)
  }, [list.length, intervalMs])

  if (!list.length) return null
  const cur = list[idx]

  // Recompute text color when the current image changes
  useEffect(() => {
    if (!cur?.img) return
    let cancelled = false
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const w = 64, h = 64
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.drawImage(img, 0, 0, w, h)
        const { data } = ctx.getImageData(0, 0, w, h)
        let sum = 0, count = 0
        // Sample every 4th pixel to be cheap
        for (let i = 0; i < data.length; i += 16) {
          const r = data[i], g = data[i + 1], b = data[i + 2]
          // standard luminance approximation
          const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
          sum += lum; count++
        }
        const avg = count ? sum / count : 0
        // If background is bright (avg > ~160), use dark text; else light text
        const useLight = !(avg > 160)
        if (!cancelled) setLightText(useLight)
      } catch {
        // Fallback: keep current setting
      }
    }
    img.src = cur.img
    return () => { cancelled = true }
  }, [cur?.img])

  return (
    <>
      {/* background image (centered, reduced width, full height) */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
        <div style={{ position: 'absolute', inset: 0, transition: 'opacity 500ms ease' }}>
          <img
            key={idx}
            src={cur.img}
            alt={cur.name}
            style={{ width: '100%', height: '87%', objectFit: 'cover', filter: 'brightness(0.9) contrast(1.08)', animation: 'heroSlideIn 700ms ease both' }}
          />
        </div>
      </div>
      {/* upper-left note/title (auto color) */}
      <div
        style={{
          position: 'absolute',
          left: 12,
          top: 12,
          zIndex: 1,
          color: lightText ? '#ffffff' : '#0a101a',
          textShadow: lightText ? '0 1px 2px rgba(0,0,0,0.45)' : '0 1px 2px rgba(255,255,255,0.35)',
          maxWidth: '70vw',
        }}
      >
        <h3 style={{ margin: 0, fontSize: 'clamp(14px, 2vw, 20px)', wordBreak: 'break-word' }}>{cur.name}</h3>
      </div>
      {/* bottom-right button (fixed position, stable sizing) */}
      <div
        style={{
          position: 'absolute',
          right: 12,
          bottom: 6,
          display: 'grid',
          gap: 6,
          textAlign: 'right',
          zIndex: 1,
          maxWidth: '60vw',
          alignItems: 'end',
        }}
      >
        <Link
          href={`/product/${cur.id}`}
          className="btn btn-primary"
          style={{
            alignSelf: 'end',
            width: 100,
            height: '8px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            lineHeight: '20px',
            color: lightText ? '#0a101a' : '#0a101a',
          }}
        >
          Buy Now
        </Link>
      </div>

      <style>{`@keyframes heroSlideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
    </>
  )
}
