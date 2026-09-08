'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { ShareCard } from '@/components/ui/ShareButton'
import AppShell from '@/components/AppShell'

/* ─── Types ──────────────────────────────────────────────── */
interface StudentData {
  id: string
  name: string
  studentId: string
  email: string
  profilePicture?: string | null
  company?: string
  gradeLevel?: number
  strand?: { id: string; name: string; code?: string }
  section?: { name: string }
  supervisor?: { name: string }
}
interface ChecklistStats { totalItems: number; completedItems: number; progressPercentage: number }
interface NarrativeStats { total: number; thisWeek: number; pending: number }

/* ─── Strand config ──────────────────────────────────────── */
const STRAND_CONFIG: Record<string, {
  gradient: string; light: string; text: string; icon: string; tagline: string
}> = {
  STEM:  { gradient: 'from-sky-500 to-indigo-600',   light: 'bg-sky-50',    text: 'text-sky-700',    icon: '⚗️',  tagline: 'Science, Technology, Engineering & Math' },
  ABM:   { gradient: 'from-emerald-500 to-teal-600', light: 'bg-emerald-50',text: 'text-emerald-700',icon: '💼',  tagline: 'Accountancy, Business & Management' },
  HUMSS: { gradient: 'from-violet-500 to-purple-600',light: 'bg-violet-50', text: 'text-violet-700', icon: '📚', tagline: 'Humanities & Social Sciences' },
  TVL:   { gradient: 'from-orange-500 to-amber-500', light: 'bg-orange-50', text: 'text-orange-700', icon: '🔧', tagline: 'Technical-Vocational-Livelihood' },
}
const DEFAULT_STRAND = { gradient: 'from-indigo-500 to-purple-600', light: 'bg-indigo-50', text: 'text-indigo-700', icon: '🎓', tagline: 'Senior High School' }

/* ─── Avatar ─────────────────────────────────────────────── */
function Avatar({ src, name, size = 56 }: { src?: string|null; name?: string|null; size?: number }) {
  const [err, setErr] = useState(false)
  const initials = name ? name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) : '?'
  if (src && !err) return (
    <div className="rounded-2xl overflow-hidden flex-shrink-0 ring-4 ring-white shadow-md"
      style={{ width: size, height: size }}>
      <Image src={src} alt={name??'Profile'} width={size} height={size}
        className="object-cover w-full h-full"
        unoptimized={src.startsWith('data:')} onError={() => setErr(true)} />
    </div>
  )
  return (
    <div className="rounded-2xl flex items-center justify-center text-white font-bold
      flex-shrink-0 ring-4 ring-white shadow-md bg-gradient-to-br from-indigo-500 to-purple-600"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.34) }}>
      {initials}
    </div>
  )
}

/* ─── Stat Card ──────────────────────────────────────────── */
function StatCard({ label, value, sub, color }: {
  label: string; value: string | number; sub?: string; color: string
}) {
  return (
    <div className={`${color} rounded-2xl p-4 sm:p-5 flex flex-col gap-1 min-w-0 overflow-hidden`}>
      <p className="text-white/80 text-xs font-semibold uppercase tracking-widest truncate leading-tight">{label}</p>
      <p className="text-white text-2xl sm:text-3xl font-black leading-none">{value}</p>
      {sub && <p className="text-white/70 text-xs mt-0.5 truncate">{sub}</p>}
    </div>
  )
}

