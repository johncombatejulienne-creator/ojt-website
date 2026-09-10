'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AppShell from '@/components/AppShell'

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

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  approved:           { bg: '#D1FAE5', color: '#065F46', label: 'Approved' },
  pending:            { bg: '#FEF3C7', color: '#92400E', label: 'Pending Review' },
  revision_requested: { bg: '#FFEDD5', color: '#9A3412', label: 'Revision Needed' },
}

function formatContent(text: string) {
  return text
    .split('\n')
    .map(line => line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'))
    .join('\n')
}

export default function NarrativeDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [narrative,   setNarrative]   = useState<NarrativeDetail | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')
  const [deleting,    setDeleting]    = useState(false)
  const [confirmDel,  setConfirmDel]  = useState(false)
  const [deleteError, setDeleteError] = useState('')

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
    setDeleting(true); setDeleteError('')
    try {
      const res = await fetch(`/api/narratives/${id}`, { method: 'DELETE' })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error ?? 'Failed to delete')
      router.push('/narratives')
    } catch (e: unknown) {
      setDeleteError(e instanceof Error ? e.message : 'Deletion failed')
      setDeleting(false)
    }
  }

  if (loading) return (
    <AppShell>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
        <div style={{ width: 40, height: 40, border: '4px solid #FFEDD5',
          borderTopColor: '#F97316', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </AppShell>
  )

  if (error || !narrative) return (
    <AppShell>
      <div style={{ padding: '40px 0', textAlign: 'center' }}>
        <p style={{ color: '#EF4444', fontSize: 15, marginBottom: 16 }}>{error || 'Not found'}</p>
        <button onClick={() => router.push('/narratives')} style={{
          padding: '10px 24px', background: '#F97316', color: 'white',
          border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>Back to Narratives</button>
      </div>
    </AppShell>
  )

  const badge = STATUS_STYLES[narrative.status] ?? STATUS_STYLES.pending
  const verificationPhoto = narrative.photos.find(p => p.isVerified)
  const dateStr = new Date(narrative.date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
  const submittedStr = (narrative.submissionDate ?? narrative.submissionDate)
    ? new Date((narrative.submissionDate ?? narrative.submissionDate)!).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : null

  const contentLines = formatContent(narrative.content)

  return (
    <AppShell>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>

      {/* Delete confirmation modal */}
      {confirmDel && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 32,
            maxWidth: 400, width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
            animation: 'fadeIn 0.2s ease' }}>
            <div style={{ width: 56, height: 56, background: '#FEE2E2', borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <svg style={{ width: 28, height: 28, color: '#DC2626' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => { setConfirmDel(false); setDeleteError('') }}
                disabled={deleting}
                style={{ flex: 1, padding: '11px', background: '#F3F4F6', color: '#374151',
                  border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                style={{ flex: 1, padding: '11px', background: '#DC2626', color: 'white',
                  border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
                  cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.7 : 1 }}>
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back */}
      <button onClick={() => router.push('/narratives')} style={{
        display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6B7280',
        background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20,
        padding: 0, fontFamily: 'inherit',
      }}>
        <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        My Narratives
      </button>

      <div style={{ maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Header card */}
        <div style={{ background: 'white', borderRadius: 18, border: '1px solid #E5E7EB',
          padding: '24px 28px', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
            gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 6px' }}>
                {narrative.content.match(/\*\*Activity:\*\*\s*(.+)/i)?.[1] ?? 'Daily Activity'}
              </h1>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#6B7280' }}>📅 {dateStr}</span>
                {submittedStr && (
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>Submitted {submittedStr}</span>
                )}
                {narrative.submissionTime && (
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>at {narrative.submissionTime}</span>
                )}
              </div>
            </div>
            <span style={{ padding: '5px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700,
              background: narrative.isDraft ? '#F3F4F6' : badge.bg,
              color: narrative.isDraft ? '#6B7280' : badge.color, whiteSpace: 'nowrap' }}>
              {narrative.isDraft ? 'Draft' : badge.label}
            </span>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <a href={`/api/narratives/${id}/download`} download
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 18px', background: '#FFF7ED', color: '#EA580C',
                border: '1.5px solid #FED7AA', borderRadius: 10, fontSize: 13, fontWeight: 600,
                textDecoration: 'none', cursor: 'pointer' }}>
              <svg style={{ width: 15, height: 15 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download
            </a>
            {!narrative.isDraft && (
              <button onClick={() => setConfirmDel(true)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 18px', background: '#FEF2F2', color: '#DC2626',
                border: '1.5px solid #FECACA', borderRadius: 10, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <svg style={{ width: 15, height: 15 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            )}
            {narrative.isDraft && (
              <button onClick={() => router.push(`/narratives/${id}/edit`)} style={{
                padding: '8px 18px', background: '#F97316', color: 'white',
                border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                Continue Editing
              </button>
            )}
          </div>
        </div>

        {/* Narrative content */}
        <div style={{ background: 'white', borderRadius: 18, border: '1px solid #E5E7EB',
          padding: '24px 28px', boxSizing: 'border-box' }}>
          <p style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 16 }}>Narrative Content</p>
          <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}
            dangerouslySetInnerHTML={{ __html: contentLines }} />
        </div>

        {/* Verification photo */}
        {verificationPhoto ? (
          <div style={{ background: 'white', borderRadius: 18, border: '1px solid #E5E7EB',
            padding: '24px 28px', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 28, height: 28, background: '#D1FAE5', borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg style={{ width: 16, height: 16, color: '#059669' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p style={{ fontWeight: 700, fontSize: 15, color: '#111827', margin: 0 }}>
                Verification Photo
              </p>
              <span style={{ fontSize: 11, fontWeight: 700, background: '#D1FAE5', color: '#065F46',
                padding: '2px 8px', borderRadius: 999 }}>Verified</span>
            </div>

            {/* Actual photo */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={verificationPhoto.url}
              alt="Verification photo"
              style={{
                width: '100%', maxWidth: 480, height: 'auto', borderRadius: 14,
                border: '2px solid #E5E7EB', display: 'block',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              }}
            />
            <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 10 }}>
              Captured on {new Date(verificationPhoto.captureDate ?? verificationPhoto.uploadedAt)
                .toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
            </p>
          </div>
        ) : !narrative.isDraft ? (
          <div style={{ background: '#FFFBEB', borderRadius: 18, border: '1px solid #FDE68A',
            padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <svg style={{ width: 20, height: 20, color: '#D97706', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p style={{ fontSize: 14, color: '#92400E', margin: 0 }}>
              No verification photo attached to this submission.
            </p>
          </div>
        ) : null}

        {/* Teacher reviews */}
        {narrative.reviews.length > 0 && (
          <div style={{ background: 'white', borderRadius: 18, border: '1px solid #E5E7EB',
            padding: '24px 28px', boxSizing: 'border-box' }}>
            <p style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 16 }}>
              Teacher Feedback
            </p>
            {narrative.reviews.map((rev, i) => (
              <div key={i} style={{
                padding: '14px 16px', borderRadius: 12,
                background: rev.action === 'approved' ? '#ECFDF5' : '#FFF7ED',
                border: `1px solid ${rev.action === 'approved' ? '#A7F3D0' : '#FED7AA'}`,
                marginBottom: i < narrative.reviews.length - 1 ? 10 : 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: rev.comment ? 8 : 0 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                    background: rev.action === 'approved' ? '#D1FAE5' : '#FFEDD5',
                    color: rev.action === 'approved' ? '#065F46' : '#9A3412',
                  }}>
                    {rev.action === 'approved' ? 'Approved' : 'Revision Requested'}
                  </span>
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>
                    by {rev.teacher.name} · {new Date(rev.createdAt).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </span>
                </div>
                {rev.comment && (
                  <p style={{ fontSize: 14, color: '#374151', margin: 0, lineHeight: 1.6 }}>
                    {rev.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </AppShell>
  )
}
