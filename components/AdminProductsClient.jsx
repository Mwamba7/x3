'use client'

import { useMemo, useState } from 'react'

export default function AdminProductsClient({ initial }) {
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
    <section style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          className="form-control"
          style={{ maxWidth: 320 }}
          placeholder="Search by name, category, or status"
          value={query}
          onChange={(e) => { setPage(1); setQuery(e.target.value) }}
        />
        <span className="meta" style={{ marginLeft: 'auto' }}>{filtered.length} item(s)</span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left' }}>
              <th style={{ padding: '8px 6px', borderBottom: '1px solid #253049' }}>Name</th>
              <th style={{ padding: '8px 6px', borderBottom: '1px solid #253049' }}>Category</th>
              <th style={{ padding: '8px 6px', borderBottom: '1px solid #253049' }}>Price (Ksh)</th>
              <th style={{ padding: '8px 6px', borderBottom: '1px solid #253049' }}>Status</th>
              <th style={{ padding: '8px 6px', borderBottom: '1px solid #253049' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((p) => (
              <tr key={p.id}>
                <td style={{ padding: '8px 6px', borderBottom: '1px solid #223' }}>{p.name}</td>
                <td style={{ padding: '8px 6px', borderBottom: '1px solid #223' }}>{p.category}</td>
                <td style={{ padding: '8px 6px', borderBottom: '1px solid #223' }}>{Number(p.price).toLocaleString('en-KE')}</td>
                <td style={{ padding: '8px 6px', borderBottom: '1px solid #223' }}>{p.status}</td>
                <td style={{ padding: '8px 6px', borderBottom: '1px solid #223' }}>
                  <a className="btn btn-small" href={`/admin/products/${p.id}`}>Edit</a>
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
