'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { format } from 'date-fns'
import PageHeader from '@/components/PageHeader'

interface Announcement {
  id: string
  title: string
  content: string
  type: string
  targetType: string
  expiresAt?: string
  createdAt: string
  teacher: { name: string }
}

/* â”€â”€â”€ Type config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const TYPE_STYLES: Record<string, { badge: string; icon: string }> = {
  reminder:        { badge: 'bg-blue-100 text-blue-800',    icon: 'ðŸ””' },
  deadline:        { badge: 'bg-red-100 text-red-800',      icon: 'â°' },
  schedule_change: { badge: 'bg-yellow-100 text-yellow-800',icon: 'ðŸ“…' },
  instruction:     { badge: 'bg-green-100 text-green-800',  icon: 'ðŸ“‹' },
  meeting:         { badge: 'bg-purple-100 text-purple-800',icon: 'ðŸ¤' },
  document:        { badge: 'bg-indigo-100 text-indigo-800',icon: 'ðŸ“„' },
  orientation:     { badge: 'bg-pink-100 text-pink-800',    icon: 'ðŸŽ¯' },
  workplace:       { badge: 'bg-orange-100 text-orange-800',icon: 'ðŸ¢' },
  emergency:       { badge: 'bg-red-100 text-red-800',      icon: 'ðŸš¨' },
}

function typeBadge(type: string) {
  const cfg = TYPE_STYLES[type] ?? { badge: 'bg-gray-100 text-gray-700', icon: 'ðŸ“¢' }
  const label = type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.badge}`}>
      <span aria-hidden="true">{cfg.icon}</span>
      {label}
    </span>
  )
}


/* ─── Pure helpers (defined outside component to satisfy react-hooks/purity) ─ */
function isExpiringSoon(expiresAt?: string): boolean {
  if (!expiresAt) return false
  const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000)
  return days > 0 && days <= 3
}

function isExpired(expiresAt?: string): boolean {
  return !!expiresAt && new Date(expiresAt).getTime() < Date.now()
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)


  useEffect(() => {
    let cancelled = false
    fetch('/api/announcements')
      .then((r) => r.json())
      .then((data) => { if (!cancelled) { setAnnouncements(data.announcements ?? []); setLoading(false) } })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading announcementsâ€¦</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Announcements"
        subtitle={`${announcements.length} announcement${announcements.length !== 1 ? 's' : ''}`}
        backHref="/dashboard"
        backLabel="Dashboard"
        shareOptions={{
          title: 'Work Immersion Program',
          text: 'Stay updated with announcements from the Work Immersion Program.',
        }}
      />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-4">
        {announcements.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center text-center py-16 px-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No announcements yet</h3>
              <p className="text-gray-500 text-sm max-w-xs">
                Important updates and notices from your teachers will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          announcements.map((a) => {
            const expired      = isExpired(a.expiresAt)
            const expiringSoon = isExpiringSoon(a.expiresAt)
            const emergency    = a.type === 'emergency'

            return (
              <Card
                key={a.id}
                className={`overflow-hidden transition-shadow hover:shadow-md ${
                  emergency    ? 'border-red-300 bg-red-50'
                  : expiringSoon ? 'border-yellow-300 bg-yellow-50'
                  : expired    ? 'opacity-60'
                  : ''
                }`}
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    {/* Type emoji icon */}
                    <div className="flex-shrink-0 text-xl mt-0.5" aria-hidden="true">
                      {(TYPE_STYLES[a.type] ?? TYPE_STYLES.reminder).icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Title row */}
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <h3 className="font-semibold text-gray-900 text-sm">{a.title}</h3>
                        {typeBadge(a.type)}
                        {expiringSoon && (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                            Expiring Soon
                          </span>
                        )}
                        {expired && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
                            Expired
                          </span>
                        )}
                      </div>

                      {/* Meta */}
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
                        <div className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {a.teacher.name}
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {format(new Date(a.createdAt), 'MMM dd, yyyy')}
                        </div>
                      </div>

                      {/* Body */}
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{a.content}</p>

                      {/* Expiry */}
                      {a.expiresAt && !expired && (
                        <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-500">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Valid until {format(new Date(a.expiresAt), 'MMM dd, yyyy')}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </main>
    </div>
  )
}
