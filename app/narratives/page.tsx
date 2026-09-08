'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { format } from 'date-fns'
import PageHeader from '@/components/PageHeader'

interface Narrative {
  id: string
  date: string
  content: string
  isDraft: boolean
  submittedAt: string | null
  status: string
  createdAt: string
}

type Filter = 'all' | 'draft' | 'submitted'

function getActivityTitle(content: string) {
  const m = content.match(/\*\*Activity:\*\*\s*(.+)/i)
  return m ? m[1].trim() : 'Daily Activity'
}

function StatusBadge({ isDraft, status }: { isDraft: boolean; status: string }) {
  if (isDraft) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        Draft
      </span>
    )
  }
  const map: Record<string, string> = {
    approved:           'bg-green-100 text-green-800',
    pending:            'bg-blue-100 text-blue-800',
    revision_requested: 'bg-orange-100 text-orange-800',
  }
  const label =
    status === 'revision_requested'
      ? 'Revision Needed'
      : status.charAt(0).toUpperCase() + status.slice(1)
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {label}
    </span>
  )
}

export default function NarrativesPage() {
  const router = useRouter()
  const [narratives, setNarratives] = useState<Narrative[]>([])
  const [loading, setLoading]       = useState(true)
  const [filter, setFilter]         = useState<Filter>('all')

  useEffect(() => {
    let cancelled = false
    fetch('/api/narratives')
      .then((r) => r.json())
      .then((data) => { if (!cancelled) { setNarratives(data.narratives ?? []); setLoading(false) } })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const counts = {
    all:       narratives.length,
    submitted: narratives.filter((n) => !n.isDraft).length,
    draft:     narratives.filter((n) =>  n.isDraft).length,
  }

  const filtered = narratives.filter((n) => {
    if (filter === 'draft')     return n.isDraft
    if (filter === 'submitted') return !n.isDraft
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading narratives…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="My Narratives"
        subtitle={`${counts.all} total submission${counts.all !== 1 ? 's' : ''}`}
        backHref="/dashboard"
        backLabel="Dashboard"
        shareOptions={{
          title: 'Work Immersion Program',
          text: 'Track your work immersion journey and daily narratives.',
        }}
        action={
          <Button size="sm" onClick={() => router.push('/narratives/create')}>
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New
          </Button>
        }
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5">
        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {(['all', 'submitted', 'draft'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                filter === f
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              {' '}
              <span className={`ml-0.5 ${filter === f ? 'opacity-80' : 'text-gray-400'}`}>
                ({counts[f]})
              </span>
            </button>
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center text-center py-16 px-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No narratives found</h3>
              <p className="text-gray-500 text-sm mb-5 max-w-xs">
                {filter === 'draft'
                  ? "You don't have any drafts saved."
                  : filter === 'submitted'
                  ? "You haven't submitted any narratives yet."
                  : 'Start documenting your work immersion experience.'}
              </p>
              <Button size="sm" onClick={() => router.push('/narratives/create')}>
                Create Your First Narrative
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((narrative) => (
              <Card key={narrative.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <h3 className="font-semibold text-gray-900 text-sm">
                          {getActivityTitle(narrative.content)}
                        </h3>
                        <StatusBadge isDraft={narrative.isDraft} status={narrative.status} />
                      </div>

                      <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-2">
                        <div className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {format(new Date(narrative.date), 'MMM dd, yyyy')}
                        </div>
                        {narrative.submittedAt && (
                          <div className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {format(new Date(narrative.submittedAt), 'MMM dd, h:mm a')}
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                        {narrative.content.replace(/\*\*/g, '').slice(0, 180)}…
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0 self-end sm:self-start">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/narratives/${narrative.id}`)}
                      >
                        View
                      </Button>
                      {narrative.isDraft && (
                        <Button
                          size="sm"
                          onClick={() => router.push(`/narratives/${narrative.id}/edit`)}
                        >
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
