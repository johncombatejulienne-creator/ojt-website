'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import AppShell from '@/components/AppShell'
import { Button } from '@/components/ui/Button'

interface Student {
  id: string; studentId: string; name: string; email: string
  profilePicture?: string | null
  section?: { name: string }
  strand?: { name: string }
  narratives: { id: string; status: string }[]
}
interface Section {
  id: string; name: string; gradeLevel: number
  strand: { name: string }; students: Student[]
}

/* ─── Avatar ─────────────────────────────────────────────── */
function Avatar({ src, name, size = 40 }: { src?: string|null; name: string; size?: number }) {
  const [err, setErr] = useState(false)
  const initials = name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)
  const base = { width:size, height:size, borderRadius:10, flexShrink:0,
    display:'flex', alignItems:'center', justifyContent:'center',
    fontWeight:700, fontSize:Math.round(size*0.36) }
  if (src && !err) return (
    <div style={{ ...base, overflow:'hidden' }}>
      <Image src={src} alt={name} width={size} height={size}
        style={{ width:'100%', height:'100%', objectFit:'cover' }}
        unoptimized={src.startsWith('data:')} onError={() => setErr(true)} />
    </div>
  )
  return (
    <div style={{ ...base, background:'linear-gradient(135deg,#475569,#1E293B)', color:'white' }}>
      {initials}
    </div>
  )
}