/* ─── Quick Action ───────────────────────────────────────── */
function QuickAction({ label, desc, icon, onClick, primary = false }: {
  label: string; desc: string; icon: React.ReactNode; onClick: () => void; primary?: boolean
}) {
  return (
    <button onClick={onClick}
      className={`group flex flex-col gap-3 p-5 rounded-2xl border-2 text-left
        transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0
        ${primary
          ? 'border-indigo-200 bg-indigo-50 hover:bg-indigo-100 hover:border-indigo-300'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
        }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
        ${primary ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className={`font-semibold text-sm leading-tight ${primary ? 'text-indigo-900' : 'text-gray-900'}`}>
          {label}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </button>
  )
}

/* ─── Page ───────────────────────────────────────────────── */
export default function StudentDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [student, setStudent]   = useState<StudentData | null>(null)
  const [cl, setCl]             = useState<ChecklistStats>({ totalItems: 0, completedItems: 0, progressPercentage: 0 })
  const [ns, setNs]             = useState<NarrativeStats>({ total: 0, thisWeek: 0, pending: 0 })
  const [loading, setLoading]   = useState(true)
  const [needsReg, setNeedsReg] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (!session?.user) return
    const load = async () => {
      try {
        const [pRes, cRes, nRes] = await Promise.all([
          fetch('/api/students/profile'),
          fetch('/api/checklists/my-checklist'),
          fetch('/api/narratives?stats=true'),
        ])
        if (pRes.ok) {
          const { student: s } = await pRes.json()
          setStudent(s)
          if (!s.strandId || !s.sectionId) setNeedsReg(true)
        }
        if (cRes.ok) {
          const { checklists } = await cRes.json()
          if (checklists?.length > 0) setCl(checklists[0].stats)
        }
        if (nRes.ok) {
          const { stats } = await nRes.json()
          if (stats) setNs(stats)
        }
      } catch (e) { console.error(e) }
      finally    { setLoading(false) }
    }
    load()
  }, [session])

  /* Loading */
  if (loading || status === 'loading') return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600
          rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-500">Loading your dashboard...</p>
      </div>
    </div>
  )

  /* Needs registration */
  if (needsReg) return (
    <AppShell>
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="max-w-sm w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Complete Your Profile</h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Fill in your student details to unlock the full Work Immersion dashboard.
          </p>
          <Button onClick={() => router.push('/profile/complete')} fullWidth size="lg">
            Complete Profile
          </Button>
        </div>
      </div>
    </AppShell>
  )

  const strandCode = student?.strand?.name?.toUpperCase().split(' ').find(w =>
    ['STEM','ABM','HUMSS','TVL'].includes(w)
  ) ?? ''
  const theme = STRAND_CONFIG[strandCode] ?? DEFAULT_STRAND
  const pct   = cl.progressPercentage
  const progressColor = pct === 100 ? 'bg-green-500' : pct >= 60 ? 'bg-amber-400' : 'bg-indigo-500'

  return (
    <AppShell strandCode={strandCode}>
      <div className="space-y-6">

        {/* ── Welcome Banner ─────────────────────────────── */}
        <div className={`bg-gradient-to-r ${theme.gradient} rounded-2xl sm:rounded-3xl p-5 sm:p-7
          text-white shadow-lg relative overflow-hidden`}>
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

          <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-shrink-0">
              <Avatar
                src={student?.profilePicture ?? session?.user?.profilePicture}
                name={student?.name ?? session?.user?.name}
                size={56}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/70 text-xs font-medium uppercase tracking-wider">Welcome back</p>
              <h1 className="text-xl sm:text-2xl font-black leading-tight mt-0.5">
                {(student?.name ?? session?.user?.name ?? 'Student').split(' ').slice(0,3).join(' ')}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {student?.studentId && (
                  <span className="bg-white/20 text-white text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap">
                    ID: {student.studentId}
                  </span>
                )}
                {strandCode && (
                  <span className="bg-white/20 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                    {strandCode}
                  </span>
                )}
                {student?.section?.name && (
                  <span className="bg-white/20 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                    {student.section.name}
                  </span>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/profile/edit')}
              className="self-start sm:self-center border-white/30 text-white hover:bg-white/10 flex-shrink-0"
            >
              Edit Profile
            </Button>
          </div>

          {/* Strand tagline */}
          {strandCode && (
            <p className="relative mt-4 text-white/60 text-xs">{theme.icon} {theme.tagline}</p>
          )}
        </div>

        {/* ── Stats Grid ─────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Narratives" value={ns.total}    sub="submitted"  color="bg-gradient-to-br from-indigo-500 to-indigo-600" />
          <StatCard label="This Week"  value={ns.thisWeek} sub="narratives" color="bg-gradient-to-br from-purple-500 to-purple-600" />
          <StatCard label="Pending"    value={ns.pending}  sub="under review" color="bg-gradient-to-br from-amber-400 to-orange-500" />
          <StatCard label="Progress"   value={`${pct}%`}  sub={`${cl.completedItems}/${cl.totalItems} items`} color="bg-gradient-to-br from-emerald-500 to-teal-600" />
        </div>

        {/* ── Progress Bar ───────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
            <div>
              <h2 className="font-bold text-gray-900">Overall Requirements Progress</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {cl.completedItems} of {cl.totalItems} checklist items completed
              </p>
            </div>
            <span className={`text-sm font-semibold px-3 py-1 rounded-full
              ${pct === 100 ? 'bg-green-100 text-green-700'
               : pct >= 60  ? 'bg-amber-100 text-amber-700'
               : 'bg-indigo-100 text-indigo-700'}`}>
              {pct === 100 ? 'Complete' : pct >= 60 ? 'In Progress' : 'Getting Started'}
            </span>
          </div>
          <div className="progress-bar">
            <div className={`progress-fill ${progressColor}`} style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* ── Quick Actions ───────────────────────────────── */}
        <div>
          <h2 className="font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickAction
              primary
              label="New Narrative"
              desc="Document today's activities"
              onClick={() => router.push('/narratives/create')}
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>}
            />
            <QuickAction
              label="My Narratives"
              desc="View all submissions"
              onClick={() => router.push('/narratives')}
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>}
            />
            <QuickAction
              label="Requirements"
              desc="Track your checklist"
              onClick={() => router.push('/checklist')}
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>}
            />
            <QuickAction
              label="Announcements"
              desc="Latest from teachers"
              onClick={() => router.push('/announcements')}
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>}
            />
          </div>
        </div>

        {/* ── Info Row ────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Company */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Company</p>
            <p className="font-semibold text-gray-900 truncate">
              {student?.company ?? <span className="text-gray-400 italic text-sm">Not set</span>}
            </p>
          </div>
          {/* Supervisor */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Supervisor</p>
            <p className="font-semibold text-gray-900 truncate">
              {student?.supervisor?.name ?? <span className="text-gray-400 italic text-sm">Not assigned</span>}
            </p>
          </div>
          {/* Grade */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Grade & Section</p>
            <p className="font-semibold text-gray-900 truncate">
              {student?.gradeLevel && student?.section?.name
                ? `Grade ${student.gradeLevel} — ${student.section.name}`
                : <span className="text-gray-400 italic text-sm">Not set</span>}
            </p>
          </div>
        </div>

        {/* ── Share ───────────────────────────────────────── */}
        <ShareCard
          title="Share the Work Immersion Portal"
          description="Invite classmates or share the platform."
          shareOptions={{ title: 'Work Immersion Portal', text: 'Track your work immersion journey.' }}
        />

        {/* ── Recent Activity ─────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="empty-state py-10">
            <div className="empty-state-icon">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-gray-400">Your recent submissions will appear here</p>
          </div>
        </div>

      </div>
    </AppShell>
  )
}
