'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import AppShell from '@/components/AppShell'

/* ─── Types ──────────────────────────────────────────────── */
interface Photo {
  id: string; url: string; isVerified: boolean; uploadedAt: string; captureDate?: string
}
interface NarrativeDetail {
  id: string; date: string; content: string; status: string
  isDraft: boolean; submissionDate?: string; submissionTime?: string
  verificationStatus?: string
  photos: Photo[]
  reviews: { action: string; comment?: string; createdAt: string; teacher: { name: string } }[]
  student: {
    name: string; studentId: string; email: string; company?: string
    gradeLevel?: number; strand?: { name: string }; section?: { name: string }
    supervisor?: { name: string }
  }
}

/* ─── Status config ──────────────────────────────────────── */
const STATUS_CFG: Record<string, { bg: string; color: string; border: string; label: string; desc: string }> = {
  approved:           { bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0', label: 'Approved',        desc: 'Reviewed and approved by your teacher.' },
  pending:            { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A', label: 'Pending Review',   desc: 'Submitted and waiting for teacher review.' },
  revision_requested: { bg: '#FFF7ED', color: '#9A3412', border: '#FED7AA', label: 'Revision Needed',  desc: 'Your teacher requested changes. See feedback below.' },
}

/* ─── Content renderer ───────────────────────────────────── */
function renderSection(label: string, content: string) {
  const regex = new RegExp(`\\*\\*${label}:\\*\\*\\s*([\\s\\S]*?)(?=\\n\\*\\*|$)`)
  const match = content.match(regex)
  const text = match ? match[1].trim() : null
  if (!text || text.toLowerCase() === 'not specified') return null
  return text
}

const SECTIONS = [
  { key: 'Activity',          icon: '🎯', label: 'Activity / Task' },
  { key: 'Narrative',         icon: '📖', label: 'Narrative' },
  { key: 'What I Learned',    icon: '💡', label: 'What I Learned' },
  { key: 'Skills Demonstrated', icon: '⚡', label: 'Skills Demonstrated' },
  { key: 'Challenges',        icon: '🔥', label: 'Challenges Encountered' },
  { key: 'How I Handled It',  icon: '🛠️', label: 'How I Handled It' },
  { key: 'Reflection',        icon: '🪞', label: 'Personal Reflection' },
]

/* ─── Skeleton ─────────────────────────────────────────── */
function Skeleton() {
  return (
    <AppShell>
      <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
      <div style={{ maxWidth: 760 }}>
        <div className="skeleton" style={{ height: 20, width: 100, borderRadius: 8, marginBottom: 24 }} />
        <div style={{ background: 'white', borderRadius: 20, border: '1px solid #E5E7EB', padding: 28, marginBottom: 16 }}>
          <div className="skeleton" style={{ height: 26, width: '65%', borderRadius: 8, marginBottom: 14 }} />
          <div className="skeleton" style={{ height: 14, width: '40%', borderRadius: 6, marginBottom: 10 }} />
          <div className="skeleton" style={{ height: 14, width: '25%', borderRadius: 6 }} />
        </div>
        {[1, 2].map(i => (
          <div key={i} style={{ background: 'white', borderRadius: 20, border: '1px solid #E5E7EB', padding: 28, marginBottom: 14 }}>
            <div className="skeleton" style={{ height: 16, width: '30%', borderRadius: 6, marginBottom: 14 }} />
            <div className="skeleton" style={{ height: 13, width: '100%', borderRadius: 5, marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 13, width: '85%', borderRadius: 5, marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 13, width: '70%', borderRadius: 5 }} />
          </div>
        ))}
      </div>
    </AppShell>
  )
}

/* ════════════════════════════════════════════════════════════
   PAGE
═════════════════════════════════════════════════════════════ */
export default function NarrativeDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const { data: session } = useSession()
  const isTeacher = session?.user?.role === 'teacher'

  const [narrative,  setNarrative]  = useState<NarrativeDetail | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [deleting,   setDeleting]   = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const [deleteErr,  setDeleteErr]  = useState('')
  const [photoOpen,  setPhotoOpen]  = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/narratives/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.narrative) setNarrative(d.narrative)
        else setError(d.error ?? 'Narrative not found')
      })
      .catch(() => setError('Failed to load narrative'))
      .finally(() => setLoading(false))
  }, [id])

  const handleDelete = async () => {
    setDeleting(true); setDeleteErr('')
    try {
      const res = await fetch(`/api/narratives/${id}`, { method: 'DELETE' })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error ?? 'Failed to delete')
      router.push('/narratives')
    } catch (e: unknown) {
      setDeleteErr(e instanceof Error ? e.message : 'Deletion failed')
      setDeleting(false)
    }
  }

  if (loading) return <Skeleton />

  if (error || !narrative) return (
    <AppShell>
      <div style={{ padding: '60px 0', textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>😕</div>
        <p style={{ fontSize: 16, fontWeight: 700, color: '#374151', margin: '0 0 8px' }}>
          {error === 'Narrative not found' ? 'Narrative not found' : 'Something went wrong'}
        </p>
        <p style={{ fontSize: 14, color: '#9CA3AF', margin: '0 0 24px' }}>{error || 'Could not load this narrative.'}</p>
        <button onClick={() => router.push('/narratives')}
          style={{ padding: '11px 28px', background: '#F97316', color: 'white',
            border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          ← Back to Narratives
        </button>
      </div>
    </AppShell>
  )

  const badge   = STATUS_CFG[narrative.status] ?? STATUS_CFG.pending
  const verPic  = narrative.photos.find(p => p.isVerified)
  const dateStr = new Date(narrative.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const submittedStr = narrative.submissionDate
    ? new Date(narrative.submissionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null
  const activityTitle = narrative.content.match(/\*\*Activity:\*\*\s*(.+)/i)?.[1] ?? 'Daily Activity'

  return (
    <AppShell>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes scaleIn{from{opacity:0;transform:scale(0.92)}to{opacity:1;transform:scale(1)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {/* ── Delete modal ──────────────────────────────────── */}
      {confirmDel && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: 16, animation: 'fadeIn 0.15s ease' }}>
          <div style={{ background: 'white', borderRadius: 24, padding: '32px 28px',
            maxWidth: 400, width: '100%', boxShadow: '0 32px 64px rgba(0,0,0,0.25)',
            animation: 'scaleIn 0.25s cubic-bezier(0.34,1.3,0.64,1)' }}>
            <div style={{ width: 56, height: 56, background: '#FEE2E2', borderRadius: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <svg style={{ width: 28, height: 28, color: '#DC2626' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#111827', marginBottom: 8 }}>Delete Narrative?</h2>
            <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.65, marginBottom: 16 }}>
              This will permanently delete this narrative and its verification photo.{' '}
              <strong style={{ color: '#374151' }}>This action cannot be undone.</strong>
            </p>
            {deleteErr && (
              <p style={{ fontSize: 13, color: '#EF4444', marginBottom: 12, padding: '8px 12px',
                background: '#FEF2F2', borderRadius: 8 }}>{deleteErr}</p>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setConfirmDel(false); setDeleteErr('') }} disabled={deleting}
                style={{ flex: 1, padding: '12px', background: '#F3F4F6', color: '#374151',
                  border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={handleDelete} disabled={deleting}
                style={{ flex: 1, padding: '12px', background: deleting ? '#FCA5A5' : '#DC2626',
                  color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700,
                  cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {deleting ? (
                  <><div style={{ width: 16, height: 16, border: '2.5px solid rgba(255,255,255,0.4)',
                    borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />Deleting…</>
                ) : '🗑 Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Photo lightbox ────────────────────────────────── */}
      {photoOpen && verPic && (
        <div onClick={() => setPhotoOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)',
            zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16, animation: 'fadeIn 0.2s ease', cursor: 'zoom-out' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={verPic.url} alt="Verification photo"
            style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: 16,
              boxShadow: '0 24px 64px rgba(0,0,0,0.4)', animation: 'scaleIn 0.25s cubic-bezier(0.34,1.3,0.64,1)' }} />
          <button onClick={() => setPhotoOpen(false)}
            style={{ position: 'absolute', top: 16, right: 16, width: 40, height: 40,
              background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
              color: 'white', fontSize: 20, cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>
      )}

      <div style={{ maxWidth: 760 }}>

        {/* ── Back button ───────────────────────────────── */}
        <button onClick={() => router.push('/narratives')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#9CA3AF',
            background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20, padding: '4px 0',
            fontFamily: 'inherit', transition: 'color 0.15s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#F97316' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#9CA3AF' }}>
          <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
          My Narratives
        </button>

        {/* ── Header card ───────────────────────────────── */}
        <div style={{ background: 'white', borderRadius: 20, border: '1px solid #E5E7EB',
          marginBottom: 16, overflow: 'hidden', animation: 'slideUp 0.4s ease both',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>

          {/* Colored top strip based on status */}
          <div style={{ height: 5, background:
            narrative.isDraft ? '#E5E7EB' :
            narrative.status === 'approved' ? 'linear-gradient(90deg,#10B981,#059669)' :
            narrative.status === 'revision_requested' ? 'linear-gradient(90deg,#F97316,#EA580C)' :
            'linear-gradient(90deg,#F59E0B,#D97706)' }} />

          <div style={{ padding: '24px 28px', boxSizing: 'border-box' }}>
            {/* Title + status */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
              gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h1 style={{ fontSize: 22, fontWeight: 900, color: '#111827', margin: '0 0 10px',
                  lineHeight: 1.3 }}>
                  {activityTitle}
                </h1>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#6B7280' }}>
                    <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                    {dateStr}
                  </span>
                  {submittedStr && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#9CA3AF' }}>
                      <svg style={{ width: 12, height: 12 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      Submitted {submittedStr}
                    </span>
                  )}
                </div>
              </div>
              {/* Status pill */}
              <div className="tooltip-wrap" style={{ flexShrink: 0 }}>
                <span style={{ padding: '6px 16px', borderRadius: 999, fontSize: 12, fontWeight: 800,
                  background: narrative.isDraft ? '#F3F4F6' : badge.bg,
                  color:      narrative.isDraft ? '#6B7280' : badge.color,
                  border:     `1px solid ${narrative.isDraft ? '#E5E7EB' : badge.border}`,
                  whiteSpace: 'nowrap', display: 'inline-block', cursor: 'default' }}>
                  {narrative.isDraft ? '📝 Draft' : badge.label}
                </span>
                {!narrative.isDraft && (
                  <div className="tooltip-box">{badge.desc}</div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <a href={`/api/narratives/${id}/download`} download
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '9px 18px', background: '#FFF7ED', color: '#EA580C',
                  border: '1.5px solid #FED7AA', borderRadius: 10, fontSize: 13, fontWeight: 700,
                  textDecoration: 'none', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#FFEDD5' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#FFF7ED' }}>
                <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                Download
              </a>

              {!narrative.isDraft && typeof navigator !== 'undefined' && navigator.share && (
                <button onClick={async () => {
                  try {
                    await navigator.share({ title: activityTitle,
                      url: `${window.location.origin}/narratives/${id}` })
                  } catch { /* cancelled */ }
                }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '9px 18px', background: '#EFF6FF', color: '#1D4ED8',
                    border: '1.5px solid #BFDBFE', borderRadius: 10, fontSize: 13, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                  <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                  </svg>
                  Share
                </button>
              )}

              {narrative.isDraft && (
                <button onClick={() => router.push(`/narratives/create?draft=${id}`)}
                  style={{ padding: '9px 18px', background: '#F97316', color: 'white',
                    border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(249,115,22,0.35)' }}>
                  ✏️ Continue Editing
                </button>
              )}

              {/* Only students can delete their own narratives */}
              {!narrative.isDraft && !isTeacher && (
                <button onClick={() => setConfirmDel(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '9px 18px', background: '#FEF2F2', color: '#DC2626',
                    border: '1.5px solid #FECACA', borderRadius: 10, fontSize: 13, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', marginLeft: 'auto' }}>
                  <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Narrative sections (structured journal view) ── */}
        <div style={{ background: 'white', borderRadius: 20, border: '1px solid #E5E7EB',
          marginBottom: 16, overflow: 'hidden', animation: 'slideUp 0.4s 0.08s ease both',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>

          <div style={{ padding: '20px 28px', borderBottom: '1px solid #F3F4F6', background: '#FAFAFA' }}>
            <h2 style={{ fontSize: 14, fontWeight: 800, color: '#111827', margin: 0 }}>📖 Narrative Content</h2>
          </div>

          <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 0 }}>
            {SECTIONS.map((sec, i) => {
              const text = renderSection(sec.key, narrative.content)
              if (!text) return null
              return (
                <div key={sec.key} style={{
                  paddingBottom: i < SECTIONS.length - 1 ? 20 : 0,
                  marginBottom:  i < SECTIONS.length - 1 ? 20 : 0,
                  borderBottom:  i < SECTIONS.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 16 }}>{sec.icon}</span>
                    <p className="narrative-section-label" style={{ margin: 0 }}>{sec.label}</p>
                  </div>
                  <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.85, margin: 0, whiteSpace: 'pre-wrap' }}>
                    {text}
                  </p>
                </div>
              )
            })}

            {/* Fallback: show raw content if no structured sections */}
            {SECTIONS.every(s => !renderSection(s.key, narrative.content)) && (
              <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.85, whiteSpace: 'pre-wrap' }}
                dangerouslySetInnerHTML={{ __html: narrative.content
                  .split('\n')
                  .map(l => l.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'))
                  .join('\n') }} />
            )}
          </div>
        </div>

        {/* ── Verification photo ─────────────────────────── */}
        {verPic ? (
          <div style={{ background: 'white', borderRadius: 20, border: '1px solid #E5E7EB',
            marginBottom: 16, overflow: 'hidden', animation: 'slideUp 0.4s 0.16s ease both',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #F3F4F6', background: '#ECFDF5',
              display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, background: '#A7F3D0', borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg style={{ width: 15, height: 15, color: '#065F46' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <p style={{ fontWeight: 800, fontSize: 14, color: '#065F46', margin: 0 }}>Verification Photo</p>
              <span style={{ fontSize: 10, fontWeight: 800, background: '#D1FAE5', color: '#065F46',
                padding: '2px 8px', borderRadius: 999, border: '1px solid #A7F3D0' }}>Verified</span>
            </div>
            <div style={{ padding: 24 }}>
              <div onClick={() => setPhotoOpen(true)}
                style={{ cursor: 'zoom-in', borderRadius: 14, overflow: 'hidden', display: 'inline-block',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.12)', border: '2px solid #E5E7EB', maxWidth: '100%',
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease' }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'scale(1.01)'
                  ;(e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(0,0,0,0.18)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'scale(1)'
                  ;(e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.12)'
                }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={verPic.url} alt="Verification photo"
                  style={{ width: '100%', maxWidth: 480, height: 'auto', display: 'block' }} />
              </div>
              <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                <svg style={{ width: 12, height: 12 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Captured {new Date(verPic.captureDate ?? verPic.uploadedAt).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
                {' '}· Click to enlarge
              </p>
            </div>
          </div>
        ) : !narrative.isDraft ? (
          <div style={{ background: '#FFFBEB', borderRadius: 16, border: '1px solid #FDE68A',
            padding: '16px 22px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <svg style={{ width: 20, height: 20, color: '#D97706', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p style={{ fontSize: 14, color: '#92400E', margin: 0 }}>No verification photo attached to this submission.</p>
          </div>
        ) : null}

        {/* ── Teacher feedback ───────────────────────────── */}
        {narrative.reviews.length > 0 && (
          <div style={{ background: 'white', borderRadius: 20, border: '1px solid #E5E7EB',
            overflow: 'hidden', animation: 'slideUp 0.4s 0.24s ease both',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #F3F4F6', background: '#F9FAFB' }}>
              <h2 style={{ fontSize: 14, fontWeight: 800, color: '#111827', margin: 0 }}>
                💬 Teacher Feedback
              </h2>
            </div>
            <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {narrative.reviews.map((rev, i) => (
                <div key={i} style={{ padding: '16px 18px', borderRadius: 14,
                  background: rev.action === 'approved' ? '#ECFDF5' : '#FFF7ED',
                  border: `1.5px solid ${rev.action === 'approved' ? '#A7F3D0' : '#FED7AA'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: rev.comment ? 10 : 0, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 999,
                      background: rev.action === 'approved' ? '#D1FAE5' : '#FFEDD5',
                      color:      rev.action === 'approved' ? '#065F46' : '#9A3412',
                      border:     `1px solid ${rev.action === 'approved' ? '#A7F3D0' : '#FED7AA'}` }}>
                      {rev.action === 'approved' ? '✓ Approved' : '↻ Revision Requested'}
                    </span>
                    <span style={{ fontSize: 12, color: '#9CA3AF' }}>
                      by <strong style={{ color: '#374151' }}>{rev.teacher.name}</strong>
                      {' · '}{new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  {rev.comment && (
                    <p style={{ fontSize: 14, color: '#374151', margin: 0, lineHeight: 1.7,
                      fontStyle: 'italic', paddingLeft: 8, borderLeft: '3px solid #FED7AA' }}>
                      "{rev.comment}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Navigation: Back / New Entry (students only) ── */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24, gap: 12 }}>
          <button onClick={() => router.push(isTeacher ? '/teacher/dashboard?tab=students' : '/narratives')}
            style={{ padding: '10px 22px', background: '#F3F4F6', color: '#374151',
              border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
            {isTeacher ? 'Back to Students' : 'All Narratives'}
          </button>
          {/* Only show New Entry for students */}
          {!isTeacher && (
            <button onClick={() => router.push('/narratives/create')}
              className="btn-premium"
              style={{ padding: '10px 22px', fontSize: 13, borderRadius: 12,
                display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
              </svg>
              New Entry
            </button>
          )}
        </div>

      </div>
    </AppShell>
  )
}
