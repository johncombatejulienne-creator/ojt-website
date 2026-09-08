'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import AppShell from '@/components/AppShell'
import { Button } from '@/components/ui/Button'

/* ─── Types ──────────────────────────────────────────────── */
interface Student {
  id: string; studentId: string; name: string; email: string
  profilePicture?: string | null
  section?: { name: string }
  strand?: { name: string }
  narratives: { id: string; status: string }[]
}
interface Section {
  id: string; name: string; gradeLevel: number
  strand: { name: string }
  students: Student[]
}

/* ─── Avatar ─────────────────────────────────────────────── */
function Avatar({ src, name, size = 40 }: { src?: string|null; name: string; size?: number }) {
  const [err, setErr] = useState(false)
  const initials = name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)
  if (src && !err) return (
    <div className="rounded-xl overflow-hidden flex-shrink-0" style={{ width: size, height: size }}>
      <Image src={src} alt={name} width={size} height={size}
        className="object-cover w-full h-full"
        unoptimized={src.startsWith('data:')} onError={() => setErr(true)} />
    </div>
  )
  return (
    <div className="rounded-xl flex items-center justify-center text-white font-bold
      flex-shrink-0 bg-gradient-to-br from-slate-500 to-slate-700"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}>
      {initials}
    </div>
  )
}

/* ─── Stat Card ──────────────────────────────────────────── */
function StatCard({ label, value, icon, gradient }: {
  label: string; value: number; icon: React.ReactNode; gradient: string
}) {
  return (
    <div className={`${gradient} rounded-2xl p-4 sm:p-5 text-white shadow-md flex items-center justify-between gap-3 min-w-0 overflow-hidden`}>
      <div className="min-w-0 flex-1">
        <p className="text-white/75 text-xs font-semibold uppercase tracking-widest truncate mb-1 leading-tight">{label}</p>
        <p className="text-3xl sm:text-4xl font-black leading-none">{value}</p>
      </div>
      <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
    </div>
  )
}

/* ─── Page ───────────────────────────────────────────────── */
export default function TeacherDashboard() {
  const { data: session, status } = useSession()
  const router  = useRouter()
  const [loading, setLoading]   = useState(true)
  const [sections, setSections] = useState<Section[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [active, setActive]     = useState('all')
  const [search, setSearch]     = useState('')

  const fetchData = async () => {
    try {
      const res = await fetch('/api/teacher/sections')
      if (res.ok) {
        const { sections: data } = await res.json()
        setSections(data ?? [])
        const all: Student[] = (data ?? []).flatMap((s: Section) => s.students)
        setStudents(all.sort((a, b) => a.name.localeCompare(b.name)))
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    else if (status === 'authenticated') void fetchData()
  }, [status]) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = students
    .filter(s => active === 'all' || s.section?.name === active)
    .filter(s => !search.trim() ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.studentId.toLowerCase().includes(search.toLowerCase())
    )

  const stats = {
    students: students.length,
    sections: sections.length,
    pending:  students.reduce((n, s) => n + s.narratives.filter(x => x.status === 'pending').length, 0),
  }

  if (loading || status === 'loading') return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-600
          rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-500">Loading dashboard...</p>
      </div>
    </div>
  )

  const userName = session?.user?.name ?? session?.user?.email?.split('@')[0] ?? 'Teacher'

  return (
    <AppShell>
      <div className="space-y-6">

        {/* ── Welcome Banner ─────────────────────────────── */}
        <div className="bg-gradient-to-r from-slate-700 to-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-white shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 opacity-5 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          <div className="relative">
            <p className="text-white/60 text-xs font-medium uppercase tracking-wider">Welcome back</p>
            <h1 className="text-xl sm:text-2xl font-black mt-0.5 truncate">{userName}</h1>
            <p className="text-white/50 text-sm mt-1">
              Teacher Dashboard &mdash; Manage your students and review their work.
            </p>
          </div>
        </div>

        {/* ── Stats ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total Students" value={stats.students}
            gradient="bg-gradient-to-br from-blue-500 to-blue-700"
            icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>}
          />
          <StatCard
            label="Sections" value={stats.sections}
            gradient="bg-gradient-to-br from-violet-500 to-violet-700"
            icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>}
          />
          <StatCard
            label="Pending Reviews" value={stats.pending}
            gradient="bg-gradient-to-br from-rose-500 to-rose-700"
            icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>}
          />
        </div>

        {/* ── Filters & Search ───────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          {/* Section tabs */}
          <div className="flex flex-wrap gap-2">
            {[{ key: 'all', label: `All (${students.length})` },
              ...sections.map(s => ({ key: s.name, label: `${s.name} (${s.students.length})` }))
            ].map(tab => (
              <button key={tab.key} onClick={() => setActive(tab.key)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  active === tab.key
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, or ID..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm
                bg-gray-50 focus:bg-white focus:outline-none focus:ring-2
                focus:ring-slate-300 focus:border-slate-400 transition-all"
            />
          </div>
        </div>

        {/* ── Students List ───────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
            <h2 className="font-bold text-gray-900">
              Students
              {active !== 'all' && <span className="text-gray-400 font-normal"> — {active}</span>}
            </h2>
            <span className="text-xs text-gray-400">{filtered.length} student{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <p className="font-medium text-gray-700 text-sm">
                {search ? 'No students match your search' : 'No students in this section yet'}
              </p>
              {search && (
                <button onClick={() => setSearch('')}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map(s => {
                const pending = s.narratives.filter(n => n.status === 'pending').length
                return (
                  <div key={s.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between
                      gap-3 px-5 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar src={s.profilePicture} name={s.name} size={44} />
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{s.name}</p>
                        <p className="text-xs text-gray-500 truncate">{s.email}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          ID: {s.studentId}
                          {s.strand?.name && ` · ${s.strand.name}`}
                          {s.section?.name && ` · ${s.section.name}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                      {pending > 0 && (
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-800
                          text-xs font-semibold rounded-full whitespace-nowrap">
                          {pending} pending
                        </span>
                      )}
                      <Button size="sm" variant="outline"
                        onClick={() => router.push(`/teacher/students/${s.id}`)}>
                        View
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </AppShell>
  )
}