/* ─── Stat Card ──────────────────────────────────────────── */
function StatCard({ label, value, icon, bg }: { label:string; value:number; icon:React.ReactNode; bg:string }) {
  return (
    <div style={{ background:bg, borderRadius:16, padding:'16px 20px', color:'white',
      display:'flex', alignItems:'center', justifyContent:'space-between', gap:12,
      overflow:'hidden', boxSizing:'border-box', boxShadow:'0 4px 12px rgba(0,0,0,0.15)' }}>
      <div style={{ minWidth:0, flex:1 }}>
        <p style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em',
          color:'rgba(255,255,255,0.75)', marginBottom:4, overflow:'hidden',
          textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {label}
        </p>
        <p style={{ fontSize:36, fontWeight:900, lineHeight:1, color:'white' }}>{value}</p>
      </div>
      <div style={{ width:44, height:44, borderRadius:10, background:'rgba(255,255,255,0.15)',
        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        {icon}
      </div>
    </div>
  )
}

/* ─── Page ───────────────────────────────────────────────── */
export default function TeacherDashboard() {
  const { data: session, status, update: updateSession } = useSession()
  const router  = useRouter()
  const [loading,  setLoading]        = useState(true)
  const [sections, setSections]       = useState<Section[]>([])
  const [students, setStudents]       = useState<Student[]>([])
  const [active,   setActive]         = useState('all')
  const [search,   setSearch]         = useState('')
  const [deleteAccountConfirm, setDeleteAccountConfirm] = useState(false)
  const [deletingAccount,      setDeletingAccount]      = useState(false)
  const [deletingStudentId,    setDeletingStudentId]    = useState<string | null>(null)
  const [deleteStudentConfirm, setDeleteStudentConfirm] = useState<Student | null>(null)

  const fetchData = async () => {
    try {
      // Ensure this user has a Teacher record — creates one if missing
      const promoteRes = await fetch('/api/auth/promote-to-teacher', { method: 'POST' })
      if (promoteRes.ok) {
        const data = await promoteRes.json()
        // If we just promoted them, force a session refresh so the header updates
        if (data.promoted) {
          await updateSession()
        }
      }

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    else if (status === 'authenticated') void fetchData()
  }, [status]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Delete own account ────────────────────────────────── */
  const handleDeleteAccount = async () => {
    setDeletingAccount(true)
    try {
      const res = await fetch('/api/teacher/delete-account', { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete account')
      await signOut({ callbackUrl: '/login', redirect: true })
    } catch (e) {
      console.error(e)
      setDeletingAccount(false)
      setDeleteAccountConfirm(false)
      alert('Failed to delete account. Please try again.')
    }
  }

  /* ── Delete a student ──────────────────────────────────── */
  const handleDeleteStudent = async (student: Student) => {
    setDeletingStudentId(student.id)
    try {
      const res = await fetch(`/api/teacher/students/${student.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete student')
      setStudents(prev => prev.filter(s => s.id !== student.id))
      setSections(prev => prev.map(sec => ({
        ...sec,
        students: sec.students.filter(s => s.id !== student.id)
      })))
      setDeleteStudentConfirm(null)
    } catch (e) {
      console.error(e)
      alert('Failed to delete student. Please try again.')
    } finally {
      setDeletingStudentId(null)
    }
  }

  const filtered = students
    .filter(s => active === 'all' || s.section?.name === active)
    .filter(s => !search.trim() ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.studentId.toLowerCase().includes(search.toLowerCase()))

  const stats = {
    students: students.length,
    sections: sections.length,
    pending:  students.reduce((n, s) => n + s.narratives.filter(x => x.status === 'pending').length, 0),
  }

  if (loading || status === 'loading') return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F8FAFC' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:48, height:48, border:'4px solid #CBD5E1',
          borderTopColor:'#475569', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto 12px' }} />
        <p style={{ fontSize:14, color:'#6B7280' }}>Loading dashboard...</p>
      </div>
    </div>
  )

  const userName = session?.user?.name ?? session?.user?.email?.split('@')[0] ?? 'Teacher'

  return (
    <AppShell>
      <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

        {/* ── Welcome Banner ──────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg,#334155,#1E293B)',
          borderRadius: 20, padding: '20px 24px', color: 'white',
          position: 'relative', overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          boxSizing: 'border-box',
        }}>
          <p style={{ fontSize:11, fontWeight:700, textTransform:'uppercase',
            letterSpacing:'0.06em', color:'rgba(255,255,255,0.5)', marginBottom:4 }}>
            Teacher Dashboard
          </p>
          <h1 style={{ fontSize:22, fontWeight:900, overflow:'hidden',
            textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:4 }}>
            {userName}
          </h1>
          <p style={{ fontSize:13, color:'rgba(255,255,255,0.45)' }}>
            Manage your students and review their work.
          </p>
          {/* Delete account */}
          <button
            onClick={() => setDeleteAccountConfirm(true)}
            style={{
              marginTop: 16, display:'inline-flex', alignItems:'center', gap:6,
              fontSize:12, color:'rgba(255,100,100,0.85)', fontWeight:600,
              background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,100,100,0.25)',
              borderRadius:8, padding:'6px 14px', cursor:'pointer',
            }}
          >
            <svg style={{ width:14, height:14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
            Delete My Account
          </button>
        </div>

        {/* ── Stats ───────────────────────────────────────── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, minmax(0, 1fr))', gap:12,
          width:'100%', boxSizing:'border-box' }}>
          <StatCard label="Students" value={stats.students}
            bg="linear-gradient(135deg,#3B82F6,#1D4ED8)"
            icon={<svg style={{width:22,height:22,color:'white'}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>}
          />
          <StatCard label="Sections" value={stats.sections}
            bg="linear-gradient(135deg,#7C3AED,#5B21B6)"
            icon={<svg style={{width:22,height:22,color:'white'}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>}
          />
          <StatCard label="Pending" value={stats.pending}
            bg="linear-gradient(135deg,#EF4444,#B91C1C)"
            icon={<svg style={{width:22,height:22,color:'white'}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>}
          />
        </div>

        {/* ── Filters ─────────────────────────────────────── */}
        <div style={{ background:'white', border:'1px solid #E5E7EB', borderRadius:16,
          padding:'16px 20px', boxSizing:'border-box' }}>
          {/* Section tabs */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:14 }}>
            {[{ key:'all', label:`All (${students.length})` },
              ...sections.map(s => ({ key:s.name, label:`${s.name} (${s.students.length})` }))
            ].map(tab => (
              <button key={tab.key} onClick={() => setActive(tab.key)} style={{
                padding:'6px 16px', borderRadius:999, fontSize:12, fontWeight:600,
                cursor:'pointer', border:'none', transition:'all 0.15s',
                background: active===tab.key ? '#1E293B' : '#F3F4F6',
                color: active===tab.key ? 'white' : '#4B5563',
              }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ position:'relative' }}>
            <svg style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)',
              width:16, height:16, color:'#9CA3AF', pointerEvents:'none' }}
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, or ID..."
              style={{ width:'100%', paddingLeft:36, paddingRight:16, paddingTop:10, paddingBottom:10,
                border:'1px solid #E5E7EB', borderRadius:12, fontSize:14,
                background:'#F9FAFB', outline:'none', boxSizing:'border-box' }}
              onFocus={e => { e.target.style.borderColor='#6366F1'; e.target.style.background='white' }}
              onBlur={e => { e.target.style.borderColor='#E5E7EB'; e.target.style.background='#F9FAFB' }}
            />
          </div>
        </div>

        {/* ── Students List ────────────────────────────────── */}
        <div style={{ background:'white', border:'1px solid #E5E7EB', borderRadius:16, overflow:'hidden' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid #F3F4F6',
            display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
            <p style={{ fontWeight:700, fontSize:15, color:'#111827' }}>
              Students{active !== 'all' && ` — ${active}`}
            </p>
            <span style={{ fontSize:12, color:'#9CA3AF' }}>
              {filtered.length} student{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {filtered.length === 0 ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
              justifyContent:'center', padding:'48px 24px', gap:12, textAlign:'center' }}>
              <div style={{ width:48, height:48, background:'#F3F4F6', borderRadius:12,
                display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg style={{ width:24, height:24, color:'#9CA3AF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                </svg>
              </div>
              <p style={{ fontSize:14, fontWeight:600, color:'#374151' }}>
                {search ? 'No students match your search' : 'No students in this section yet'}
              </p>
              {search && (
                <button onClick={() => setSearch('')}
                  style={{ fontSize:12, color:'#6366F1', fontWeight:600, background:'none',
                    border:'none', cursor:'pointer' }}>
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div>
              {filtered.map((s, i) => {
                const pending = s.narratives.filter(n => n.status === 'pending').length
                return (
                  <div key={s.id} style={{
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    gap:12, padding:'14px 20px', flexWrap:'wrap',
                    borderBottom: i < filtered.length-1 ? '1px solid #F9FAFB' : 'none',
                    transition:'background 0.1s',
                    boxSizing:'border-box',
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background='#F9FAFB' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background='transparent' }}
                  >
                    <div style={{ display:'flex', alignItems:'center', gap:12, flex:1, minWidth:0 }}>
                      <Avatar src={s.profilePicture} name={s.name} size={44} />
                      <div style={{ minWidth:0, flex:1 }}>
                        <p style={{ fontWeight:600, fontSize:14, color:'#111827',
                          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {s.name}
                        </p>
                        <p style={{ fontSize:12, color:'#6B7280',
                          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {s.email}
                        </p>
                        <p style={{ fontSize:11, color:'#9CA3AF', marginTop:2 }}>
                          {s.studentId}{s.strand?.name ? ` · ${s.strand.name}` : ''}{s.section?.name ? ` · ${s.section.name}` : ''}
                        </p>
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                      {pending > 0 && (
                        <span style={{ background:'#FEF3C7', color:'#92400E', fontSize:11, fontWeight:700,
                          padding:'4px 10px', borderRadius:999, whiteSpace:'nowrap' }}>
                          {pending} pending
                        </span>
                      )}
                      <Button size="sm" variant="outline"
                        onClick={() => router.push(`/teacher/students/${s.id}`)}>
                        View
                      </Button>
                      <button
                        onClick={() => setDeleteStudentConfirm(s)}
                        style={{
                          padding:'5px 10px', borderRadius:8, fontSize:12, fontWeight:600,
                          background:'#FEF2F2', color:'#DC2626', border:'1px solid #FECACA',
                          cursor:'pointer', whiteSpace:'nowrap',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>

      {/* ── Delete Account Confirmation Modal ───────────── */}
      {deleteAccountConfirm && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.5)',
          display:'flex', alignItems:'center', justifyContent:'center',
          zIndex:100, padding:16,
        }}>
          <div style={{
            background:'white', borderRadius:20, padding:32, maxWidth:400,
            width:'100%', boxShadow:'0 25px 50px rgba(0,0,0,0.25)',
          }}>
            <div style={{ width:56, height:56, background:'#FEE2E2', borderRadius:14,
              display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20 }}>
              <svg style={{ width:28, height:28, color:'#DC2626' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              </svg>
            </div>
            <h2 style={{ fontSize:20, fontWeight:800, color:'#111827', marginBottom:8 }}>
              Delete Your Account?
            </h2>
            <p style={{ fontSize:14, color:'#6B7280', lineHeight:1.6, marginBottom:24 }}>
              This action is <strong>permanent and cannot be undone.</strong> Your account will be deleted.
              Your students will remain but be unassigned.
            </p>
            <div style={{ display:'flex', gap:12 }}>
              <button
                onClick={() => setDeleteAccountConfirm(false)}
                disabled={deletingAccount}
                style={{ flex:1, padding:'10px 0', borderRadius:10, fontSize:14, fontWeight:600,
                  background:'#F3F4F6', color:'#374151', border:'none', cursor:'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                style={{ flex:1, padding:'10px 0', borderRadius:10, fontSize:14, fontWeight:600,
                  background:'#DC2626', color:'white', border:'none', cursor:'pointer',
                  opacity: deletingAccount ? 0.7 : 1 }}
              >
                {deletingAccount ? 'Deleting...' : 'Yes, Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Student Confirmation Modal ───────────── */}
      {deleteStudentConfirm && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.5)',
          display:'flex', alignItems:'center', justifyContent:'center',
          zIndex:100, padding:16,
        }}>
          <div style={{
            background:'white', borderRadius:20, padding:32, maxWidth:400,
            width:'100%', boxShadow:'0 25px 50px rgba(0,0,0,0.25)',
          }}>
            <div style={{ width:56, height:56, background:'#FEE2E2', borderRadius:14,
              display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20 }}>
              <svg style={{ width:28, height:28, color:'#DC2626' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </div>
            <h2 style={{ fontSize:20, fontWeight:800, color:'#111827', marginBottom:8 }}>
              Delete Student Account?
            </h2>
            <p style={{ fontSize:14, color:'#6B7280', lineHeight:1.6, marginBottom:8 }}>
              You are about to permanently delete:
            </p>
            <div style={{ background:'#F9FAFB', borderRadius:10, padding:'12px 16px', marginBottom:20 }}>
              <p style={{ fontWeight:700, fontSize:15, color:'#111827' }}>{deleteStudentConfirm.name}</p>
              <p style={{ fontSize:12, color:'#9CA3AF', marginTop:2 }}>{deleteStudentConfirm.email}</p>
              <p style={{ fontSize:12, color:'#9CA3AF' }}>ID: {deleteStudentConfirm.studentId}</p>
            </div>
            <p style={{ fontSize:13, color:'#EF4444', marginBottom:20, fontWeight:500 }}>
              This will permanently delete all their narratives and data. This cannot be undone.
            </p>
            <div style={{ display:'flex', gap:12 }}>
              <button
                onClick={() => setDeleteStudentConfirm(null)}
                disabled={deletingStudentId !== null}
                style={{ flex:1, padding:'10px 0', borderRadius:10, fontSize:14, fontWeight:600,
                  background:'#F3F4F6', color:'#374151', border:'none', cursor:'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteStudent(deleteStudentConfirm)}
                disabled={deletingStudentId !== null}
                style={{ flex:1, padding:'10px 0', borderRadius:10, fontSize:14, fontWeight:600,
                  background:'#DC2626', color:'white', border:'none', cursor:'pointer',
                  opacity: deletingStudentId !== null ? 0.7 : 1 }}
              >
                {deletingStudentId === deleteStudentConfirm.id ? 'Deleting...' : 'Yes, Delete Student'}
              </button>
            </div>
          </div>
        </div>
      )}

    </AppShell>
  )
}
