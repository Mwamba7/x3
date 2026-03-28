'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function WithdrawalRequestsClient({ initial }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [processing, setProcessing] = useState({})
  const [showProcessModal, setShowProcessModal] = useState(false)
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null)
  const pageSize = 20

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return initial
    return initial.filter(w =>
      (w.productName?.toLowerCase().includes(q)) ||
      (w.sellerName?.toLowerCase().includes(q)) ||
      (w.sellerPhone?.toLowerCase().includes(q)) ||
      (w.status?.toLowerCase().includes(q))
    )
  }, [initial, query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const current = Math.min(page, totalPages)
  const start = (current - 1) * pageSize
  const visible = filtered.slice(start, start + pageSize)

  function getStatusBadge(status) {
    const styles = {
      pending: { background: '#ffc107', color: '#212529' },
      processing: { background: '#17a2b8', color: '#fff' },
      completed: { background: '#28a745', color: '#fff' },
      cancelled: { background: '#dc3545', color: '#fff' }
    }
    
    const icons = {
      pending: '⏳',
      processing: '🔄',
      completed: '✅',
      cancelled: '❌'
    }
    
    return (
      <span style={{
        ...styles[status],
        padding: '4px 8px',
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'capitalize',
        minWidth: '80px',
        textAlign: 'center',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4
      }}>
        {icons[status]} {status}
      </span>
    )
  }

  function openProcessModal(withdrawal) {
    setSelectedWithdrawal(withdrawal)
    setShowProcessModal(true)
  }

  function closeProcessModal() {
    setShowProcessModal(false)
    setSelectedWithdrawal(null)
  }

  async function updateWithdrawalStatus(withdrawalId, status) {
    setProcessing(prev => ({ ...prev, [withdrawalId]: true }))
    
    try {
      const response = await fetch('/api/okero/withdrawals/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawalId, status })
      })

      const data = await response.json()
      
      if (response.ok) {
        alert(`Withdrawal status updated to ${status} successfully!`)
        router.refresh()
        closeProcessModal()
      } else {
        alert(data.error || `Failed to update withdrawal status`)
      }
    } catch (error) {
      alert('Network error. Please try again.')
    } finally {
      setProcessing(prev => ({ ...prev, [withdrawalId]: false }))
    }
  }

  return (
    <section style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          className="form-control"
          style={{ maxWidth: 320, flex: '1', minWidth: '200px' }}
          placeholder="🔍 Search by product, seller, phone, or status..."
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
          💳 {filtered.length} withdrawal{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
          <thead>
            <tr style={{ textAlign: 'left' }}>
              <th style={{ padding: '12px 8px', borderBottom: '2px solid #253049', fontWeight: '600' }}>Product</th>
              <th style={{ padding: '12px 8px', borderBottom: '2px solid #253049', fontWeight: '600' }}>Seller</th>
              <th style={{ padding: '12px 8px', borderBottom: '2px solid #253049', fontWeight: '600' }}>Amount</th>
              <th style={{ padding: '12px 8px', borderBottom: '2px solid #253049', fontWeight: '600' }}>Status</th>
              <th style={{ padding: '12px 8px', borderBottom: '2px solid #253049', fontWeight: '600' }}>Date</th>
              <th style={{ padding: '12px 8px', borderBottom: '2px solid #253049', fontWeight: '600', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((w) => (
              <tr key={w.id} style={{ 
                transition: 'background-color 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a2332'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <td style={{ 
                  padding: '12px 8px', 
                  borderBottom: '1px solid #223',
                  maxWidth: '200px'
                }}>
                  <div>
                    <strong style={{ display: 'block', marginBottom: 4 }}>{w.productName}</strong>
                    <span style={{ fontSize: '12px', color: '#a7b0c0' }}>
                      Sale: Ksh {Number(w.productPrice).toLocaleString('en-KE')}
                    </span>
                  </div>
                </td>
                <td style={{ 
                  padding: '12px 8px', 
                  borderBottom: '1px solid #223'
                }}>
                  <div>
                    <strong style={{ display: 'block', marginBottom: 4 }}>{w.sellerName}</strong>
                    <span style={{ fontSize: '12px', color: '#a7b0c0' }}>{w.sellerPhone}</span>
                  </div>
                </td>
                <td style={{ 
                  padding: '12px 8px', 
                  borderBottom: '1px solid #223'
                }}>
                  <div>
                    <strong style={{ color: '#4ade80', display: 'block', marginBottom: 4 }}>
                      Ksh {Math.round(Number(w.withdrawalAmount)).toLocaleString('en-KE')}
                    </strong>
                    <span style={{ fontSize: '12px', color: '#dc3545' }}>
                      Ksh {Math.round(Number(w.serviceFee)).toLocaleString('en-KE')}
                    </span>
                  </div>
                </td>
                <td style={{ padding: '12px 8px', borderBottom: '1px solid #223' }}>
                  {getStatusBadge(w.status)}
                </td>
                <td style={{ 
                  padding: '12px 8px', 
                  borderBottom: '1px solid #223',
                  fontSize: '12px',
                  color: '#a7b0c0'
                }}>
                  {new Date(w.requestDate).toLocaleDateString()}
                </td>
                <td style={{ 
                  padding: '12px 8px', 
                  borderBottom: '1px solid #223',
                  textAlign: 'center'
                }}>
                  {w.status === 'pending' && (
                    <button 
                      className="btn btn-small" 
                      onClick={() => openProcessModal(w)}
                      disabled={processing[w.id]}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 12px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '500',
                        transition: 'all 0.2s ease',
                        minWidth: '80px',
                        justifyContent: 'center',
                        cursor: processing[w.id] ? 'not-allowed' : 'pointer',
                        opacity: processing[w.id] ? 0.6 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!processing[w.id]) {
                          e.target.style.backgroundColor = '#218838'
                          e.target.style.transform = 'translateY(-1px)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!processing[w.id]) {
                          e.target.style.backgroundColor = '#28a745'
                          e.target.style.transform = 'translateY(0)'
                        }
                      }}
                      title={`Process withdrawal for ${w.sellerName}`}
                    >
                      {processing[w.id] ? '⏳ Processing...' : '💳 Process'}
                    </button>
                  )}
                  {w.status === 'processing' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="btn btn-small" 
                        onClick={() => updateWithdrawalStatus(w.id, 'completed')}
                        disabled={processing[w.id]}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 12px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '500',
                          transition: 'all 0.2s ease',
                          minWidth: '80px',
                          justifyContent: 'center',
                          cursor: processing[w.id] ? 'not-allowed' : 'pointer',
                          opacity: processing[w.id] ? 0.6 : 1
                        }}
                        title={`Mark as completed for ${w.sellerName}`}
                      >
                        {processing[w.id] ? '⏳ Completing...' : '✅ Complete'}
                      </button>
                      <button 
                        className="btn btn-small" 
                        onClick={() => updateWithdrawalStatus(w.id, 'cancelled')}
                        disabled={processing[w.id]}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 12px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '500',
                          transition: 'all 0.2s ease',
                          minWidth: '70px',
                          justifyContent: 'center',
                          cursor: processing[w.id] ? 'not-allowed' : 'pointer',
                          opacity: processing[w.id] ? 0.6 : 1
                        }}
                        title={`Cancel withdrawal for ${w.sellerName}`}
                      >
                        {processing[w.id] ? '⏳ Cancelling...' : '❌ Cancel'}
                      </button>
                    </div>
                  )}
                  {(w.status === 'completed' || w.status === 'cancelled') && (
                    <span style={{ fontSize: '12px', color: '#a7b0c0' }}>
                      {w.status === 'completed' ? '✅ Done' : '❌ Cancelled'}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {visible.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          background: '#1b2230',
          borderRadius: 8,
          border: '1px solid #253049'
        }}>
          <p style={{ margin: 0, color: '#a7b0c0' }}>
            {query ? 'No withdrawal requests found matching your search.' : 'No withdrawal requests yet.'}
          </p>
        </div>
      )}

      <Pager page={current} totalPages={totalPages} onChange={setPage} />

      {/* Process Withdrawal Modal */}
      {showProcessModal && selectedWithdrawal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'var(--card)',
            borderRadius: 12,
            padding: '24px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
            border: '1px solid #e1e8ed'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
              borderBottom: '1px solid #e1e8ed',
              paddingBottom: 16
            }}>
              <h3 style={{
                margin: 0,
                color: 'var(--text)',
                fontSize: 18,
                fontWeight: '600'
              }}>
                💳 Process Withdrawal
              </h3>
              <button
                onClick={closeProcessModal}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: 24,
                  cursor: 'pointer',
                  color: 'var(--muted)',
                  padding: '4px',
                  borderRadius: 4
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ marginBottom: 20, padding: '16px', backgroundColor: 'var(--surface)', borderRadius: 8 }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: 16, color: 'var(--text)' }}>
                {selectedWithdrawal.productName}
              </h4>
              <div style={{ display: 'grid', gap: 8, fontSize: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>Seller:</span>
                  <span style={{ color: 'var(--text)' }}>{selectedWithdrawal.sellerName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>Phone:</span>
                  <span style={{ color: 'var(--text)' }}>{selectedWithdrawal.sellerPhone}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>Sale Amount:</span>
                  <span style={{ color: 'var(--text)' }}>Ksh {Number(selectedWithdrawal.productPrice).toLocaleString('en-KE')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>Service Fee:</span>
                  <span style={{ color: '#dc3545' }}>Ksh {Number(selectedWithdrawal.serviceFee).toLocaleString('en-KE')}</span>
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid #e1e8ed', margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text)', fontWeight: '600' }}>Amount to Send:</span>
                  <span style={{ color: '#28a745', fontWeight: '600' }}>Ksh {Number(selectedWithdrawal.withdrawalAmount).toLocaleString('en-KE')}</span>
                </div>
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={closeProcessModal}
                style={{
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => updateWithdrawalStatus(selectedWithdrawal.id, 'processing')}
                disabled={processing[selectedWithdrawal.id]}
                style={{
                  background: processing[selectedWithdrawal.id] ? '#6c757d' : '#17a2b8',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: '500',
                  cursor: processing[selectedWithdrawal.id] ? 'not-allowed' : 'pointer'
                }}
              >
                {processing[selectedWithdrawal.id] ? 'Processing...' : '🔄 Start Processing'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function Pager({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null

  const pages = []
  const showPages = 5
  let start = Math.max(1, page - Math.floor(showPages / 2))
  let end = Math.min(totalPages, start + showPages - 1)
  
  if (end - start + 1 < showPages) {
    start = Math.max(1, end - showPages + 1)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
      {page > 1 && (
        <button
          className="btn btn-small"
          onClick={() => onChange(page - 1)}
          style={{ padding: '6px 12px', fontSize: '13px' }}
        >
          Previous
        </button>
      )}
      
      {pages.map(p => (
        <button
          key={p}
          className={`btn btn-small${p === page ? ' btn-primary' : ''}`}
          onClick={() => onChange(p)}
          style={{ 
            padding: '6px 12px', 
            fontSize: '13px',
            minWidth: '32px'
          }}
        >
          {p}
        </button>
      ))}
      
      {page < totalPages && (
        <button
          className="btn btn-small"
          onClick={() => onChange(page + 1)}
          style={{ padding: '6px 12px', fontSize: '13px' }}
        >
          Next →
        </button>
      )}
    </div>
  )
}
