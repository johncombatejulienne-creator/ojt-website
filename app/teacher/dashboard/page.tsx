'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Header from '@/components/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

/* â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
interface Student {
  id: string
  studentId: string
  name: string
  email: string
  profilePicture?: string | null
  section?: { name: string }
  strand?: { name: string }
  narratives: { id: string; status: string }[]
}

interface Section {
  id: string
  name: string
  gradeLevel: number
  strand: { name: string }
  students: Student[]
}

/* â”€â”€â”€ Avatar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function Avatar({ src, name, size = 44 }: { src?: string | null; name: string; size?: number }) {
  const [err, setErr] = useState(false)
  const initial = name.charAt(0).toUpperCase()

  if (src && !err) {
    return (
      <div className="rounded-full overflow-hidden flex-shrink-0" style={{ width: size, height: size }}>
        <Image
          src={src}
          alt={name}
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
      className="rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initial}
    </div>
  )
}

/* â”€â”€â”€ Stat Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function StatCard({
  label, value, icon, gradient,
}: {
  label: string; value: number; icon: React.ReactNode; gradient: string
}) {
  return (
    <div className={`${gradient} rounded-2xl p-5 text-white shadow-md flex items-center justify-between gap-4`}>
      <div>
        <p className="text-white/80 text-xs font-medium uppercase tracking-wide">{label}</p>
        <p className="text-4xl font-bold mt-1">{value}</p>
      </div>
      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
    </div>
  )
}

/* â”€â”€â”€ Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export default function TeacherDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [sections, setSections] = useState<Section[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [activeSection, setActiveSection] = useState<string>('all')
  const [search, setSearch] = useState('')

  const fetchData = async () => {
    try {
      const res = await fetch('/api/teacher/sections')
      if (res.ok) {
        const { sections: data } = await res.json()
        setSections(data ?? [])
        const all: Student[] = (data ?? []).flatMap((s: Section) => s.students)
        setStudents(all.sort((a, b) => a.name.localeCompare(b.name)))
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    // eslint-disable-next-line react-hooks/set-state-in-effect
    else if (status === 'authenticated') fetchData()
  }, [status]) // eslint-disable-line react-hooks/exhaustive-deps


  const filtered = students
    .filter((s) => activeSection === 'all' || s.section?.name === activeSection)
    .filter((s) =>
      !search.trim() ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.studentId.toLowerCase().includes(search.toLowerCase())
    )

  const stats = {
    students:  students.length,
    sections:  sections.length,
    pending:   students.reduce((n, s) => n + s.narratives.filter((x) => x.status === 'pending').length, 0),
  }

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading dashboardâ€¦</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">

        {/* Welcome */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Teacher Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Welcome back, {session?.user?.name ?? 'Teacher'}! Manage your students and review their work.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total Students"
            value={stats.students}
            gradient="bg-gradient-to-br from-blue-500 to-blue-600"
            icon={
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
          />
          <StatCard
            label="Sections"
            value={stats.sections}
            gradient="bg-gradient-to-br from-purple-500 to-purple-600"
            icon={
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            }
          />
          <StatCard
            label="Pending Reviews"
            value={stats.pending}
            gradient="bg-gradient-to-br from-pink-500 to-pink-600"
            icon={
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
        </div>

        {/* Filters + Search */}
        <Card>
          <CardContent padding="lg">
            <div className="space-y-3">
              {/* Section tabs */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveSection('all')}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    activeSection === 'all'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All ({students.length})
                </button>
                {sections.map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => setActiveSection(sec.name)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      activeSection === sec.name
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {sec.name} ({sec.students.length})
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search students by name, email, or IDâ€¦"
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students list */}
        <Card>
          <CardHeader padding="lg" divider>
            <div className="flex items-center justify-between gap-3">
              <CardTitle level={3}>
                Students {activeSection !== 'all' && `â€” ${activeSection}`}
              </CardTitle>
              <span className="text-xs text-gray-400">
                {filtered.length} student{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>
          </CardHeader>
          <CardContent padding="lg">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center text-center py-12">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">
                  {search ? 'No students match your search.' : 'No students in this section yet.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((s) => {
                  const pending = s.narratives.filter((n) => n.status === 'pending').length
                  return (
                    <div
                      key={s.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      {/* Left: avatar + info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar src={s.profilePicture} name={s.name} size={44} />
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{s.name}</p>
                          <p className="text-xs text-gray-500 truncate">{s.email}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            ID: {s.studentId}
                            {s.strand?.name && ` Â· ${s.strand.name}`}
                            {s.section?.name && ` Â· ${s.section.name}`}
                          </p>
                        </div>
                      </div>

                      {/* Right: pending badge + action */}
                      <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                        {pending > 0 && (
                          <span className="px-2.5 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                            {pending} pending
                          </span>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/teacher/students/${s.id}`)}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

      </main>
    </div>
  )
}

