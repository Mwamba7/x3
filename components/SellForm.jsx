'use client'

import { useState } from 'react'

const WHATSAPP_NUMBER = '254718176584'

export default function SellForm() {
  // Seller details
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')

  // Product details
  const [name, setName] = useState('')
  const [category, setCategory] = useState('tv')
  const [price, setPrice] = useState('')
  const [specs, setSpecs] = useState('')
  const [files, setFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const [status, setStatus] = useState('')
  const [errors, setErrors] = useState({})

  function onFilesChange(e) {
    const picked = Array.from(e.target.files || []).slice(0, 5)
    setFiles(picked)
    const urls = picked.map(f => URL.createObjectURL(f))
    setPreviews(urls)
  }

  async function onSubmit(e) {
    e.preventDefault()
    setStatus('')
    setErrors({})

    // Basic validation
    const nextErrors = {}
    if (!fullName.trim()) nextErrors.fullName = 'Your full name is required'
    if (!phone.trim()) nextErrors.phone = 'Your phone number is required'
    if (!name.trim()) nextErrors.name = 'Product name is required'
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    const text = [
      'New product for sale',
      '',
      `Seller: ${fullName}`,
      `Phone: ${phone}`,
      '',
      `Category: ${category}`,
      `Name: ${name}`,
      `Price: ${price ? `Ksh ${price}` : 'N/A'}`,
      `Specs: ${specs || 'N/A'}`
    ].filter(Boolean).join('\n')

    // Try Web Share API with files (mobile browsers)
    try {
      if (navigator.canShare && files.length > 0 && navigator.canShare({ files })) {
        await navigator.share({
          title: `Sell: ${name}`,
          text,
          files,
        })
        setStatus('Shared via device share sheet. Select WhatsApp to send.')
        return
      }
    } catch (err) {
      console.warn('Share failed; falling back to WhatsApp link', err)
    }

    // Fallback: open WhatsApp with prefilled text
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
    setStatus('Opened WhatsApp with your product details. Please attach images in WhatsApp.')
  }

  return (
    <div className="sell-wrap">
      <form onSubmit={onSubmit} className="sell-form" style={{ display: 'grid', gap: 16 }}>
        {/* Seller details */}
        <fieldset style={{ border: '1px solid #253049', borderRadius: 12, padding: 12 }}>
          <legend style={{ padding: '0 6px', color: 'var(--muted)' }}>Your Details</legend>
          <div className="grid-2" style={{ alignItems: 'start' }}>
            <div>
              <label className="form-label" htmlFor="fullName">Full Name</label>
              <input className="form-control" id="fullName" type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g. Nick Mwamba" style={{ width: '100%' }} />
              {errors.fullName && <div style={{ color: '#f2994a', fontSize: 12, marginTop: 4 }}>{errors.fullName}</div>}
            </div>
            <div>
              <label className="form-label" htmlFor="phone">Phone</label>
              <input className="form-control" id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. 0771184059" style={{ width: '100%' }} />
              {errors.phone && <div style={{ color: '#f2994a', fontSize: 12, marginTop: 4 }}>{errors.phone}</div>}
            </div>
          </div>
        </fieldset>

        {/* Product details */}
        <fieldset style={{ border: '1px solid #253049', borderRadius: 12, padding: 12 }}>
          <legend style={{ padding: '0 6px', color: 'var(--muted)' }}>Product Details</legend>
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr', alignItems: 'start' }}>
            <div className="grid-2">
              <div style={{ width: '100%' }}>
                <label className="form-label" htmlFor="category">Category</label>
                <select className="form-control" id="category" value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%' }}>
                  <option value="tv">Television</option>
                  <option value="radio">Radio</option>
                  <option value="phone">Mobile Phone</option>
                  <option value="fridge">Fridge</option>
                  <option value="cooler">Gas Cooler</option>
                  <option value="accessory">Accessory</option>
                </select>
              </div>
              <div style={{ width: '100%' }}>
                <label className="form-label" htmlFor="price">Expected Price (Ksh)</label>
                <input className="form-control" id="price" type="number" min="0" step="1" value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 25000" style={{ width: '100%' }} />
              </div>
            </div>

            <div>
              <label className="form-label" htmlFor="name">Product Name</label>
              <input className="form-control" id="name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Samsung 55&quot; LED TV" style={{ width: '100%' }} />
              {errors.name && <div style={{ color: '#f2994a', fontSize: 12, marginTop: 4 }}>{errors.name}</div>}
            </div>

            <div>
              <label className="form-label" htmlFor="specs">Specs / Description</label>
              <textarea className="form-control" id="specs" rows={5} value={specs} onChange={e => setSpecs(e.target.value)} placeholder="Key details, condition, storage, accessories, etc." style={{ width: '100%' }} />
            </div>
          </div>
        </fieldset>

        {/* Photos */}
        <fieldset style={{ border: '1px solid #253049', borderRadius: 12, padding: 12 }}>
          <legend style={{ padding: '0 6px', color: 'var(--muted)' }}>Photos</legend>
          <div style={{ display: 'grid', gap: 8 }}>
            <input className="form-control" id="images" type="file" accept="image/*" multiple onChange={onFilesChange} style={{ width: '100%' }} />
            {previews.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 8 }}>
                {previews.map((src, i) => (
                  <div key={i} style={{ position: 'relative', aspectRatio: '1 / 1', borderRadius: 10, overflow: 'hidden', border: '1px solid #253049' }}>
                    <img src={src} alt={`Preview ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </div>
                ))}
              </div>
            )}
            <div className="helper" style={{ fontSize: 14 }}>On some devices, you can share images directly via the device share sheet. Or, you can attach them in WhatsApp after the message opens.</div>
          </div>
        </fieldset>

        {/* Actions */}
        <div className="form-row" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" type="submit">Send via WhatsApp</button>
          <a className="btn" href={`mailto:sales@supertwiceresellers.com?subject=Sell Product: ${encodeURIComponent(name)}&body=${encodeURIComponent(`Seller: ${fullName}\nPhone: ${phone}\n\nCategory: ${category}\nPrice: ${price}\nSpecs: ${specs}`)}`}>Email Instead</a>
        </div>

        {status && <p className="status">{status}</p>}
      </form>
    </div>
  )
}
