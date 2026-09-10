'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/AppShell'

interface Narrative {
  id: string; date: string; content: string
  isDraft: boolean; submissionDate: string | null; submittedAt: string | null; status: string
}
type Filter = 'all' | 'submitted' | 'draft'

function getTitle(content: string) {
  const m = content.match(/\*\*Activity:\*\*\s*(.+)/i)
  return m ? m[1].trim() : 'Daily Activity'
}

const STATUS_BG: Record<string, string> = {
  approved:           '#D1FAE5',
  pending:            '#FEF3C7',
  revision_requested: '#FFEDD5',
}
const STATUS_COLOR: Record<string, string> = {
  approved:           '#065F46',
  pending:            '#92400E',
  revision_requested: '#9A3412',
}
const STATUS_LABEL: Record<string, string> = {
  approved:           'Approved',
  pending:            'Pending',
  revision_requested: 'Revision Needed',
}

export default function NarrativesPage() {
  const router = useRouter()
  const [narratives, setNarratives] = useState<Narrative[]>([])
  const [loading,    setLoading]    = useState(true)
  const [filter,     setFilter]     = useState<Filter>('all')

  useEffect(() => {
    let cancelled = false
    fetch('/api/narratives')
      .then(r => r.json())
      .then(d => { if (!cancelled) { setNarratives(d.narratives ?? []); setLoading(false) } })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const counts = {
    all:       narratives.length,
    submitted: narratives.filter(n => !n.isDraft).length,
    draft:     narratives.filter(n =>  n.isDraft).length,
  }
  const filtered = narratives.filter(n =>
    filter === 'all'       ? true :
    filter === 'draft'     ? n.isDraft :
    !n.isDraft
  )

  if (loading) return (
    <AppShell>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
        <div style={{ width: 40, height: 40, border: '4px solid #FFEDD5',
          borderTopColor: '#F97316', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    </AppShell>
  )

  return (
    <AppShell>
      {/* Header row */}
      <div style={{ marginBottom: 24 }}>
        <button onClick={() => router.push('/dashboard')} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 13, color: '#6B7280', background: 'none',
          border: 'none', cursor: 'pointer', marginBottom: 8, padding: 0, fontFamily: 'inherit',
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
              {counts.all} total submission{counts.all !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => router.push('/narratives/create')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 18px', background: '#F97316', color: 'white',
              border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600,
              cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit',
            }}
          >
            <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            New Narrative
          </button>
        </div>
      </div>

      {/* Filter tabs */}
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

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{
          background: 'white', borderRadius: 16, border: '1px solid #E5E7EB',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '64px 24px', gap: 16, textAlign: 'center',
        }}>
          <div style={{ width: 56, height: 56, background: '#F3F4F6', borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg style={{ width: 28, height: 28, color: '#9CA3AF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#374151' }}>
            {filter === 'draft' ? 'No drafts saved.' :
             filter === 'submitted' ? 'No submitted narratives.' :
             'No narratives yet.'}
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
            const dateStr = new Date(n.date).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
            })
            const submitStr = (n.submissionDate ?? n.submittedAt)
              ? new Date(n.submissionDate ?? n.submittedAt!).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                })
              : null

            return (
              <div key={n.id} style={{
                background: 'white', borderRadius: 16, border: '1px solid #E5E7EB',
                padding: '18px 20px', boxSizing: 'border-box',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* Title + badge */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                    <h3 style={{ fontWeight: 700, fontSize: 15, color: '#111827', margin: 0 }}>
                      {getTitle(n.content)}
                    </h3>
                    {n.isDraft ? (
                      <span style={{ fontSize: 11, fontWeight: 600, background: '#F3F4F6',
                        color: '#6B7280', padding: '2px 10px', borderRadius: 999 }}>Draft</span>
                    ) : (
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 999,
                        background: STATUS_BG[n.status] ?? '#F3F4F6',
                        color: STATUS_COLOR[n.status] ?? '#6B7280',
                      }}>
                        {STATUS_LABEL[n.status] ?? n.status}
                      </span>
                    )}
                  </div>

                  {/* Meta */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 12, color: '#9CA3AF' }}>
                    <span>📅 {dateStr}</span>
                    {submitStr && <span>⏰ Submitted {submitStr}</span>}
                  </div>

                  {/* Excerpt */}
                  <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5, margin: 0,
                    overflow: 'hidden', display: '-webkit-box',
                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                    {n.content.replace(/\*\*/g, '').slice(0, 200)}
                  </p>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => router.push(`/narratives/${n.id}`)} style={{
                      padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                      border: '1.5px solid #E5E7EB', background: 'white', color: '#374151',
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                      View
                    </button>
                    {n.isDraft && (
                      <button onClick={() => router.push(`/narratives/${n.id}/edit`)} style={{
                        padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                        border: 'none', background: '#F97316', color: 'white',
                        cursor: 'pointer', fontFamily: 'inherit',
                      }}>
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </AppShell>
  )
}
