'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
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
  id: string; name: string
  strand: { name: string }
  students: Student[]
}
interface Teacher {
  id: string; teacherId: string; name: string; email: string
  profilePicture?: string | null
  role: string; accessLevel: string; createdAt: string
  sections: { id: string; name: string }[]
}
interface Announcement {
  id: string; title: string; content: string; type: string
  targetType: string; publishedAt: string
  teacher: { name: string; email: string }
}

/* ─── Avatar ─────────────────────────────────────────────── */
function Ava({ src, name, size = 40, round = false }: {
  src?: string | null; name: string; size?: number; round?: boolean
}) {
  const [err, setErr] = useState(false)
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const radius = round ? '50%' : 10
  const base = {
    width: size, height: size, borderRadius: radius,
    flexShrink: 0, display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontWeight: 700,
    fontSize: Math.round(size * 0.36), color: 'white',
  }
  if (src && !err) return (
    <div style={{ ...base, overflow: 'hidden' }}>
      <Image src={src} alt={name} width={size} height={size}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        unoptimized={src.startsWith('data:')} onError={() => setErr(true)} />
    </div>
  )
  return (
    <div style={{ ...base, background: 'linear-gradient(135deg,#475569,#1E293B)' }}>
      {initials}
    </div>
  )
}

/* ─── Stat Card ──────────────────────────────────────────── */
function StatCard({ label, value, icon, bg }: {
  label: string; value: number; icon: React.ReactNode; bg: string
}) {
  return (
    <div style={{
      background: bg, borderRadius: 16, padding: '16px 18px', color: 'white',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 12, overflow: 'hidden', boxSizing: 'border-box',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{
          fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.07em', color: 'rgba(255,255,255,0.75)',
          marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{label}</p>
        <p style={{ fontSize: 34, fontWeight: 900, lineHeight: 1 }}>{value}</p>
      </div>
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: 'rgba(255,255,255,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>{icon}</div>
    </div>
  )
}

/* ─── Tab Button ─────────────────────────────────────────── */
function Tab({ label, active, count, onClick }: {
  label: string; active: boolean; count?: number; onClick: () => void
}) {
  return (
    <button onClick={onClick} style={{
      padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
      border: 'none', cursor: 'pointer', transition: 'all 0.15s',
      background: active ? '#1E293B' : '#F3F4F6',
      color: active ? 'white' : '#4B5563',
      display: 'flex', alignItems: 'center', gap: 6,
    }}>
      {label}
      {count !== undefined && (
        <span style={{
          background: active ? 'rgba(255,255,255,0.2)' : '#E5E7EB',
          color: active ? 'white' : '#6B7280',
          fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 999,
        }}>{count}</span>
      )}
    </button>
  )
}

/* ─── Confirm Modal ──────────────────────────────────────── */
function ConfirmModal({ title, body, confirmLabel = 'Confirm', danger = false,
  onConfirm, onCancel, loading }: {
  title: string; body: React.ReactNode; confirmLabel?: string
  danger?: boolean; onConfirm: () => void; onCancel: () => void; loading?: boolean
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200, padding: 16,
    }}>
      <div style={{
        background: 'white', borderRadius: 20, padding: 32,
        maxWidth: 420, width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
      }}>
        <div style={{
          width: 56, height: 56, background: danger ? '#FEE2E2' : '#EFF6FF',
          borderRadius: 14, display: 'flex', alignItems: 'center',
          justifyContent: 'center', marginBottom: 20,
        }}>
          <svg style={{ width: 28, height: 28, color: danger ? '#DC2626' : '#3B82F6' }}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d={danger
                ? 'M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z'
                : 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'} />
          </svg>
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 8 }}>{title}</h2>
        <div style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, marginBottom: 24 }}>{body}</div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onCancel} disabled={loading}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 14, fontWeight: 600,
              background: '#F3F4F6', color: '#374151', border: 'none', cursor: 'pointer',
            }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 14, fontWeight: 600,
              background: danger ? '#DC2626' : '#3B82F6', color: 'white',
              border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}>
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Page ───────────────────────────────────────────────── */
type ActiveTab = 'students' | 'teachers' | 'announcements' | 'narratives'

