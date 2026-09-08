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
  id: string; name: string; studentId: string; email: string
  profilePicture?: string | null; company?: string; gradeLevel?: number
  strand?: { id: string; name: string; code?: string }
  section?: { name: string }
  supervisor?: { name: string }
}
interface ChecklistStats { totalItems: number; completedItems: number; progressPercentage: number }
interface NarrativeStats  { total: number; thisWeek: number; pending: number }

/* ─── Strand themes ───────────────────────────────────────── */
const THEMES: Record<string, { bg: string; tagline: string }> = {
  STEM:  { bg: 'linear-gradient(135deg,#0EA5E9,#4F46E5)', tagline: 'Science, Technology, Engineering & Math' },
  ABM:   { bg: 'linear-gradient(135deg,#059669,#0D9488)', tagline: 'Accountancy, Business & Management' },
  HUMSS: { bg: 'linear-gradient(135deg,#7C3AED,#A855F7)', tagline: 'Humanities & Social Sciences' },
  TVL:   { bg: 'linear-gradient(135deg,#EA580C,#D97706)', tagline: 'Technical-Vocational-Livelihood' },
  DEFAULT:{ bg: 'linear-gradient(135deg,#4F46E5,#7C3AED)', tagline: 'Senior High School Work Immersion' },
}

/* ─── Avatar ─────────────────────────────────────────────── */
function Avatar({ src, name, size = 56 }: { src?: string|null; name?: string|null; size?: number }) {
  const [err, setErr] = useState(false)
  const initials = name ? name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) : '?'
  const base = {
    width: size, height: size, borderRadius: '14px',
    flexShrink: 0, border: '3px solid rgba(255,255,255,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 800, color: 'white', fontSize: Math.round(size * 0.34),
  }
  if (src && !err) return (
    <div style={{ ...base, overflow: 'hidden', background: 'transparent' }}>
      <Image src={src} alt={name??'Profile'} width={size} height={size}
        style={{ width:'100%', height:'100%', objectFit:'cover' }}
        unoptimized={src.startsWith('data:')} onError={() => setErr(true)} />
    </div>
  )
  return (
    <div style={{ ...base, background: 'rgba(255,255,255,0.25)' }}>{initials}</div>
  )
}

/* ─── Stat Card ──────────────────────────────────────────── */
function StatCard({ label, value, sub, bg }: {
  label: string; value: string|number; sub?: string; bg: string
}) {
  return (
    <div style={{
      background: bg,
      borderRadius: 16,
      padding: '16px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      overflow: 'hidden',
      minWidth: 0,
      boxSizing: 'border-box',
    }}>
      <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.07em',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
        {label}
      </p>
      <p style={{ color: 'white', fontSize: 32, fontWeight: 900, lineHeight: 1 }}>{value}</p>
      {sub && (
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, marginTop: 2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {sub}
        </p>
      )}
    </div>
  )
}

/* ─── Quick Action ───────────────────────────────────────── */
function QuickAction({ label, desc, icon, onClick, primary }: {
  label:string; desc:string; icon:React.ReactNode; onClick:()=>void; primary?:boolean
}) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', gap: 12, padding: 18,
      borderRadius: 16, border: `2px solid ${primary ? '#C7D2FE' : '#E5E7EB'}`,
      background: primary ? '#EEF2FF' : 'white',
      cursor: 'pointer', textAlign: 'left', width: '100%',
      transition: 'all 0.15s ease', boxSizing: 'border-box',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: primary ? '#4F46E5' : '#F3F4F6', color: primary ? 'white' : '#6B7280',
      }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontWeight: 600, fontSize: 13, color: primary ? '#3730A3' : '#111827',
          lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {label}
        </p>
        <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3, lineHeight: 1.4 }}>{desc}</p>
      </div>
    </button>
  )
}

