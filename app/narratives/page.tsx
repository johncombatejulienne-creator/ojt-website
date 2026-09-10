'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/AppShell'

interface Photo { id: string; url: string; isVerified: boolean; uploadedAt: string }

interface Narrative {
  id: string; date: string; content: string; status: string
  isDraft: boolean; submissionDate?: string | null; submittedAt?: string | null
  photos: Photo[]
}
type Filter = 'all' | 'submitted' | 'draft'

function getTitle(content: string) {
  const m = content.match(/\*\*Activity:\*\*\s*(.+)/i)
  return m ? m[1].trim() : 'Daily Activity'
}

const STATUS: Record<string, { bg: string; color: string; label: string }> = {
  approved:           { bg: '#D1FAE5', color: '#065F46', label: 'Approved' },
  pending:            { bg: '#FEF3C7', color: '#92400E', label: 'Pending' },
  revision_requested: { bg: '#FFEDD5', color: '#9A3412', label: 'Revision Needed' },
}

export default function NarrativesPage() {
  const router = useRouter()
  const [narratives,  setNarratives]  = useState<Narrative[]>([])
  const [loading,     setLoading]     = useState(true)
  const [filter,      setFilter]      = useState<Filter>('all')
  const [deleteId,    setDeleteId]    = useState<string | null>(null)
  const [deleting,    setDeleting]    = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const load = () => {
    setLoading(true)
    fetch('/api/narratives')
      .then(r => r.json())
      .then(d => { setNarratives(d.narratives ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true); setDeleteError('')
    try {
      const res = await fetch(`/api/narratives/${deleteId}`, { method: 'DELETE' })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error ?? 'Failed to delete')
      setNarratives(prev => prev.filter(n => n.id !== deleteId))
      setDeleteId(null)
    } catch (e: unknown) {
      setDeleteError(e instanceof Error ? e.message : 'Deletion failed')
    } finally {
      setDeleting(false)
    }
  }

  const counts = {
    all:       narratives.length,
    submitted: narratives.filter(n => !n.isDraft).length,
    draft:     narratives.filter(n =>  n.isDraft).length,
  }
  const filtered = narratives.filter(n =>
    filter === 'all' ? true : filter === 'draft' ? n.isDraft : !n.isDraft
  )

  if (loading) return (
    <AppShell>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
        <div style={{ width: 40, height: 40, border: '4px solid #FFEDD5',
          borderTopColor: '#F97316', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </AppShell>
  )

  return (
    <AppShell>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>

      {/* ── Delete confirmation modal ──────────────────────── */}
      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: 16, animation: 'fadeIn 0.15s ease' }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 32,
            maxWidth: 380, width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
            <div style={{ width: 52, height: 52, background: '#FEE2E2', borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
              <svg style={{ width: 26, height: 26, color: '#DC2626' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 8 }}>
              Delete Narrative?
            </h2>
            <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, marginBottom: 8 }}>
              This will permanently delete this narrative and its verification photo.
              <strong> This cannot be undone.</strong>
            </p>
            {deleteError && (
              <p style={{ fontSize: 13, color: '#EF4444', marginBottom: 12 }}>{deleteError}</p>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setDeleteId(null); setDeleteError('') }}
                disabled={deleting}
                style={{ flex: 1, padding: '11px', background: '#F3F4F6', color: '#374151',
                  border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                style={{ flex: 1, padding: '11px', background: '#DC2626', color: 'white',
                  border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  opacity: deleting ? 0.7 : 1, fontFamily: 'inherit' }}>
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <button onClick={() => router.push('/dashboard')} style={{
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6B7280',
          background: 'none', border: 'none', cursor: 'pointer', marginBottom: 8,
          padding: 0, fontFamily: 'inherit',
        }}>
          <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Dashboard
        </button>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: 0 }}>My Narratives</h1>
            <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>
              {counts.all} submission{counts.all !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={() => router.push('/narratives/create')} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 18px', background: '#F97316', color: 'white',
            border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600,
            cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit',
          }}>
            <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            New Narrative
          </button>
        </div>
      </div>

      {/* ── Filter tabs ───────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {(['all', 'submitted', 'draft'] as Filter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '7px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600,
            border: filter === f ? 'none' : '1.5px solid #E5E7EB',
            background: filter === f ? '#F97316' : 'white',
            color: filter === f ? 'white' : '#6B7280',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
          </button>
        ))}
      </div>

      {/* ── Narrative list ────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E7EB',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '64px 24px', gap: 16, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, background: '#F3F4F6', borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg style={{ width: 28, height: 28, color: '#9CA3AF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#374151' }}>
            {filter === 'draft' ? 'No drafts.' : filter === 'submitted' ? 'No submitted narratives.' : 'No narratives yet.'}
          </p>
          <button onClick={() => router.push('/narratives/create')} style={{
            padding: '10px 24px', background: '#F97316', color: 'white',
            border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Write Your First Narrative
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(n => {
            const verPhoto = n.photos?.find(p => p.isVerified)
            const dateStr  = new Date(n.date).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
            })
            const submitDate = n.submissionDate ?? n.submittedAt
            const submitStr = submitDate
              ? new Date(submitDate).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                })
              : null
            const badge = STATUS[n.status] ?? STATUS.pending

            return (
              <div key={n.id} style={{ background: 'white', borderRadius: 16,
                border: '1px solid #E5E7EB', padding: '18px 20px', boxSizing: 'border-box' }}>

                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>

                  {/* Verification photo thumbnail */}
                  {verPhoto && (
                    <div style={{ flexShrink: 0 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={verPhoto.url} alt="Verification"
                        style={{ width: 56, height: 56, borderRadius: 10,
                          objectFit: 'cover', border: '2px solid #A7F3D0',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }} />
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Title + badges */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center',
                      gap: 6, marginBottom: 6 }}>
                      <h3 style={{ fontWeight: 700, fontSize: 15, color: '#111827', margin: 0 }}>
                        {getTitle(n.content)}
                      </h3>
                      {n.isDraft ? (
                        <span style={{ fontSize: 10, fontWeight: 700, background: '#F3F4F6',
                          color: '#6B7280', padding: '2px 8px', borderRadius: 999 }}>Draft</span>
                      ) : (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px',
                          borderRadius: 999, background: badge.bg, color: badge.color }}>
                          {badge.label}
                        </span>
                      )}
                      {verPhoto && !n.isDraft && (
                        <span style={{ fontSize: 10, fontWeight: 700, background: '#D1FAE5',
                          color: '#065F46', padding: '2px 6px', borderRadius: 999 }}>
                          ✓ Photo Verified
                        </span>
                      )}
                    </div>

                    {/* Meta */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10,
                      fontSize: 12, color: '#9CA3AF', marginBottom: 6 }}>
                      <span>📅 {dateStr}</span>
                      {submitStr && <span>⏰ {submitStr}</span>}
                    </div>

                    {/* Excerpt */}
                    <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5, margin: 0,
                      overflow: 'hidden', display: '-webkit-box',
                      WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                      {n.content.replace(/\*\*/g, '').slice(0, 180)}
                    </p>
                  </div>
                </div>

                {/* Actions row */}
                <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                  <button onClick={() => router.push(`/narratives/${n.id}`)} style={{
                    padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    border: '1.5px solid #E5E7EB', background: 'white', color: '#374151',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    View
                  </button>
                  {n.isDraft && (
                    <button onClick={() => router.push(`/narratives/create`)} style={{
                      padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                      border: 'none', background: '#F97316', color: 'white',
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                      Continue
                    </button>
                  )}
                  {!n.isDraft && (
                    <a href={`/api/narratives/${n.id}/download`} download style={{
                      padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                      border: '1.5px solid #FED7AA', background: '#FFF7ED', color: '#C2410C',
                      textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5,
                      fontFamily: 'inherit',
                    }}>
                      <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download
                    </a>
                  )}
                  {/* Delete — always visible for own narratives */}
                  <button onClick={() => { setDeleteId(n.id); setDeleteError('') }} style={{
                    padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    border: '1.5px solid #FECACA', background: '#FEF2F2', color: '#DC2626',
                    cursor: 'pointer', fontFamily: 'inherit',
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                  }}>
                    <svg style={{ width: 13, height: 13 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </AppShell>
  )
}
