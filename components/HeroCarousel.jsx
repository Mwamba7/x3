'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

/**
 * HeroCarousel
 * - Full-bleed background carousel meant to be placed inside the existing hero <section>
 * - Renders horizontally sliding images behind the .hero-overlay content
 * - Supports promotional popups/badges per slide (flash sale, shop now, price, etc.)
 */
export default function HeroCarousel({ slides = [], intervalMs = 5000 }) {
  const [index, setIndex] = useState(0)
  const timerRef = useRef(null)

  const safeSlides = useMemo(() => {
    const arr = Array.isArray(slides) ? slides.filter(s => s && s.imageUrl) : []
    if (arr.length) return arr
    // Fallback demo slides
    return [
      {
        imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1600&auto=format&fit=crop',
        popupType: 'flash_sale',
        title: 'Flash Sale',
        subtitle: 'Limited time deals on top electronics',
        price: 19999,
        ctaLabel: 'Shop Now',
        ctaHref: '/#collection',
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=1600&auto=format&fit=crop',
        popupType: 'shop_now',
        title: 'Certified Pre‑Owned',
        subtitle: 'Save big with warranty included',
        price: 0,
        ctaLabel: 'Browse',
        ctaHref: '/#collection',
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1511914265871-b4456a12ea49?q=80&w=1600&auto=format&fit=crop',
        popupType: 'price_drop',
        title: 'Price Drop',
        subtitle: 'Popular items now more affordable',
        price: 0,
        ctaLabel: 'View Deals',
        ctaHref: '/#collection',
      },
    ]
  }, [slides])

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => setIndex(i => (i + 1) % safeSlides.length), Math.max(2500, intervalMs))
    return () => timerRef.current && clearInterval(timerRef.current)
  }, [safeSlides.length, intervalMs])

  return (
    <div className="hero-carousel">
      <div className="hero-track" style={{ transform: `translateX(-${index * 100}%)` }}>
        {safeSlides.map((s, i) => (
          <div className="hero-slide" key={i}>
            <img src={s.imageUrl} alt={s.title || 'promotion'} className="hero-slide-img" />
            <SlidePopup slide={s} />
          </div>
        ))}
      </div>
      <div className="hero-dots">
        {safeSlides.map((_, i) => (
          <button
            key={i}
            className={`dot ${i === index ? 'active' : ''}`}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
      <style jsx>{`
        .hero-carousel {
          position: absolute;
          inset: 0;
          overflow: hidden;
          z-index: 0; /* behind overlay */
        }
        .hero-track {
          height: 100%;
          width: ${slides && slides.length ? slides.length : 3}00%;
          display: flex;
          transition: transform 700ms ease-in-out;
        }
        .hero-slide {
          position: relative;
          flex: 0 0 100%;
          height: 100%;
        }
        .hero-slide-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: brightness(0.65);
        }
        .hero-dots {
          position: absolute;
          left: 50%;
          bottom: 14px;
          transform: translateX(-50%);
          display: flex;
          gap: 8px;
          z-index: 2;
        }
        .dot {
          width: 8px; height: 8px;
          border-radius: 999px;
          background: rgba(255,255,255,0.6);
          border: none;
          cursor: pointer;
        }
        .dot.active { background: #fff; width: 18px; }
      `}</style>
    </div>
  )
}

function SlidePopup({ slide }) {
  const type = (slide?.popupType || '').toLowerCase()
  const price = slide?.price
  const title = slide?.title
  const subtitle = slide?.subtitle
  // CTA is intentionally not rendered here; it will be placed in the hero overlay instead

  const badge = type === 'flash_sale' ? 'FLASH SALE' : type === 'price_drop' ? 'PRICE DROP' : type === 'shop_now' ? 'SHOP NOW' : null

  return (
    <>
      {/* Top-left: badge + optional subtitle */}
      <div className="slide-tl" aria-hidden={!badge && !subtitle}>
        {badge && <span className="badge">{badge}</span>}
        {subtitle && <p className="sub">{subtitle}</p>}
      </div>
      {/* Top-right: price */}
      {Number.isFinite(price) && price > 0 && (
        <div className="slide-tr"><span className="price">Ksh {price.toLocaleString()}</span></div>
      )}
      {/* Bottom-right: title */}
      <div className="slide-br">
        {title && <h3 className="headline">{title}</h3>}
      </div>
      <style jsx>{`
        .slide-tl {
          position: absolute; left: 12px; top: 12px; z-index: 1; color: #fff; display: grid; gap: 4px;
          text-shadow: 0 1px 2px rgba(0,0,0,0.45);
        }
        .slide-tr {
          position: absolute; right: 12px; top: 12px; z-index: 1; color: #fff;
          text-shadow: 0 1px 2px rgba(0,0,0,0.45);
        }
        .slide-br {
          position: absolute; right: 12px; bottom: 12px; z-index: 1; color: #fff; text-align: right; display: grid; gap: 4px;
          text-shadow: 0 1px 2px rgba(0,0,0,0.45);
        }
        .badge {
          display: inline-block; font-size: 10px; letter-spacing: 0.14em; background: linear-gradient(90deg, #ef4444, #f59e0b);
          color: #fff; padding: 4px 8px; border-radius: 999px; width: fit-content;
        }
        .headline { margin: 0; font-size: clamp(12px, 1.6vw, 16px); font-weight: 700; }
        .sub { margin: 0; opacity: 0.9; font-size: clamp(10px, 1.4vw, 14px); }
        .price { font-weight: 700; font-size: clamp(11px, 1.5vw, 15px); background: rgba(0,0,0,0.35); padding: 4px 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.25); }
      `}</style>
    </>
  )
}
