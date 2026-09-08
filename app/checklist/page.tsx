'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import PageHeader from '@/components/PageHeader'

/* ─── Types ─────────────────────────────────────────── */
interface ChecklistItem {
  id: string
  title: string
  description?: string
  order: number
  requirementType: string
  isRequired: boolean
  targetCount?: number
  progress: {
    status: string
    completedCount: number
    completedAt?: string
    notes?: string
  }
}

interface Checklist {
  id: string
  name: string
  description?: string
  items: ChecklistItem[]
  stats: {
    totalItems: number
    completedItems: number
    progressPercentage: number
  }
}

/* ─── Helpers ────────────────────────────────────────── */
function statusBadge(status: string) {
  const map: Record<string, string> = {
    completed:   'bg-green-100 text-green-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    pending:     'bg-gray-100  text-gray-600',
  }
  const label =
    status === 'in_progress'
      ? 'In Progress'
      : status.charAt(0).toUpperCase() + status.slice(1)
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? map.pending}`}>
      {label}
    </span>
  )
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  narrative: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  document: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  photo: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  form: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
}

/* ─── Page ───────────────────────────────────────────── */
export default function ChecklistPage() {
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch('/api/checklists/my-checklist')
      .then((r) => r.json())
      .then((data) => { if (!cancelled) { setChecklists(data.checklists ?? []); setLoading(false) } })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading requirements…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Work Immersion Requirements"
        subtitle="Track your progress and completion status"
        backHref="/dashboard"
        backLabel="Dashboard"
        shareOptions={{
          title: 'Work Immersion Program',
          text: 'Check requirements and track progress for the Work Immersion Program.',
        }}
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {checklists.length === 0 ? (
          /* ── Empty state ──────────────────────────────── */
          <Card>
            <CardContent className="flex flex-col items-center text-center py-16 px-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No requirements yet</h3>
              <p className="text-gray-500 text-sm max-w-xs">
                Your teacher will assign requirements soon. Check back later.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {checklists.map((checklist) => {
              const pct = checklist.stats.progressPercentage
              const barColor = pct === 100 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-blue-500'

              return (
                <Card key={checklist.id} className="overflow-hidden">
                  {/* Checklist header */}
                  <CardHeader padding="lg" divider>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="min-w-0">
                        <CardTitle level={3}>{checklist.name}</CardTitle>
                        {checklist.description && (
                          <p className="text-sm text-gray-500 mt-1">{checklist.description}</p>
                        )}
                      </div>
                      <div className="flex-shrink-0 text-center sm:text-right">
                        <p className="text-3xl font-bold text-blue-600 leading-none">{pct}%</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {checklist.stats.completedItems}/{checklist.stats.totalItems} completed
                        </p>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-3 w-full bg-gray-100 rounded-full h-2.5">
                      <div
                        className={`${barColor} h-2.5 rounded-full transition-all duration-700`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </CardHeader>

                  {/* Items */}
                  <CardContent padding="lg">
                    <div className="space-y-3">
                      {checklist.items.map((item, idx) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                        >
                          {/* Status icon */}
                          <div className="flex-shrink-0 mt-0.5">
                            {item.progress.status === 'completed' ? (
                              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            ) : item.progress.status === 'in_progress' ? (
                              <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                            ) : (
                              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                                <span className="text-gray-500 text-xs font-semibold">{idx + 1}</span>
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h4 className="font-medium text-gray-900 text-sm">{item.title}</h4>
                              {item.isRequired && (
                                <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                                  Required
                                </span>
                              )}
                              {statusBadge(item.progress.status)}
                            </div>

                            {item.description && (
                              <p className="text-xs text-gray-500 mb-2 leading-relaxed">{item.description}</p>
                            )}

                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                {TYPE_ICONS[item.requirementType] ?? TYPE_ICONS.document}
                                <span className="capitalize">{item.requirementType}</span>
                              </div>
                              {item.targetCount != null && (
                                <div className="flex items-center gap-1">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                  </svg>
                                  <span>{item.progress.completedCount} / {item.targetCount}</span>
                                </div>
                              )}
                            </div>

                            {item.progress.notes && (
                              <div className="mt-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800">
                                <span className="font-semibold">Note: </span>{item.progress.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            {/* Help card */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1.5">How requirements are tracked</p>
                  <ul className="space-y-1 list-disc list-inside text-xs leading-relaxed">
                    <li>Some items update automatically (like narrative count)</li>
                    <li>Document submissions are verified by your teacher</li>
                    <li>Check back regularly to see your updated progress</li>
                    <li>Contact your supervisor if you have questions</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
