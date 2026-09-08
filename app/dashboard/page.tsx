'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ShareCard } from '@/components/ui/ShareButton'
import Header from '@/components/Header'

/* ─── Types ─────────────────────────────────────────── */
interface StudentData {
  id: string
  name: string
  studentId: string
  email: string
  profilePicture?: string | null
  company?: string
  gradeLevel?: number
  strand?: { name: string }
  section?: { name: string }
  supervisor?: { name: string }
}

interface ChecklistStats {
  totalItems: number
  completedItems: number
  progressPercentage: number
}

interface NarrativeStats {
  total: number
  thisWeek: number
  pending: number
}

/* ─── Avatar ─────────────────────────────────────────── */
function Avatar({
  src,
  name,
  size = 64,
}: {
  src?: string | null
  name?: string | null
  size?: number
}) {
  const [err, setErr] = useState(false)
  const initials = name
    ? name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  if (src && !err) {
    return (
      <div
        className="rounded-full overflow-hidden ring-4 ring-white shadow-lg flex-shrink-0"
        style={{ width: size, height: size }}
      >
        <Image
          src={src}
          alt={name ?? 'Profile'}
          width={size}
          height={size}
          className="object-cover w-full h-full"
          unoptimized={src.startsWith('data:')}
          onError={() => setErr(true)}
        />
      </div>
    )
  }

  return (
    <div
      className="rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold ring-4 ring-white shadow-lg flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.33 }}
    >
      {initials}
    </div>
  )
}

/* ─── Stat Card ──────────────────────────────────────── */
function StatCard({
  label,
  value,
  sub,
  color = 'blue',
}: {
  label: string
  value: string | number
  sub?: string
  color?: 'blue' | 'purple' | 'green' | 'yellow'
}) {
  const colors = {
    blue:   'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    green:  'from-green-500 to-green-600',
    yellow: 'from-yellow-400 to-yellow-500',
  }
  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-2xl p-5 text-white shadow-md`}>
      <p className="text-white/80 text-xs font-medium uppercase tracking-wide mb-1">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
      {sub && <p className="text-white/70 text-xs mt-1">{sub}</p>}
    </div>
  )
}

/* ─── Quick Action ───────────────────────────────────── */
function QuickAction({
  label,
  icon,
  onClick,
  variant = 'outline',
}: {
  label: string
  icon: React.ReactNode
  onClick: () => void
  variant?: 'primary' | 'outline'
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 min-h-[90px] w-full
        ${variant === 'primary'
          ? 'bg-gradient-to-br from-blue-600 to-purple-600 border-transparent text-white shadow-md'
          : 'bg-white border-gray-200 text-gray-700 hover:border-purple-300 hover:text-purple-700'
        }`}
    >
      <span className="w-6 h-6">{icon}</span>
      <span className="text-sm font-medium text-center leading-tight">{label}</span>
    </button>
  )
}

