'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import PageHeader from '@/components/PageHeader'

interface ChecklistItem {
  id:string; title:string; description?:string; order:number
  requirementType:string; isRequired:boolean; targetCount?:number
  progress: { status:string; completedCount:number; completedAt?:string; notes?:string }
}
interface Checklist {
  id:string; name:string; description?:string
  items: ChecklistItem[]
  stats: { totalItems:number; completedItems:number; progressPercentage:number }
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string,string> = {
    completed:   'badge-green',
    in_progress: 'badge-yellow',
    pending:     'badge-gray',
  }
  const labels: Record<string,string> = { completed:'Done', in_progress:'In Progress', pending:'Pending' }
  return <span className={`badge ${styles[status]??'badge-gray'}`}>{labels[status]??status}</span>
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'completed') return (
    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
      </svg>
    </div>
  )
  if (status === 'in_progress') return (
    <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center flex-shrink-0">
      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    </div>
  )
  return (
    <div className="w-6 h-6 rounded-full border-2 border-gray-300 bg-white flex-shrink-0" />
  )
}

export default function ChecklistPage() {
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch('/api/checklists/my-checklist').then(r=>r.json())
      .then(d=>{ if(!cancelled){ setChecklists(d.checklists??[]); setLoading(false) } })
      .catch(()=>{ if(!cancelled) setLoading(false) })
    return ()=>{ cancelled=true }
  }, [])

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
        title="Requirements Checklist"
        subtitle="Track your work immersion requirements and progress"
        backHref="/dashboard" backLabel="Dashboard"
        shareOptions={{ title: 'Work Immersion Portal', text: 'Check your work immersion requirements.' }}
      />

      {checklists.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </div>
            <p className="font-medium text-gray-700 text-sm">No requirements assigned yet</p>
            <p className="text-xs text-gray-400 max-w-xs">Your teacher will assign a requirements checklist soon.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {checklists.map(cl => {
            const pct = cl.stats.progressPercentage
            const barColor = pct===100?'bg-emerald-500':pct>=50?'bg-amber-400':'bg-indigo-500'
            return (
              <div key={cl.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-bold text-gray-900">{cl.name}</h2>
                      {cl.description && <p className="text-sm text-gray-500 mt-0.5">{cl.description}</p>}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-3xl font-black text-indigo-600 leading-none">{pct}%</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {cl.stats.completedItems}/{cl.stats.totalItems} items
                      </p>
                    </div>
                  </div>
                  <div className="progress-bar mt-4">
                    <div className={`progress-fill ${barColor}`} style={{width:`${pct}%`}} />
                  </div>
                </div>

                {/* Items */}
                <div className="divide-y divide-gray-50">
                  {cl.items.map((item, i) => (
                    <div key={item.id} className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="mt-0.5">
                        <StatusIcon status={item.progress.status} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900 text-sm">{item.title}</span>
                          {item.isRequired && (
                            <span className="badge bg-red-50 text-red-600 text-xs">Required</span>
                          )}
                          <StatusBadge status={item.progress.status} />
                        </div>
                        {item.description && (
                          <p className="text-xs text-gray-500 mb-1.5 leading-relaxed">{item.description}</p>
                        )}
                        <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                          <span className="capitalize">{item.requirementType}</span>
                          {item.targetCount!=null && (
                            <span>{item.progress.completedCount}/{item.targetCount}</span>
                          )}
                        </div>
                        {item.progress.notes && (
                          <div className="mt-2 px-3 py-2 bg-indigo-50 rounded-lg text-xs text-indigo-700">
                            <strong>Note:</strong> {item.progress.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {/* Help */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <div>
                <p className="text-sm font-semibold text-indigo-800 mb-1.5">How requirements are tracked</p>
                <ul className="text-xs text-indigo-700 space-y-1 list-disc list-inside leading-relaxed">
                  <li>Some items update automatically (e.g. narrative count)</li>
                  <li>Document submissions are verified by your teacher</li>
                  <li>Check back regularly to see updated progress</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
