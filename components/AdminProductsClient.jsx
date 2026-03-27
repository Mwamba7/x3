'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminProductsClient({ initial, section = 'products' }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 20

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return initial
    return initial.filter(p =>
      (p.name?.toLowerCase().includes(q)) ||
      (p.category?.toLowerCase().includes(q)) ||
      (p.status?.toLowerCase().includes(q))
    )
  }, [initial, query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const current = Math.min(page, totalPages)
  const start = (current - 1) * pageSize
  const visible = filtered.slice(start, start + pageSize)

  return (
    <section style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          className="form-control"
          style={{ maxWidth: 320, flex: '1', minWidth: '200px' }}
          placeholder="🔍 Search by name, category, or status..."
          value={query}
          onChange={(e) => { setPage(1); setQuery(e.target.value) }}
        />
        <span className="meta" style={{ 
          padding: '8px 12px',
          backgroundColor: '#253049',
          borderRadius: '16px',
          fontSize: '13px',
          fontWeight: '500'
        }}>
          📊 {filtered.length} product{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px', fontSize: '16px' }}>
          <thead>
            <tr style={{ textAlign: 'left' }}>
              <th style={{ padding: '16px 12px', borderBottom: '2px solid #253049', fontWeight: '600', fontSize: '16px' }}>Product</th>
              <th style={{ padding: '16px 12px', borderBottom: '2px solid #253049', fontWeight: '600', fontSize: '16px' }}>Category</th>
              <th style={{ padding: '16px 12px', borderBottom: '2px solid #253049', fontWeight: '600', fontSize: '16px' }}>Price</th>
              <th style={{ padding: '16px 12px', borderBottom: '2px solid #253049', fontWeight: '600', fontSize: '16px' }}>Status</th>
              <th style={{ padding: '16px 12px', borderBottom: '2px solid #253049', fontWeight: '600', fontSize: '16px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((p) => (
              <tr key={p.id} style={{ 
                transition: 'background-color 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a2332'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <td style={{ 
                  padding: '16px 12px', 
                  borderBottom: '1px solid #223',
                  maxWidth: '250px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: '16px'
                }} title={p.name}>
                  <strong>{p.name}</strong>
                </td>
                <td style={{ 
                  padding: '16px 12px', 
                  borderBottom: '1px solid #223',
                  textTransform: 'capitalize',
                  fontSize: '16px'
                }}>
                  <span style={{
                    padding: '6px 12px',
                    backgroundColor: '#253049',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    {p.category}
                  </span>
                </td>
                <td style={{ 
                  padding: '16px 12px', 
                  borderBottom: '1px solid #223',
                  fontWeight: '600',
                  color: '#4ade80',
                  fontSize: '16px'
                }}>
                  Ksh {Number(p.price).toLocaleString('en-KE')}
                </td>
                <td style={{ padding: '16px 12px', borderBottom: '1px solid #223', fontSize: '16px' }}>
                  <span style={{
                    padding: '6px 14px',
                    backgroundColor: p.status === 'available' ? '#065f46' : '#7c2d12',
                    color: p.status === 'available' ? '#10b981' : '#f87171',
                    borderRadius: '16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}>
                    {p.status === 'available' ? '✅ Available' : '❌ Sold'}
                  </span>
                </td>
                <td style={{ 
                  padding: '16px 12px', 
                  borderBottom: '1px solid #223',
                  textAlign: 'center',
                  fontSize: '16px'
                }}>
                  <button 
                    className="btn btn-small" 
                    onClick={() => {
                      router.push(`/okero/${section}/${p.id}`);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      backgroundColor: '#1d4ed8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '15px',
                      fontWeight: '500',
                      transition: 'all 0.2s ease',
                      minWidth: '100px',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#1e40af'
                      e.target.style.transform = 'translateY(-1px)'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#1d4ed8'
                      e.target.style.transform = 'translateY(0)'
                    }}
                    title={`Edit ${p.name}`}
                  >
                    ✏️ Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pager page={current} totalPages={totalPages} onChange={setPage} />
    </section>
  )
}

function Pager({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <button className="btn" onClick={() => onChange(Math.max(1, page - 1))} disabled={page <= 1}>Prev</button>
      <span className="meta">Page {page} / {totalPages}</span>
      <button className="btn" onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>Next</button>
    </div>
  )
}
