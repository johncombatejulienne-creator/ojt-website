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

/* ─── Type badge colors ──────────────────────────────── */
const TYPE_BADGE: Record<string, string> = {
  reminder:        'bg-blue-100 text-blue-800',
  deadline:        'bg-red-100 text-red-800',
  schedule_change: 'bg-yellow-100 text-yellow-800',
  instruction:     'bg-green-100 text-green-800',
  meeting:         'bg-purple-100 text-purple-800',
  document:        'bg-indigo-100 text-indigo-800',
  orientation:     'bg-pink-100 text-pink-800',
  workplace:       'bg-orange-100 text-orange-800',
  emergency:       'bg-red-100 text-red-800',
}

/* ─── Type SVG icon ──────────────────────────────────── */
function TypeIcon({ type, className = 'w-5 h-5' }: { type: string; className?: string }) {
  switch (type) {
    case 'deadline':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    case 'schedule_change':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    case 'emergency':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    case 'instruction':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    case 'meeting':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    default:
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      )
  }
}

function TypeBadge({ type }: { type: string }) {
  const badgeClass = TYPE_BADGE[type] ?? 'bg-gray-100 text-gray-700'
  const label = type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}>
      {label}
    </span>
  )
}

/* ─── Pure helpers ───────────────────────────────────── */
function isExpiringSoon(expiresAt?: string): boolean {
  if (!expiresAt) return false
  const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000)
  return days > 0 && days <= 3
}

function isExpired(expiresAt?: string): boolean {
  return !!expiresAt && new Date(expiresAt).getTime() < Date.now()
}

/* ─── Page ───────────────────────────────────────────── */
export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch('/api/announcements')
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setAnnouncements(data.announcements ?? [])
          setLoading(false)
        }
      })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading announcements...</p>
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
                  emergency      ? 'border-red-300 bg-red-50'
                  : expiringSoon ? 'border-yellow-300 bg-yellow-50'
                  : expired      ? 'opacity-60'
                  : ''
                }`}
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    {/* SVG icon */}
                    <div className={`flex-shrink-0 mt-0.5 ${emergency ? 'text-red-500' : 'text-blue-500'}`}>
                      <TypeIcon type={a.type} className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Title row */}
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <h3 className="font-semibold text-gray-900 text-sm">{a.title}</h3>
                        <TypeBadge type={a.type} />
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
