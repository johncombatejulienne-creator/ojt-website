'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import AppShell from '@/components/AppShell'

interface StudentDetail {
  id: string; studentId: string; name: string; email: string
  profilePicture?: string | null; company?: string; gradeLevel?: number
  section?: { name: string }; strand?: { name: string }; supervisor?: { name: string }
  narratives: {
    id: string; status: string; date: string
    submissionDate?: string; content: string; isDraft: boolean
  }[]
}

function statusBadge(status: string, isDraft: boolean) {
  if (isDraft) return { label: 'Draft', bg: '#F3F4F6', color: '#6B7280' }
  const map: Record<string, { label: string; bg: string; color: string }> = {
    approved:           { label: 'Approved',         bg: '#D1FAE5', color: '#065F46' },
    pending:            { label: 'Pending Review',   bg: '#FEF3C7', color: '#92400E' },
    revision_requested: { label: 'Revision Needed',  bg: '#FFEDD5', color: '#9A3412' },
  }
  return map[status] ?? { label: status, bg: '#F3F4F6', color: '#6B7280' }
}

export default function TeacherStudentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session, status } = useSession()
  const [student, setStudent] = useState<StudentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  const studentId = params.id as string

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (!session?.user || session.user.role !== 'teacher') return
    fetch(`/api/teacher/student-detail/${studentId}`)
      .then(r => r.json())
      .then(d => { if (d.student) setStudent(d.student); else setErr(d.error ?? 'Not found') })
      .catch(() => setErr('Failed to load student'))
      .finally(() => setLoading(false))
  }, [session, studentId])

  if (loading) return (
    <AppShell>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
        <div style={{ width: 40, height: 40, border: '4px solid #FFEDD5',
          borderTopColor: '#F97316', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </AppShell>
  )

  if (err || !student) return (
    <AppShell>
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ fontSize: 16, color: '#EF4444', marginBottom: 16 }}>{err || 'Student not found'}</p>
        <button onClick={() => router.push('/teacher/dashboard')} style={{
          padding: '10px 24px', background: '#F97316', color: 'white',
          border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>Back to Dashboard</button>
      </div>
    </AppShell>
  )

  return (
    <AppShell>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Back */}
      <button onClick={() => router.push('/teacher/dashboard')} style={{
        display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6B7280',
        background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20, padding: 0, fontFamily: 'inherit',
      }}>
        <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Teacher Dashboard
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Student info card */}
        <div style={{ background: 'linear-gradient(135deg,#F97316,#FBBF24)', borderRadius: 20,
          padding: '24px 28px', color: 'white', boxShadow: '0 4px 20px rgba(249,115,22,0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{ width: 72, height: 72, borderRadius: 14, overflow: 'hidden', flexShrink: 0,
              border: '3px solid rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 800, fontSize: 24 }}>
              {student.profilePicture
                ? <Image src={student.profilePicture} alt={student.name} width={72} height={72}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    unoptimized={student.profilePicture.startsWith('data:')} />
                : student.name.charAt(0).toUpperCase()
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: 'white', margin: '0 0 6px' }}>
                {student.name}
              </h1>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', margin: '0 0 12px' }}>
                {student.email}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {[
                  student.studentId && `ID: ${student.studentId}`,
                  student.strand?.name,
                  student.section?.name,
                  student.gradeLevel && `Grade ${student.gradeLevel}`,
                ].filter(Boolean).map(tag => (
                  <span key={tag} style={{ background: 'rgba(255,255,255,0.2)', color: 'white',
                    fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999 }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Info pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {[
            { label: 'Company', value: student.company },
            { label: 'Supervisor', value: student.supervisor?.name },
            { label: 'Strand', value: student.strand?.name },
            { label: 'Section', value: student.section?.name },
          ].map(p => (
            <div key={p.label} style={{ background: 'white', border: '1px solid #E5E7EB',
              borderRadius: 14, padding: '14px 18px', flex: 1, minWidth: 140, boxSizing: 'border-box' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase',
                letterSpacing: '0.07em', margin: '0 0 4px' }}>{p.label}</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: p.value ? '#111827' : '#D1D5DB',
                fontStyle: p.value ? 'normal' : 'italic', margin: 0 }}>
                {p.value || 'Not set'}
              </p>
            </div>
          ))}
        </div>

        {/* Narratives */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontWeight: 700, fontSize: 15, color: '#111827', margin: 0 }}>
              Narratives ({student.narratives.length})
            </p>
            <span style={{ fontSize: 12, color: '#9CA3AF' }}>
              {student.narratives.filter(n => n.status === 'pending').length} pending review
            </span>
          </div>

          {student.narratives.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: '#9CA3AF' }}>No narratives submitted yet.</p>
            </div>
          ) : (
            student.narratives.map((n, i) => {
              const badge = statusBadge(n.status, n.isDraft)
              const dateStr = new Date(n.date).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
              })
              return (
                <div key={n.id} style={{
                  padding: '14px 20px', borderBottom: i < student.narratives.length - 1 ? '1px solid #F9FAFB' : 'none',
                  boxSizing: 'border-box',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <p style={{ fontWeight: 600, fontSize: 14, color: '#111827', margin: 0 }}>
                          {n.content.match(/\*\*Activity:\*\*\s*(.+)/i)?.[1] ?? 'Daily Activity'}
                        </p>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
                          background: badge.bg, color: badge.color }}>
                          {badge.label}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>📅 {dateStr}</p>
                    </div>
                    {/* Approve/Request Revision buttons for pending narratives */}
                    {n.status === 'pending' && !n.isDraft && (
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button onClick={async () => {
                          await fetch(`/api/narratives/${n.id}/review`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'approved' }),
                          })
                          setStudent(prev => prev ? {
                            ...prev,
                            narratives: prev.narratives.map(x => x.id === n.id ? { ...x, status: 'approved' } : x)
                          } : null)
                        }} style={{
                          padding: '6px 12px', background: '#D1FAE5', color: '#065F46',
                          border: '1px solid #A7F3D0', borderRadius: 8, fontSize: 12,
                          fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                        }}>Approve</button>
                        <button onClick={async () => {
                          await fetch(`/api/narratives/${n.id}/review`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'revision_requested' }),
                          })
                          setStudent(prev => prev ? {
                            ...prev,
                            narratives: prev.narratives.map(x => x.id === n.id ? { ...x, status: 'revision_requested' } : x)
                          } : null)
                        }} style={{
                          padding: '6px 12px', background: '#FFEDD5', color: '#9A3412',
                          border: '1px solid #FED7AA', borderRadius: 8, fontSize: 12,
                          fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                        }}>Revise</button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

      </div>
    </AppShell>
  )
}