/* ─── Info Pill ──────────────────────────────────────────── */
function InfoPill({ label, value }: { label: string; value?: string }) {
  return (
    <div style={{
      background: 'white', border: '1px solid #E5E7EB',
      borderRadius: 16, padding: '16px 20px', boxSizing: 'border-box',
    }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF',
        textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
        {label}
      </p>
      <p style={{ fontWeight: 600, fontSize: 14, color: value ? '#111827' : '#9CA3AF',
        fontStyle: value ? 'normal' : 'italic',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {value || 'Not set'}
      </p>
    </div>
  )
}

/* ─── Page ───────────────────────────────────────────────── */
export default function StudentDashboard() {
  const { data: session, status } = useSession()
  const router  = useRouter()
  const [student,   setStudent]  = useState<StudentData | null>(null)
  const [cl, setCl] = useState<ChecklistStats>({ totalItems:0, completedItems:0, progressPercentage:0 })
  const [ns, setNs] = useState<NarrativeStats>({ total:0, thisWeek:0, pending:0 })
  const [loading,   setLoading]  = useState(true)
  const [needsReg,  setNeedsReg] = useState(false)

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
      finally { setLoading(false) }
    }
    load()
  }, [session])

  if (loading || status === 'loading') return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F8FAFC' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:48, height:48, border:'4px solid #C7D2FE',
          borderTopColor:'#4F46E5', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto 12px' }} />
        <p style={{ fontSize:14, color:'#6B7280' }}>Loading your dashboard...</p>
      </div>
    </div>
  )

  if (needsReg) return (
    <AppShell>
      <div style={{ minHeight:'70vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ maxWidth:360, width:'100%', background:'white', borderRadius:24,
          boxShadow:'0 20px 40px rgba(0,0,0,0.1)', padding:40, textAlign:'center' }}>
          <div style={{ width:64, height:64, background:'#EEF2FF', borderRadius:16,
            display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
            <svg style={{ width:32, height:32, color:'#6366F1' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
          </div>
          <h2 style={{ fontSize:20, fontWeight:800, color:'#111827', marginBottom:8 }}>Complete Your Profile</h2>
          <p style={{ fontSize:14, color:'#6B7280', marginBottom:24, lineHeight:1.6 }}>
            Fill in your student details to unlock the full dashboard.
          </p>
          <Button onClick={() => router.push('/profile/complete')} fullWidth size="lg">
            Complete Profile
          </Button>
        </div>
      </div>
    </AppShell>
  )

  const strandKey  = student?.strand?.name?.toUpperCase().split(' ').find(w => ['STEM','ABM','HUMSS','TVL'].includes(w)) ?? 'DEFAULT'
  const theme      = THEMES[strandKey] ?? THEMES.DEFAULT
  const pct        = cl.progressPercentage
  const barColor   = pct === 100 ? '#10B981' : pct >= 60 ? '#F59E0B' : '#4F46E5'
  const statusLabel= pct === 100 ? 'Complete ✓' : pct >= 60 ? 'In Progress' : 'Getting Started'
  const statusBg   = pct === 100 ? '#D1FAE5' : pct >= 60 ? '#FEF3C7' : '#EEF2FF'
  const statusClr  = pct === 100 ? '#065F46' : pct >= 60 ? '#92400E' : '#3730A3'
  const userName   = student?.name ?? session?.user?.name ?? 'Student'

  return (
    <AppShell strandCode={strandKey !== 'DEFAULT' ? strandKey : undefined}>
      {/* All spacing is inline to guarantee rendering on all platforms */}
      <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

        {/* ── Welcome Banner ──────────────────────────────── */}
        <div style={{
          background: theme.bg,
          borderRadius: 20,
          padding: '20px 24px',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }}>
          <div style={{ display:'flex', alignItems:'flex-start', gap:16, position:'relative', zIndex:1,
            flexWrap:'wrap' }}>
            <Avatar src={student?.profilePicture ?? session?.user?.profilePicture} name={userName} size={54} />
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:11, color:'rgba(255,255,255,0.7)', fontWeight:600,
                textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:2 }}>
                Welcome back
              </p>
              <h1 style={{ fontSize:22, fontWeight:900, lineHeight:1.2, marginBottom:10,
                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'100%' }}>
                {userName.split(' ').slice(0,3).join(' ')}
              </h1>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {student?.studentId && (
                  <span style={{ background:'rgba(255,255,255,0.2)', fontSize:11, fontWeight:600,
                    padding:'3px 10px', borderRadius:999, whiteSpace:'nowrap' }}>
                    ID: {student.studentId}
                  </span>
                )}
                {strandKey !== 'DEFAULT' && (
                  <span style={{ background:'rgba(255,255,255,0.2)', fontSize:11, fontWeight:600,
                    padding:'3px 10px', borderRadius:999 }}>
                    {strandKey}
                  </span>
                )}
                {student?.section?.name && (
                  <span style={{ background:'rgba(255,255,255,0.2)', fontSize:11, fontWeight:600,
                    padding:'3px 10px', borderRadius:999 }}>
                    {student.section.name}
                  </span>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push('/profile/edit')}
              className="border-white/30 text-white hover:bg-white/10">
              Edit Profile
            </Button>
          </div>
          {strandKey !== 'DEFAULT' && (
            <p style={{ position:'relative', zIndex:1, marginTop:12,
              fontSize:11, color:'rgba(255,255,255,0.55)' }}>
              {theme.tagline}
            </p>
          )}
        </div>

        {/* ── Stats ───────────────────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 12,
          width: '100%',
          boxSizing: 'border-box',
        }}>
          <StatCard label="Narratives"  value={ns.total}    sub="submitted"    bg="linear-gradient(135deg,#4F46E5,#6366F1)" />
          <StatCard label="This Week"   value={ns.thisWeek} sub="narratives"   bg="linear-gradient(135deg,#7C3AED,#9333EA)" />
          <StatCard label="Pending"     value={ns.pending}  sub="under review" bg="linear-gradient(135deg,#F59E0B,#EF4444)" />
          <StatCard label="Progress"    value={`${pct}%`}   sub={`${cl.completedItems}/${cl.totalItems} items`} bg="linear-gradient(135deg,#10B981,#0D9488)" />
        </div>

        {/* ── Progress Bar ────────────────────────────────── */}
        <div style={{ background:'white', borderRadius:16, border:'1px solid #E5E7EB', padding:'18px 20px', boxSizing:'border-box' }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, flexWrap:'wrap', marginBottom:12 }}>
            <div>
              <p style={{ fontWeight:700, fontSize:15, color:'#111827' }}>Overall Requirements Progress</p>
              <p style={{ fontSize:13, color:'#9CA3AF', marginTop:2 }}>
                {cl.completedItems} of {cl.totalItems} items completed
              </p>
            </div>
            <span style={{ background:statusBg, color:statusClr, fontSize:12, fontWeight:700,
              padding:'4px 12px', borderRadius:999, whiteSpace:'nowrap' }}>
              {statusLabel}
            </span>
          </div>
          <div style={{ width:'100%', height:8, background:'#E5E7EB', borderRadius:999, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${pct}%`, background:barColor,
              borderRadius:999, transition:'width 0.6s ease' }} />
          </div>
        </div>

        {/* ── Quick Actions ────────────────────────────────── */}
        <div>
          <p style={{ fontWeight:700, fontSize:15, color:'#111827', marginBottom:12 }}>Quick Actions</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2, minmax(0, 1fr))', gap:12 }}>
            <QuickAction primary label="New Narrative" desc="Document today's activities"
              onClick={() => router.push('/narratives/create')}
              icon={<svg style={{width:20,height:20}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>}
            />
            <QuickAction label="My Narratives" desc="View all submissions"
              onClick={() => router.push('/narratives')}
              icon={<svg style={{width:20,height:20}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>}
            />
            <QuickAction label="Requirements" desc="Track your checklist"
              onClick={() => router.push('/checklist')}
              icon={<svg style={{width:20,height:20}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>}
            />
            <QuickAction label="Announcements" desc="Latest from teachers"
              onClick={() => router.push('/announcements')}
              icon={<svg style={{width:20,height:20}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>}
            />
          </div>
        </div>

        {/* ── Info Row ─────────────────────────────────────── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:12 }}>
          <InfoPill label="Company" value={student?.company} />
          <InfoPill label="Supervisor" value={student?.supervisor?.name} />
          <InfoPill label="Grade & Section"
            value={student?.gradeLevel && student?.section?.name
              ? `Grade ${student.gradeLevel} — ${student.section.name}`
              : undefined} />
        </div>

        {/* ── Share ────────────────────────────────────────── */}
        <ShareCard
          title="Share the Work Immersion Portal"
          description="Invite classmates or share the platform."
          shareOptions={{ title: 'Work Immersion Portal', text: 'Track your work immersion journey.' }}
        />

        {/* ── Recent Activity ──────────────────────────────── */}
        <div style={{ background:'white', borderRadius:16, border:'1px solid #E5E7EB', padding:'20px 24px', boxSizing:'border-box' }}>
          <p style={{ fontWeight:700, fontSize:15, color:'#111827', marginBottom:16 }}>Recent Activity</p>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
            padding:'32px 0', gap:12, textAlign:'center' }}>
            <div style={{ width:48, height:48, background:'#F3F4F6', borderRadius:12,
              display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg style={{ width:24, height:24, color:'#9CA3AF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <p style={{ fontSize:13, color:'#9CA3AF' }}>Your recent submissions will appear here</p>
          </div>
        </div>

      </div>
    </AppShell>
  )
}