/* ─── Page ───────────────────────────────────────────── */
export default function StudentDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [student, setStudent] = useState<StudentData | null>(null)
  const [checklistStats, setChecklistStats] = useState<ChecklistStats>({
    totalItems: 0,
    completedItems: 0,
    progressPercentage: 0,
  })
  const [narrativeStats, setNarrativeStats] = useState<NarrativeStats>({
    total: 0,
    thisWeek: 0,
    pending: 0,
  })
  const [loading, setLoading] = useState(true)
  const [needsRegistration, setNeedsRegistration] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (!session?.user) return

    const load = async () => {
      try {
        const [profileRes, checklistRes, narrativesRes] = await Promise.all([
          fetch('/api/students/profile'),
          fetch('/api/checklists/my-checklist'),
          fetch('/api/narratives?stats=true'),
        ])

        if (profileRes.ok) {
          const { student } = await profileRes.json()
          setStudent(student)
          if (!student.strandId || !student.sectionId) setNeedsRegistration(true)
        }

        if (checklistRes.ok) {
          const { checklists } = await checklistRes.json()
          if (checklists?.length > 0) {
            setChecklistStats(checklists[0].stats)
          }
        }

        if (narrativesRes.ok) {
          const { stats } = await narrativesRes.json()
          setNarrativeStats(stats ?? { total: 0, thisWeek: 0, pending: 0 })
        }
      } catch (err) {
        console.error('Dashboard load error:', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [session])

  /* ── Loading ─────────────────────────────────────────── */
  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading your dashboard…</p>
        </div>
      </div>
    )
  }

  /* ── Incomplete registration prompt ──────────────────── */
  if (needsRegistration) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4">
          <Card className="max-w-md w-full shadow-xl">
            <CardContent padding="lg" className="text-center py-8">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Complete Your Profile</h2>
              <p className="text-gray-500 text-sm mb-6">
                Please fill in your student information to access the Work Immersion System.
              </p>
              <Button onClick={() => router.push('/profile/complete')} fullWidth size="lg">
                Complete Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const progressColor =
    checklistStats.progressPercentage === 100
      ? 'bg-green-500'
      : checklistStats.progressPercentage >= 50
      ? 'bg-yellow-500'
      : 'bg-blue-500'

  const statusLabel =
    checklistStats.progressPercentage === 100
      ? 'Complete ✓'
      : checklistStats.progressPercentage > 50
      ? 'In Progress'
      : 'Getting Started'

  const statusColor =
    checklistStats.progressPercentage === 100
      ? 'bg-green-100 text-green-800'
      : checklistStats.progressPercentage > 50
      ? 'bg-yellow-100 text-yellow-800'
      : 'bg-blue-100 text-blue-800'

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">

        {/* ── Student Profile Card ─────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">

            {/* Avatar */}
            <div className="flex-shrink-0 flex justify-center sm:justify-start">
              <Avatar
                src={student?.profilePicture ?? session?.user?.profilePicture}
                name={student?.name ?? session?.user?.name}
                size={72}
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                <div className="text-center sm:text-left">
                  <h2 className="text-xl font-bold text-gray-900 leading-tight">
                    {student?.name ?? session?.user?.name ?? 'Student'}
                  </h2>
                  <p className="text-sm text-gray-500">{student?.email ?? session?.user?.email}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/profile/edit')}
                  className="self-center sm:self-start flex-shrink-0"
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Profile
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <InfoPill label="Student ID" value={student?.studentId ?? '—'} />
                <InfoPill
                  label="Grade & Section"
                  value={
                    student?.gradeLevel && student?.section?.name
                      ? `G${student.gradeLevel} – ${student.section.name}`
                      : '—'
                  }
                />
                <InfoPill label="Strand" value={student?.strand?.name ?? '—'} />
                {student?.company && (
                  <InfoPill label="Company" value={student.company} />
                )}
                {student?.supervisor && (
                  <InfoPill label="Supervisor" value={student.supervisor.name} />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats Row ────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Narratives" value={narrativeStats.total} sub="submitted" color="blue" />
          <StatCard label="This Week" value={narrativeStats.thisWeek} sub="narratives" color="purple" />
          <StatCard label="Pending Review" value={narrativeStats.pending} sub="awaiting" color="yellow" />
          <StatCard
            label="Progress"
            value={`${checklistStats.progressPercentage}%`}
            sub={`${checklistStats.completedItems}/${checklistStats.totalItems} items`}
            color="green"
          />
        </div>

        {/* ── Progress bar ─────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Overall Requirements Progress</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {checklistStats.completedItems} of {checklistStats.totalItems} checklist items completed
              </p>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor}`}>
              {statusLabel}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className={`${progressColor} h-3 rounded-full transition-all duration-700`}
              style={{ width: `${checklistStats.progressPercentage}%` }}
            />
          </div>
        </div>

        {/* ── Quick Actions ─────────────────────────────── */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <QuickAction
              label="New Narrative"
              variant="primary"
              onClick={() => router.push('/narratives/create')}
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
            />
            <QuickAction
              label="My Narratives"
              onClick={() => router.push('/narratives')}
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            />
            <QuickAction
              label="Requirements"
              onClick={() => router.push('/checklist')}
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              }
            />
            <QuickAction
              label="Announcements"
              onClick={() => router.push('/announcements')}
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              }
            />
          </div>
        </div>

        {/* ── Share Website ─────────────────────────────── */}
        <ShareCard
          title="Share the Work Immersion Program"
          description="Invite classmates or share the platform with anyone who needs it."
          shareOptions={{
            title: 'Work Immersion Program',
            text: 'Track your work immersion journey — daily narratives, requirements, and more.',
          }}
        />

        {/* ── Recent Activity ───────────────────────────── */}
        <Card>
          <CardHeader padding="lg">
            <CardTitle level={3} className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent padding="lg">
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-400 text-sm">Your recent submissions and updates will appear here</p>
            </div>
          </CardContent>
        </Card>

      </main>
    </div>
  )
}

/* ── InfoPill sub-component ─────────────────────────── */
function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-xl px-3 py-2.5">
      <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-gray-800 truncate" title={value}>{value}</p>
    </div>
  )
}
