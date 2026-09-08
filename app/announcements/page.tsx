'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import AppShell from '@/components/AppShell'
import PageHeader from '@/components/PageHeader'

interface Announcement {
  id:string; title:string; content:string; type:string
  targetType:string; expiresAt?:string; createdAt:string
  teacher: { name:string }
}

/* ─── Pure helpers ─────────────────────────────────────── */
function isExpiringSoon(expiresAt?: string): boolean {
  if (!expiresAt) return false
  const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000)
  return days > 0 && days <= 3
}
function isExpired(expiresAt?: string): boolean {
  return !!expiresAt && new Date(expiresAt).getTime() < Date.now()
}

const TYPE_COLORS: Record<string,string> = {
  reminder:        'bg-blue-100 text-blue-800',
  deadline:        'bg-red-100 text-red-800',
  schedule_change: 'bg-amber-100 text-amber-800',
  instruction:     'bg-emerald-100 text-emerald-800',
  meeting:         'bg-violet-100 text-violet-800',
  document:        'bg-indigo-100 text-indigo-800',
  orientation:     'bg-pink-100 text-pink-800',
  workplace:       'bg-orange-100 text-orange-800',
  emergency:       'bg-red-100 text-red-800',
}

function TypeIcon({ type }: { type: string }) {
  const cls = 'w-5 h-5'
  if (type === 'deadline') return (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  )
  if (type === 'emergency') return (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
    </svg>
  )
  if (type === 'schedule_change') return (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
    </svg>
  )
  return (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
    </svg>
  )
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading]             = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch('/api/announcements').then(r=>r.json())
      .then(d=>{ if(!cancelled){ setAnnouncements(d.announcements??[]); setLoading(false) } })
      .catch(()=>{ if(!cancelled) setLoading(false) })
    return ()=>{ cancelled=true }
  },[])

  if (loading) return (
    <AppShell>
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    </AppShell>
  )

  return (
    <AppShell>
      <PageHeader
        title="Announcements"
        subtitle={`${announcements.length} announcement${announcements.length!==1?'s':''}`}
        backHref="/dashboard" backLabel="Dashboard"
        shareOptions={{ title: 'Work Immersion Portal', text: 'Stay updated with the latest announcements.' }}
      />

      {announcements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>
              </svg>
            </div>
            <p className="font-medium text-gray-700 text-sm">No announcements yet</p>
            <p className="text-xs text-gray-400">Important updates from your teachers will appear here.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4 max-w-3xl">
          {announcements.map(a => {
            const expired  = isExpired(a.expiresAt)
            const expiring = isExpiringSoon(a.expiresAt)
            const urgent   = a.type === 'emergency'
            return (
              <div key={a.id}
                className={`bg-white rounded-2xl border shadow-sm hover:shadow-md
                  transition-all p-5 sm:p-6
                  ${urgent   ? 'border-red-200 bg-red-50/30'
                  : expiring ? 'border-amber-200 bg-amber-50/30'
                  : expired  ? 'border-gray-100 opacity-60'
                  : 'border-gray-100'}`}>
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`flex-shrink-0 mt-0.5 ${urgent?'text-red-500':'text-indigo-400'}`}>
                    <TypeIcon type={a.type} />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Title + badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 text-sm leading-snug">{a.title}</h3>
                      <span className={`badge ${TYPE_COLORS[a.type]??'badge-gray'}`}>
                        {a.type.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}
                      </span>
                      {expiring && !expired && (
                        <span className="badge badge-yellow">Expiring Soon</span>
                      )}
                      {expired && <span className="badge badge-gray">Expired</span>}
                    </div>

                    {/* Meta */}
                    <div className="flex flex-wrap gap-3 text-xs text-gray-400 mb-3">
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                        </svg>
                        {a.teacher.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                        {format(new Date(a.createdAt),'MMM dd, yyyy')}
                      </span>
                    </div>

                    {/* Body */}
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{a.content}</p>

                    {/* Expiry */}
                    {a.expiresAt && !expired && (
                      <p className="mt-3 text-xs text-gray-400 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        Valid until {format(new Date(a.expiresAt),'MMM dd, yyyy')}
                      </p>
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
