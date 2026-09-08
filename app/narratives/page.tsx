'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Button } from '@/components/ui/Button'
import AppShell from '@/components/AppShell'
import PageHeader from '@/components/PageHeader'

interface Narrative {
  id: string; date: string; content: string
  isDraft: boolean; submittedAt: string|null; status: string
}
type Filter = 'all'|'submitted'|'draft'

function getTitle(content: string) {
  const m = content.match(/\*\*Activity:\*\*\s*(.+)/i)
  return m ? m[1].trim() : 'Daily Activity'
}

const STATUS_STYLES: Record<string, string> = {
  approved:           'bg-emerald-100 text-emerald-700',
  pending:            'bg-amber-100 text-amber-700',
  revision_requested: 'bg-orange-100 text-orange-700',
}

export default function NarrativesPage() {
  const router = useRouter()
  const [narratives, setNarratives] = useState<Narrative[]>([])
  const [loading, setLoading]       = useState(true)
  const [filter, setFilter]         = useState<Filter>('all')

  useEffect(() => {
    let cancelled = false
    fetch('/api/narratives').then(r=>r.json())
      .then(d=>{ if(!cancelled){ setNarratives(d.narratives??[]); setLoading(false) } })
      .catch(()=>{ if(!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const counts = { all: narratives.length, submitted: narratives.filter(n=>!n.isDraft).length, draft: narratives.filter(n=>n.isDraft).length }
  const filtered = narratives.filter(n => filter==='all' ? true : filter==='draft' ? n.isDraft : !n.isDraft)

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
        title="My Narratives"
        subtitle={`${counts.all} total submission${counts.all!==1?'s':''}`}
        backHref="/dashboard" backLabel="Dashboard"
        shareOptions={{ title: 'Work Immersion Portal', text: 'Track your daily work immersion narratives.' }}
        action={
          <Button size="sm" onClick={()=>router.push('/narratives/create')}>
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
            </svg>
            New
          </Button>
        }
      />

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        {(['all','submitted','draft'] as Filter[]).map(f=>(
          <button key={f} onClick={()=>setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              filter===f
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-200 hover:text-indigo-600'
            }`}>
            {f.charAt(0).toUpperCase()+f.slice(1)} ({counts[f]})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <p className="font-medium text-gray-700 text-sm">
              {filter==='draft' ? 'No drafts saved.' : filter==='submitted' ? 'No submitted narratives.' : 'No narratives yet.'}
            </p>
            <Button size="sm" onClick={()=>router.push('/narratives/create')}>Write Your First Narrative</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(n => (
            <div key={n.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm
              hover:shadow-md hover:border-indigo-100 transition-all p-5">
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{getTitle(n.content)}</h3>
                    {n.isDraft
                      ? <span className="badge bg-gray-100 text-gray-600">Draft</span>
                      : <span className={`badge ${STATUS_STYLES[n.status]??'bg-gray-100 text-gray-600'}`}>
                          {n.status==='revision_requested'?'Revision Needed'
                            :n.status.charAt(0).toUpperCase()+n.status.slice(1)}
                        </span>
                    }
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                      </svg>
                      {format(new Date(n.date),'MMM dd, yyyy')}
                    </span>
                    {n.submittedAt && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        {format(new Date(n.submittedAt),'MMM dd, h:mm a')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                    {n.content.replace(/\*\*/g,'').slice(0,160)}...
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0 self-end sm:self-start">
                  <Button variant="outline" size="sm" onClick={()=>router.push(`/narratives/${n.id}`)}>View</Button>
                  {n.isDraft && <Button size="sm" onClick={()=>router.push(`/narratives/${n.id}/edit`)}>Edit</Button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  )
}