interface PendingNarrative {
  id: string; date: string; content: string; status: string
  submissionDate?: string; submissionTime?: string
  student: { id: string; name: string; studentId: string; email: string }
  photos: { url: string; isVerified: boolean }[]
}

export default function TeacherDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [loading,   setLoading]   = useState(true)
  const [activeTab, setActiveTab] = useState<ActiveTab>('students')

  // Students state
  const [sections,  setSections]  = useState<Section[]>([])
  const [students,  setStudents]  = useState<Student[]>([])
  const [sectionFilter, setSectionFilter] = useState('all')
  const [search,    setSearch]    = useState('')

  // Teachers state
  const [teachers,  setTeachers]  = useState<Teacher[]>([])
  const [teacherSearch, setTeacherSearch] = useState('')

  // Narratives state
  const [pendingNarratives, setPendingNarratives] = useState<PendingNarrative[]>([])
  const [reviewingId,       setReviewingId]       = useState<string | null>(null)
  const [reviewComment,     setReviewComment]     = useState('')
  const [reviewSubmitting,  setReviewSubmitting]  = useState(false)

  // Announcements state
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [annoForm, setAnnoForm] = useState({
    title: '', content: '', type: 'reminder', targetType: 'all',
  })
  const [annoSubmitting, setAnnoSubmitting] = useState(false)
  const [annoError,      setAnnoError]      = useState('')
  const [annoSuccess,    setAnnoSuccess]    = useState('')

  // Delete states
  const [deleteAccountConfirm, setDeleteAccountConfirm] = useState(false)
  const [deletingAccount,      setDeletingAccount]      = useState(false)
  const [deleteStudentTarget,  setDeleteStudentTarget]  = useState<Student | null>(null)
  const [deletingStudent,      setDeletingStudent]      = useState(false)

  /* ── Load all data ──────────────────────────────────────── */
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch all three in parallel — each error is handled independently
      const [secRes, teachRes, annoRes, narrRes] = await Promise.all([
        fetch('/api/teacher/sections').catch(() => null),
        fetch('/api/teacher/list').catch(() => null),
        fetch('/api/announcements').catch(() => null),
        fetch('/api/narratives?status=pending&limit=50').catch(() => null),
      ])

      if (secRes?.ok) {
        try {
          const d = await secRes.json()
          setSections(d.sections ?? [])
          setStudents((d.allStudents ?? []).sort((a: Student, b: Student) =>
            a.name.localeCompare(b.name)))
        } catch (e) { console.error('sections parse error', e) }
      } else {
        console.warn('sections API status:', secRes?.status)
      }

      if (teachRes?.ok) {
        try {
          const d = await teachRes.json()
          setTeachers(d.teachers ?? [])
        } catch (e) { console.error('teachers parse error', e) }
      } else {
        console.warn('teachers API status:', teachRes?.status)
      }

      if (annoRes?.ok) {
        try {
          const d = await annoRes.json()
          setAnnouncements(d.announcements ?? [])
        } catch (e) { console.error('announcements parse error', e) }
      } else {
        console.warn('announcements API status:', annoRes?.status)
      }

      if (narrRes?.ok) {
        try {
          const d = await narrRes.json()
          setPendingNarratives(d.narratives ?? [])
        } catch (e) { console.error('narratives parse error', e) }
      }
    } catch (e) {
      console.error('loadData error', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    else if (status === 'authenticated') void loadData()
  }, [status, loadData]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Filtered students ──────────────────────────────────── */
  const filteredStudents = students
    .filter(s => {
      if (sectionFilter === 'all') return true
      if (sectionFilter === 'Unassigned') return !s.section?.name
      return s.section?.name === sectionFilter
    })
    .filter(s => !search.trim() ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.studentId.toLowerCase().includes(search.toLowerCase()))

  const filteredTeachers = teachers.filter(t =>
    !teacherSearch.trim() ||
    t.name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
    t.email.toLowerCase().includes(teacherSearch.toLowerCase()))

  const stats = {
    students:  students.length,
    sections:  sections.filter(s => s.id !== 'unassigned').length,
    pending:   students.reduce((n, s) =>
      n + s.narratives.filter(x => x.status === 'pending').length, 0),
  }

  /* ── Delete own account ─────────────────────────────────── */
  const handleDeleteAccount = async () => {
    setDeletingAccount(true)
    try {
      const res = await fetch('/api/teacher/delete-account', { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      await signOut({ callbackUrl: '/login', redirect: true })
    } catch {
      setDeletingAccount(false)
      setDeleteAccountConfirm(false)
      alert('Failed to delete account. Please try again.')
    }
  }

  /* ── Delete student ─────────────────────────────────────── */
  const handleDeleteStudent = async () => {
    if (!deleteStudentTarget) return
    setDeletingStudent(true)
    try {
      const res = await fetch(`/api/teacher/students/${deleteStudentTarget.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      setStudents(prev => prev.filter(s => s.id !== deleteStudentTarget.id))
      setSections(prev => prev.map(sec => ({
        ...sec, students: sec.students.filter(s => s.id !== deleteStudentTarget.id),
      })))
      setDeleteStudentTarget(null)
    } catch {
      alert('Failed to delete student.')
    } finally {
      setDeletingStudent(false)
    }
  }

  /* ── Review narrative ───────────────────────────────────── */
  const handleReview = async (narrativeId: string, action: 'approved' | 'revision_requested') => {
    setReviewSubmitting(true)
    try {
      const res = await fetch(`/api/narratives/${narrativeId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, comment: reviewComment.trim() || undefined }),
      })
      if (res.ok) {
        // Remove from pending list or update status
        setPendingNarratives(prev => prev.filter(n => n.id !== narrativeId))
        setReviewingId(null)
        setReviewComment('')
      }
    } catch { /* silent */ }
    finally { setReviewSubmitting(false) }
  }

  /* ── Post announcement ──────────────────────────────────── */
  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    setAnnoError(''); setAnnoSuccess('')
    if (!annoForm.title.trim()) { setAnnoError('Title is required.'); return }
    if (!annoForm.content.trim()) { setAnnoError('Content is required.'); return }
    setAnnoSubmitting(true)
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(annoForm),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error ?? 'Failed')
      setAnnouncements(prev => [d.announcement, ...prev])
      setAnnoForm({ title: '', content: '', type: 'reminder', targetType: 'all' })
      setAnnoSuccess('Announcement posted successfully!')
      setTimeout(() => setAnnoSuccess(''), 3000)
    } catch (err: unknown) {
      setAnnoError(err instanceof Error ? err.message : 'Failed to post announcement.')
    } finally {
      setAnnoSubmitting(false)
    }
  }

  /* ── Delete announcement ────────────────────────────────── */
  const handleDeleteAnnouncement = async (id: string) => {
    try {
      await fetch('/api/announcements', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      setAnnouncements(prev => prev.filter(a => a.id !== id))
    } catch { /* silent */ }
  }

  /* ── Loading ─────────────────────────────────────────────── */
  if (loading || status === 'loading') return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#F8FAFC',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 48, height: 48, border: '4px solid #CBD5E1',
          borderTopColor: '#475569', borderRadius: '50%',
          animation: 'spin 1s linear infinite', margin: '0 auto 12px',
        }} />
        <p style={{ fontSize: 14, color: '#6B7280' }}>Loading dashboard...</p>
      </div>
    </div>
  )

  const userName = session?.user?.name ?? session?.user?.email?.split('@')[0] ?? 'Teacher'

  const labelStyle = {
    display: 'block', fontSize: 11, fontWeight: 700,
    color: '#6B7280', textTransform: 'uppercase' as const,
    letterSpacing: '0.07em', marginBottom: 6,
  }
  const inputStyle = {
    width: '100%', padding: '10px 14px', border: '1.5px solid #E5E7EB',
    borderRadius: 10, fontSize: 14, outline: 'none', background: 'white',
    fontFamily: 'inherit', boxSizing: 'border-box' as const,
  }
  const selectStyle = { ...inputStyle, appearance: 'auto' as const }

  return (
    <AppShell forceTeacher>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Welcome Banner ──────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg,#374151,#1F2937)',
          borderRadius: 20, padding: '20px 24px', color: 'white',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)', boxSizing: 'border-box',
          position: 'relative', overflow: 'hidden',
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.06em', color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
            Teacher Dashboard
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {userName}
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
            Manage students, post announcements, and review work.
          </p>
          <button onClick={() => setDeleteAccountConfirm(true)} style={{
            marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 12, color: 'rgba(255,120,120,0.9)', fontWeight: 600,
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,100,100,0.2)',
            borderRadius: 8, padding: '5px 12px', cursor: 'pointer',
          }}>
            <svg style={{ width: 13, height: 13 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete My Account
          </button>
        </div>

        {/* ── Stats ───────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 12 }}>
          <StatCard label="Total Students" value={stats.students}
            bg="linear-gradient(135deg,#F97316,#EA580C)"
            icon={<svg style={{ width: 22, height: 22, color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
          />
          <StatCard label="Teachers" value={teachers.length}
            bg="linear-gradient(135deg,#D97706,#B45309)"
            icon={<svg style={{ width: 22, height: 22, color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
          />
          <StatCard label="Pending Reviews" value={stats.pending}
            bg="linear-gradient(135deg,#6B7280,#4B5563)"
            icon={<svg style={{ width: 22, height: 22, color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
          />
        </div>

        {/* ── Tabs ────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Tab label="Students"      active={activeTab === 'students'}      count={students.length}      onClick={() => setActiveTab('students')} />
          <Tab label="Teachers"      active={activeTab === 'teachers'}      count={teachers.length}      onClick={() => setActiveTab('teachers')} />
          <Tab label="Narratives"    active={activeTab === 'narratives'}    count={pendingNarratives.length} onClick={() => setActiveTab('narratives')} />
          <Tab label="Announcements" active={activeTab === 'announcements'} count={announcements.length} onClick={() => setActiveTab('announcements')} />
        </div>

        {/* ════════════════════════════════════════════════
            STUDENTS TAB
        ════════════════════════════════════════════════ */}
        {activeTab === 'students' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Section filter + search */}
            <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 16, padding: '16px 20px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                {[{ key: 'all', label: `All (${students.length})` },
                  ...sections.map(s => ({ key: s.name, label: `${s.name} (${s.students.length})` }))
                ].map(tab => (
                  <button key={tab.key} onClick={() => setSectionFilter(tab.key)} style={{
                    padding: '5px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                    border: 'none', cursor: 'pointer',
                    background: sectionFilter === tab.key ? '#1E293B' : '#F3F4F6',
                    color: sectionFilter === tab.key ? 'white' : '#4B5563',
                  }}>{tab.label}</button>
                ))}
              </div>
              <div style={{ position: 'relative' }}>
                <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  width: 16, height: 16, color: '#9CA3AF', pointerEvents: 'none' }}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search students by name, email, or ID..."
                  style={{ ...inputStyle, paddingLeft: 36 }}
                  onFocus={e => { e.target.style.borderColor = '#6366F1' }}
                  onBlur={e => { e.target.style.borderColor = '#E5E7EB' }}
                />
              </div>
            </div>

            {/* Student list */}
            <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #F3F4F6',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>
                  Students {sectionFilter !== 'all' && `— ${sectionFilter}`}
                </p>
                <span style={{ fontSize: 12, color: '#9CA3AF' }}>{filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}</span>
              </div>

              {filteredStudents.length === 0 ? (
                <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                  <div style={{ width: 48, height: 48, background: '#F3F4F6', borderRadius: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <svg style={{ width: 24, height: 24, color: '#9CA3AF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>
                    {search ? 'No students match your search' : 'No students yet'}
                  </p>
                </div>
              ) : (
                filteredStudents.map((s, i) => {
                  const pending = s.narratives.filter(n => n.status === 'pending').length
                  return (
                    <div key={s.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      gap: 12, padding: '12px 20px', flexWrap: 'wrap',
                      borderBottom: i < filteredStudents.length - 1 ? '1px solid #F9FAFB' : 'none',
                      boxSizing: 'border-box',
                    }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F9FAFB' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                        <Ava src={s.profilePicture} name={s.name} size={42} />
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontWeight: 600, fontSize: 14, color: '#111827',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</p>
                          <p style={{ fontSize: 12, color: '#6B7280',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.email}</p>
                          <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>
                            {s.studentId}{s.strand?.name ? ` · ${s.strand.name}` : ''}{s.section?.name ? ` · ${s.section.name}` : ' · No section'}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        {pending > 0 && (
                          <span style={{ background: '#FEF3C7', color: '#92400E', fontSize: 11,
                            fontWeight: 700, padding: '3px 10px', borderRadius: 999, whiteSpace: 'nowrap' }}>
                            {pending} pending
                          </span>
                        )}
                        <Button size="sm" variant="outline"
                          onClick={() => router.push(`/teacher/students/${s.id}`)}>
                          View
                        </Button>
                        <button onClick={() => setDeleteStudentTarget(s)} style={{
                          padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                          background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA',
                          cursor: 'pointer',
                        }}>
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════
            TEACHERS TAB
        ════════════════════════════════════════════════ */}
        {activeTab === 'teachers' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 16, padding: '14px 20px' }}>
              <input type="text" value={teacherSearch} onChange={e => setTeacherSearch(e.target.value)}
                placeholder="Search teachers by name or email..."
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = '#6366F1' }}
                onBlur={e => { e.target.style.borderColor = '#E5E7EB' }}
              />
            </div>

            <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #F3F4F6',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>Registered Teachers</p>
                <span style={{ fontSize: 12, color: '#9CA3AF' }}>{filteredTeachers.length} teacher{filteredTeachers.length !== 1 ? 's' : ''}</span>
              </div>

              {filteredTeachers.length === 0 ? (
                <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                  <p style={{ fontSize: 14, color: '#9CA3AF' }}>No teachers found</p>
                </div>
              ) : (
                filteredTeachers.map((t, i) => (
                  <div key={t.id} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px',
                    borderBottom: i < filteredTeachers.length - 1 ? '1px solid #F9FAFB' : 'none',
                    boxSizing: 'border-box',
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F9FAFB' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    <Ava src={t.profilePicture} name={t.name} size={44} round />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <p style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{t.name}</p>
                        {t.email === session?.user?.email && (
                          <span style={{ fontSize: 10, fontWeight: 700, background: '#EEF2FF',
                            color: '#4F46E5', padding: '2px 8px', borderRadius: 999 }}>YOU</span>
                        )}
                        <span style={{ fontSize: 10, fontWeight: 600, background: '#F3F4F6',
                          color: '#6B7280', padding: '2px 8px', borderRadius: 999, textTransform: 'capitalize' }}>
                          {t.accessLevel}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: '#6B7280', marginTop: 1 }}>{t.email}</p>
                      <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>
                        ID: {t.teacherId}
                        {t.sections.length > 0 && ` · ${t.sections.length} section${t.sections.length !== 1 ? 's' : ''}`}
                      </p>
                    </div>
                    <p style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0 }}>
                      {new Date(t.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════
            NARRATIVES TAB — review pending submissions
        ════════════════════════════════════════════════ */}
        {activeTab === 'narratives' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Review comment modal */}
            {reviewingId && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 200, padding: 16 }}>
                <div style={{ background: 'white', borderRadius: 20, padding: 28,
                  maxWidth: 440, width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: '#111827', marginBottom: 6 }}>
                    Add a Comment (Optional)
                  </h3>
                  <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 14 }}>
                    Leave feedback for the student — they will receive a notification.
                  </p>
                  <textarea
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                    placeholder="e.g. Great work! Keep it up. / Please add more detail about your tasks."
                    rows={4}
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E5E7EB',
                      borderRadius: 10, fontSize: 14, fontFamily: 'inherit', resize: 'vertical',
                      outline: 'none', boxSizing: 'border-box' as const }}
                  />
                  <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                    <button onClick={() => { setReviewingId(null); setReviewComment('') }}
                      disabled={reviewSubmitting}
                      style={{ flex: 1, padding: '10px', background: '#F3F4F6', color: '#374151',
                        border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'inherit' }}>
                      Cancel
                    </button>
                    <button
                      onClick={() => handleReview(reviewingId, 'revision_requested')}
                      disabled={reviewSubmitting}
                      style={{ flex: 1, padding: '10px', background: '#FFEDD5', color: '#9A3412',
                        border: '1px solid #FED7AA', borderRadius: 10, fontSize: 13, fontWeight: 700,
                        cursor: reviewSubmitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                      {reviewSubmitting ? '...' : 'Request Revision'}
                    </button>
                    <button
                      onClick={() => handleReview(reviewingId, 'approved')}
                      disabled={reviewSubmitting}
                      style={{ flex: 1, padding: '10px', background: '#D1FAE5', color: '#065F46',
                        border: '1px solid #A7F3D0', borderRadius: 10, fontSize: 13, fontWeight: 700,
                        cursor: reviewSubmitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                      {reviewSubmitting ? '...' : 'Approve'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #F3F4F6',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: '#111827', margin: 0 }}>
                  Pending Narratives
                </p>
                <span style={{ fontSize: 12, color: '#9CA3AF' }}>
                  {pendingNarratives.length} awaiting review
                </span>
              </div>

              {pendingNarratives.length === 0 ? (
                <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                  <div style={{ width: 52, height: 52, background: '#D1FAE5', borderRadius: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <svg style={{ width: 26, height: 26, color: '#059669' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>All caught up!</p>
                  <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>No narratives pending review.</p>
                </div>
              ) : (
                pendingNarratives.map((n, i) => {
                  const title = n.content.match(/\*\*Activity:\*\*\s*(.+)/i)?.[1] ?? 'Daily Activity'
                  const dateStr = new Date(n.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  const submitStr = n.submissionDate
                    ? new Date(n.submissionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + (n.submissionTime ? ` ${n.submissionTime}` : '')
                    : null
                  const verPhoto = n.photos?.find(p => p.isVerified)
                  return (
                    <div key={n.id} style={{
                      padding: '14px 20px',
                      borderBottom: i < pendingNarratives.length - 1 ? '1px solid #F9FAFB' : 'none',
                      boxSizing: 'border-box',
                    }}>
                      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                        {/* Verification photo thumbnail */}
                        {verPhoto && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={verPhoto.url} alt="Verification"
                            style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover',
                              border: '2px solid #A7F3D0', flexShrink: 0 }} />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <p style={{ fontWeight: 700, fontSize: 14, color: '#111827', margin: 0 }}>{title}</p>
                            {verPhoto && (
                              <span style={{ fontSize: 10, fontWeight: 700, background: '#D1FAE5', color: '#065F46', padding: '2px 6px', borderRadius: 999 }}>
                                Photo Verified
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#F97316', margin: '0 0 3px' }}>
                            {n.student.name}
                            <span style={{ color: '#9CA3AF', fontWeight: 400 }}> · {n.student.studentId}</span>
                          </p>
                          <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>
                            Activity: {dateStr}{submitStr ? ` · Submitted: ${submitStr}` : ''}
                          </p>
                        </div>
                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                          <button
                            onClick={() => router.push(`/narratives/${n.id}`)}
                            style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                              background: '#F3F4F6', color: '#374151', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                            View
                          </button>
                          <button
                            onClick={() => { setReviewingId(n.id); setReviewComment('') }}
                            style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                              background: '#F97316', color: 'white', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                            Review
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════
            ANNOUNCEMENTS TAB
        ════════════════════════════════════════════════ */}
        {activeTab === 'announcements' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Create announcement form */}
            <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 16, padding: '20px 24px' }}>
              <p style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 16 }}>
                Post New Announcement
              </p>

              {annoError && (
                <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA',
                  borderRadius: 10, fontSize: 13, color: '#DC2626', marginBottom: 12 }}>
                  {annoError}
                </div>
              )}
              {annoSuccess && (
                <div style={{ padding: '10px 14px', background: '#ECFDF5', border: '1px solid #A7F3D0',
                  borderRadius: 10, fontSize: 13, color: '#065F46', marginBottom: 12 }}>
                  {annoSuccess}
                </div>
              )}

              <form onSubmit={handlePostAnnouncement}
                style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Title *</label>
                  <input type="text" value={annoForm.title} required
                    onChange={e => setAnnoForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Reminder: Submit your narratives"
                    style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = '#6366F1' }}
                    onBlur={e => { e.target.style.borderColor = '#E5E7EB' }}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Content *</label>
                  <textarea value={annoForm.content} required rows={4}
                    onChange={e => setAnnoForm(p => ({ ...p, content: e.target.value }))}
                    placeholder="Write your announcement here..."
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                    onFocus={e => { e.target.style.borderColor = '#6366F1' }}
                    onBlur={e => { e.target.style.borderColor = '#E5E7EB' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Type</label>
                    <select value={annoForm.type}
                      onChange={e => setAnnoForm(p => ({ ...p, type: e.target.value }))}
                      style={selectStyle}>
                      <option value="reminder">Reminder</option>
                      <option value="deadline">Deadline</option>
                      <option value="instruction">Instruction</option>
                      <option value="schedule_change">Schedule Change</option>
                      <option value="meeting">Meeting</option>
                      <option value="document">Document</option>
                      <option value="emergency">Emergency</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Target</label>
                    <select value={annoForm.targetType}
                      onChange={e => setAnnoForm(p => ({ ...p, targetType: e.target.value }))}
                      style={selectStyle}>
                      <option value="all">All Students</option>
                      <option value="strand">By Strand</option>
                      <option value="section">By Section</option>
                    </select>
                  </div>
                </div>

                <button type="submit" disabled={annoSubmitting} style={{
                  padding: '12px 0', background: annoSubmitting ? '#9CA3AF' : '#1E293B',
                  color: 'white', border: 'none', borderRadius: 10,
                  fontSize: 14, fontWeight: 700, cursor: annoSubmitting ? 'not-allowed' : 'pointer',
                }}>
                  {annoSubmitting ? 'Posting...' : 'Post Announcement'}
                </button>
              </form>
            </div>

            {/* Existing announcements */}
            <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #F3F4F6' }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>
                  All Announcements ({announcements.length})
                </p>
              </div>

              {announcements.length === 0 ? (
                <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                  <p style={{ fontSize: 14, color: '#9CA3AF' }}>No announcements yet. Post one above.</p>
                </div>
              ) : (
                announcements.map((a, i) => (
                  <div key={a.id} style={{
                    padding: '14px 20px',
                    borderBottom: i < announcements.length - 1 ? '1px solid #F9FAFB' : 'none',
                    boxSizing: 'border-box',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <p style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{a.title}</p>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                            background: '#EEF2FF', color: '#4F46E5',
                          }}>{a.type.replace(/_/g, ' ').toUpperCase()}</span>
                          <span style={{
                            fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
                            background: '#F3F4F6', color: '#6B7280',
                          }}>{a.targetType === 'all' ? 'All Students' : a.targetType}</span>
                        </div>
                        <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {a.content}
                        </p>
                        <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
                          By {a.teacher.name} · {new Date(a.publishedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button onClick={() => handleDeleteAnnouncement(a.id)} style={{
                        flexShrink: 0, padding: '5px 10px', borderRadius: 8,
                        background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      }}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>

      {/* ── Delete Account Modal ─────────────────────────── */}
      {deleteAccountConfirm && (
        <ConfirmModal
          title="Delete Your Account?"
          danger
          confirmLabel={deletingAccount ? 'Deleting...' : 'Yes, Delete Account'}
          loading={deletingAccount}
          onConfirm={handleDeleteAccount}
          onCancel={() => setDeleteAccountConfirm(false)}
          body={
            <span>
              This is <strong>permanent and cannot be undone.</strong><br />
              Your students will remain but be unassigned from you.
            </span>
          }
        />
      )}

      {/* ── Delete Student Modal ─────────────────────────── */}
      {deleteStudentTarget && (
        <ConfirmModal
          title="Delete Student Account?"
          danger
          confirmLabel={deletingStudent ? 'Deleting...' : 'Yes, Delete Student'}
          loading={deletingStudent}
          onConfirm={handleDeleteStudent}
          onCancel={() => setDeleteStudentTarget(null)}
          body={
            <div>
              <p style={{ marginBottom: 12 }}>You are about to permanently delete:</p>
              <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '12px 16px' }}>
                <p style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>{deleteStudentTarget.name}</p>
                <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{deleteStudentTarget.email}</p>
                <p style={{ fontSize: 12, color: '#9CA3AF' }}>ID: {deleteStudentTarget.studentId}</p>
              </div>
              <p style={{ marginTop: 12, color: '#EF4444', fontWeight: 500, fontSize: 13 }}>
                All their narratives and data will be permanently deleted.
              </p>
            </div>
          }
        />
      )}

    </AppShell>
  )
}
