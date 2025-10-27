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
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
          <thead>
            <tr style={{ textAlign: 'left' }}>
              <th style={{ padding: '12px 8px', borderBottom: '2px solid #253049', fontWeight: '600' }}>Product</th>
              <th style={{ padding: '12px 8px', borderBottom: '2px solid #253049', fontWeight: '600' }}>Category</th>
              <th style={{ padding: '12px 8px', borderBottom: '2px solid #253049', fontWeight: '600' }}>Price</th>
              <th style={{ padding: '12px 8px', borderBottom: '2px solid #253049', fontWeight: '600' }}>Status</th>
              <th style={{ padding: '12px 8px', borderBottom: '2px solid #253049', fontWeight: '600', textAlign: 'center' }}>Actions</th>
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
                  padding: '12px 8px', 
                  borderBottom: '1px solid #223',
                  maxWidth: '200px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }} title={p.name}>
                  <strong>{p.name}</strong>
                </td>
                <td style={{ 
                  padding: '12px 8px', 
                  borderBottom: '1px solid #223',
                  textTransform: 'capitalize'
                }}>
                  <span style={{
                    padding: '4px 8px',
                    backgroundColor: '#253049',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {p.category}
                  </span>
                </td>
                <td style={{ 
                  padding: '12px 8px', 
                  borderBottom: '1px solid #223',
                  fontWeight: '600',
                  color: '#4ade80'
                }}>
                  Ksh {Number(p.price).toLocaleString('en-KE')}
                </td>
                <td style={{ padding: '12px 8px', borderBottom: '1px solid #223' }}>
                  <span style={{
                    padding: '4px 12px',
                    backgroundColor: p.status === 'available' ? '#065f46' : '#7c2d12',
                    color: p.status === 'available' ? '#10b981' : '#f87171',
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}>
                    {p.status === 'available' ? '✅ Available' : '❌ Sold'}
                  </span>
                </td>
                <td style={{ 
                  padding: '12px 8px', 
                  borderBottom: '1px solid #223',
                  textAlign: 'center'
                }}>
                  <button 
                    className="btn btn-small" 
                    onClick={() => {
                      router.push(`/admin/${section}/${p.id}`);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 12px',
                      backgroundColor: '#1d4ed8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      transition: 'all 0.2s ease',
                      minWidth: '80px',
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
