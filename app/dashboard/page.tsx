'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import AppShell from '@/components/AppShell'

/* ─── Types ──────────────────────────────────────────────── */
interface StudentData {
  id: string; name: string; studentId: string; email: string
  profilePicture?: string | null; company?: string; gradeLevel?: number
  strand?: { id: string; name: string }
  section?: { name: string }
  supervisor?: { name: string }
}
interface ChecklistStats { totalItems: number; completedItems: number; progressPercentage: number }
interface NarrativeStats  { total: number; thisWeek: number; pending: number }

/* ─── Strand themes ──────────────────────────────────────── */
const STRAND_THEME: Record<string, { grad: string; light: string; text: string }> = {
  STEM:    { grad: 'linear-gradient(135deg,#F97316,#FBBF24)', light: '#EFF6FF', text: '#1E40AF' },
  ABM:     { grad: 'linear-gradient(135deg,#D97706,#F59E0B)', light: '#ECFDF5', text: '#065F46' },
  HUMSS:   { grad: 'linear-gradient(135deg,#B45309,#D97706)', light: '#F5F3FF', text: '#5B21B6' },
  TVL:     { grad: 'linear-gradient(135deg,#EA580C,#F97316)', light: '#FFF7ED', text: '#9A3412' },
  DEFAULT: { grad: 'linear-gradient(135deg,#F97316,#FBBF24)', light: '#FFF7ED', text: '#92400E' },
}

/* ─── Helpers ────────────────────────────────────────────── */
function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

/* ─── Avatar ─────────────────────────────────────────────── */
function Avatar({ src, name, size = 56 }: { src?: string | null; name?: string | null; size?: number }) {
  const [err, setErr] = useState(false)
  const initials = name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?'
  if (src && !err) return (
    <div style={{ width: size, height: size, borderRadius: 14, overflow: 'hidden',
      flexShrink: 0, border: '3px solid rgba(255,255,255,0.5)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
      <Image src={src} alt={name ?? 'Profile'} width={size} height={size}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        unoptimized={src.startsWith('data:')} onError={() => setErr(true)} />
    </div>
  )
  return (
    <div style={{ width: size, height: size, borderRadius: 14, flexShrink: 0,
      background: 'rgba(255,255,255,0.2)', border: '3px solid rgba(255,255,255,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontWeight: 800, fontSize: Math.round(size * 0.34) }}>
      {initials}
    </div>
  )
}

/* ─── Stat Card ──────────────────────────────────────────── */
function StatCard({ label, value, sub, icon, bg }: {
  label: string; value: string | number; sub?: string; icon: React.ReactNode; bg: string
}) {
  return (
    <div style={{ background: bg, borderRadius: 18, padding: '20px 22px', color: 'white',
      display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden',
      boxSizing: 'border-box', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
      <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.18)', borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
          color: 'rgba(255,255,255,0.7)', margin: '0 0 4px', overflow: 'hidden',
          textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</p>
        <p style={{ fontSize: 30, fontWeight: 900, color: 'white', lineHeight: 1, margin: 0 }}>{value}</p>
        {sub && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: '4px 0 0' }}>{sub}</p>}
      </div>
    </div>
  )
}

/* ─── Quick Action ───────────────────────────────────────── */
function QuickAction({ label, desc, icon, onClick, accent }: {
  label: string; desc: string; icon: React.ReactNode; onClick: () => void; accent?: string
}) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', flexDirection: 'column', gap: 12, padding: '20px',
        borderRadius: 18, border: `2px solid ${hov ? (accent ?? '#F97316') + '40' : '#E5E7EB'}`,
        background: hov ? (accent ?? '#F97316') + '08' : 'white',
        cursor: 'pointer', textAlign: 'left', width: '100%',
        transition: 'all 0.18s ease', fontFamily: 'inherit',
        transform: hov ? 'translateY(-2px)' : 'none',
        boxShadow: hov ? '0 8px 24px rgba(0,0,0,0.08)' : '0 1px 4px rgba(0,0,0,0.04)',
        boxSizing: 'border-box',
      }}>
      <div style={{ width: 44, height: 44, borderRadius: 12,
        background: hov ? (accent ?? '#F97316') : '#F3F4F6',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: hov ? 'white' : '#6B7280', transition: 'all 0.18s ease', flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontWeight: 700, fontSize: 14, color: '#111827', margin: '0 0 3px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</p>
        <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0, lineHeight: 1.4 }}>{desc}</p>
      </div>
    </button>
  )
}

/* ─── Info Pill ──────────────────────────────────────────── */
function InfoPill({ label, value }: { label: string; value?: string }) {
  return (
    <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 14,
      padding: '16px 20px', boxSizing: 'border-box', flex: 1, minWidth: 140 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase',
        letterSpacing: '0.07em', margin: '0 0 6px' }}>{label}</p>
      <p style={{ fontSize: 14, fontWeight: 600, color: value ? '#111827' : '#D1D5DB',
        fontStyle: value ? 'normal' : 'italic', margin: 0,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {value || 'Not set'}
      </p>
    </div>
  )
}

/* ─── Icons ──────────────────────────────────────────────── */
const iconProps = { width: 22, height: 22, fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' } as const

const icons = {
  narratives: <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
  week:       <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>,
  pending:    <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  progress:   <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,
  newNarr:    <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>,
  myNarr:     <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
  checklist:  <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>,
  announce:   <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>,
  profile:    <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>,
  clock:      <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
}

/* ─── Page ───────────────────────────────────────────────── */
export default function StudentDashboard() {
  const { data: session, status } = useSession()
  const router  = useRouter()

  const [student,   setStudent]   = useState<StudentData | null>(null)
  const [cl, setCl] = useState<ChecklistStats>({ totalItems: 0, completedItems: 0, progressPercentage: 0 })
  const [ns, setNs] = useState<NarrativeStats>({ total: 0, thisWeek: 0, pending: 0 })
  const [loading,   setLoading]   = useState(true)
  const [recentNarratives, setRecentNarratives] = useState<{
    id: string; date: string; content: string; status: string; isDraft: boolean; submissionDate?: string
  }[]>([])

  // Notifications
  const [notifications,    setNotifications]    = useState<{id:string;title:string;message:string;isRead:boolean;link?:string;type:string}[]>([])
  const [showNotifDropdown, setShowNotifDropdown] = useState(false)
  const unreadCount = notifications.filter(n => !n.isRead).length

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    await fetch('/api/notifications', { method: 'PATCH' }).catch(() => {})
  }

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (!session?.user) return
    const load = async () => {
      try {
        const [pRes, cRes, nRes, notifRes, recentRes] = await Promise.all([
          fetch('/api/students/profile'),
          fetch('/api/checklists/my-checklist'),
          fetch('/api/narratives?stats=true'),
          fetch('/api/notifications'),
          fetch('/api/narratives?limit=5&page=1'),
        ])
        if (pRes.ok) {
          const { student: s } = await pRes.json()
          setStudent(s)
        }
        if (cRes.ok) {
          const { checklists } = await cRes.json()
          if (checklists?.length > 0) setCl(checklists[0].stats)
        }
        if (nRes.ok) {
          const { stats } = await nRes.json()
          if (stats) setNs(stats)
        }
        if (notifRes.ok) {
          const { notifications: notifs } = await notifRes.json()
          if (notifs) setNotifications(notifs)
        }
        if (recentRes.ok) {
          const { narratives } = await recentRes.json()
          if (narratives) setRecentNarratives(narratives.slice(0, 5))
        }
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [session])

  /* Loading */
  if (loading || status === 'loading') return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', gap: 16 }}>
      <div style={{ width: 52, height: 52, borderRadius: 14,
        background: 'linear-gradient(135deg,#F97316,#8B5CF6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'white', fontWeight: 900, fontSize: 18 }}>WI</span>
      </div>
      <div style={{ width: 36, height: 36, border: '4px solid #E0E7FF',
        borderTopColor: '#F97316', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <p style={{ fontSize: 14, color: '#9CA3AF', margin: 0 }}>Loading your dashboard...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  /* Needs registration — removed gate, show dashboard directly */

  const strandKey = student?.strand?.name?.toUpperCase().split(' ')
    .find(w => ['STEM', 'ABM', 'HUMSS', 'TVL'].includes(w)) ?? 'DEFAULT'
  const theme = STRAND_THEME[strandKey] ?? STRAND_THEME.DEFAULT
  const pct   = cl.progressPercentage
  const userName = student?.name ?? session?.user?.name ?? 'Student'
  const firstName = userName.split(' ')[0]

  const barColor = pct === 100 ? '#10B981' : pct >= 60 ? '#F59E0B' : '#F97316'
  const statusLabel = pct === 100 ? 'Complete ✓' : pct >= 60 ? 'In Progress' : 'Getting Started'
  const statusBg    = pct === 100 ? '#D1FAE5' : pct >= 60 ? '#FEF3C7' : '#FFF7ED'
  const statusColor = pct === 100 ? '#065F46' : pct >= 60 ? '#92400E' : '#92400E'

  return (
    <AppShell strandCode={strandKey !== 'DEFAULT' ? strandKey : undefined}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── Welcome Banner ──────────────────────────────── */}
        <div style={{
          background: theme.grad, borderRadius: 24, padding: '28px 32px',
          color: 'white', position: 'relative', overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
        }}>
          {/* Dot pattern */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.08, pointerEvents: 'none',
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '24px 24px' }} />

          <div style={{ position: 'relative' }}>
            {/* Top row: avatar + name + action buttons */}
            <div style={{ display: 'flex', alignItems: 'flex-start',
              justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
              {/* Avatar + name */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flex: 1, minWidth: 0 }}>
                <Avatar src={student?.profilePicture ?? session?.user?.profilePicture} name={userName} size={56} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 500, margin: '0 0 2px' }}>
                    {getGreeting()},
                  </p>
                  <h1 style={{ fontSize: 22, fontWeight: 900, color: 'white', lineHeight: 1.15,
                    margin: '0 0 4px', wordBreak: 'break-word' }}>
                    {firstName}!
                  </h1>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                    {`Here's your Work Immersion progress.`}
                  </p>
                </div>
              </div>
              {/* Action buttons stacked */}              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                <button onClick={() => router.push('/profile/edit')} style={{
                  padding: '7px 14px', background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.3)', borderRadius: 10,
                  color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'inherit', whiteSpace: 'nowrap',
                }}>Edit Profile</button>
                {/* Notification bell */}
                <div style={{ position: 'relative' }}>
                  <button onClick={() => { setShowNotifDropdown(v => !v); if (unreadCount > 0) markAllRead() }}
                    style={{ width: '100%', position: 'relative', background: 'rgba(255,255,255,0.15)',
                      border: '1px solid rgba(255,255,255,0.3)', borderRadius: 10,
                      padding: '7px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg style={{ width: 17, height: 17, color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                      <span style={{ position: 'absolute', top: -4, right: -4,
                        width: 16, height: 16, background: '#EF4444', borderRadius: '50%',
                        fontSize: 9, fontWeight: 800, color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  {/* Dropdown */}
                  {showNotifDropdown && (
                    <>
                      <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setShowNotifDropdown(false)} />
                      <div style={{ position: 'absolute', right: 0, top: '110%', width: 300,
                        background: 'white', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                        border: '1px solid #E5E7EB', zIndex: 20, overflow: 'hidden' }}>
                        <div style={{ padding: '14px 16px', borderBottom: '1px solid #F3F4F6',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ fontWeight: 700, fontSize: 14, color: '#111827', margin: 0 }}>Notifications</p>
                      {notifications.length > 0 && (
                        <button onClick={markAllRead} style={{ fontSize: 11, color: '#F97316', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                          Mark all read
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                        <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>No notifications yet</p>
                      </div>
                    ) : (
                      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                        {notifications.map(n => (
                          <div key={n.id}
                            onClick={() => { setShowNotifDropdown(false); if (n.link) router.push(n.link) }}
                            style={{ padding: '12px 16px', borderBottom: '1px solid #F9FAFB',
                              background: n.isRead ? 'white' : '#FFF7ED',
                              cursor: n.link ? 'pointer' : 'default' }}>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                              <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                                background: n.type === 'narrative_approved' ? '#D1FAE5' : '#FFEDD5',
                                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {n.type === 'narrative_approved'
                                  ? <svg style={{ width: 16, height: 16, color: '#059669' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                                  : <svg style={{ width: 16, height: 16, color: '#D97706' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                }
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontWeight: 700, fontSize: 13, color: '#111827', margin: '0 0 2px',
                                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {n.title}
                                </p>
                                <p style={{ fontSize: 12, color: '#6B7280', margin: 0, lineHeight: 1.4 }}>
                                  {n.message}
                                </p>
                              </div>
                              {!n.isRead && (
                                <div style={{ width: 8, height: 8, background: '#F97316', borderRadius: '50%', flexShrink: 0, marginTop: 4 }} />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            {/* end bell position:relative */}
          </div>
          {/* end action buttons column */}
        </div>
        {/* end top row */}

          {/* Student badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {student?.studentId && (
              <span style={{ background: 'rgba(255,255,255,0.18)', color: 'white',
                fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999 }}>
                ID: {student.studentId}
              </span>
            )}
            {strandKey !== 'DEFAULT' && (
              <span style={{ background: 'rgba(255,255,255,0.18)', color: 'white',
                fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999 }}>
                {strandKey}
              </span>
            )}
            {student?.section?.name && (
              <span style={{ background: 'rgba(255,255,255,0.18)', color: 'white',
                fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999 }}>
                {student.section.name}
              </span>
            )}
          </div>
        </div>
        {/* end position:relative */}
        </div>
        {/* end welcome banner */}

        {/* ── Stats Grid ───────────────────────────────────── */}
        <div className="stats-grid reveal reveal-d1">
          <StatCard label="Narratives" value={ns.total} sub="submitted"
            bg="linear-gradient(135deg,#F97316,#FB923C)" icon={icons.narratives} />
          <StatCard label="This Week" value={ns.thisWeek} sub="narratives"
            bg="linear-gradient(135deg,#8B5CF6,#6D28D9)" icon={icons.week} />
          <StatCard label="Pending Review" value={ns.pending} sub="under review"
            bg="linear-gradient(135deg,#F59E0B,#D97706)" icon={icons.pending} />
          <StatCard label="Requirements" value={`${pct}%`} sub={`${cl.completedItems}/${cl.totalItems} done`}
            bg="linear-gradient(135deg,#10B981,#059669)" icon={icons.progress} />
        </div>

        {/* ── Progress Section ─────────────────────────────── */}
        <div style={{ background: 'white', borderRadius: 20, border: '1px solid #E5E7EB',
          boxShadow: '0 1px 8px rgba(0,0,0,0.05)', padding: '24px 28px', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
            gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: '0 0 4px' }}>
                Overall Requirements Progress
              </h2>
              <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>
                {cl.completedItems} of {cl.totalItems} checklist items completed
              </p>
            </div>
            <span style={{ background: statusBg, color: statusColor, fontSize: 12, fontWeight: 700,
              padding: '5px 14px', borderRadius: 999, whiteSpace: 'nowrap' }}>
              {statusLabel}
            </span>
          </div>
          {/* Progress bar */}
          <div style={{ height: 10, background: '#F3F4F6', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: barColor,
              borderRadius: 999, transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)' }} />
          </div>
          {/* Mini milestones */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            {[0, 25, 50, 75, 100].map(m => (
              <span key={m} style={{ fontSize: 10, color: pct >= m ? '#F97316' : '#D1D5DB', fontWeight: 600 }}>
                {m}%
              </span>
            ))}
          </div>
        </div>

        {/* ── Quick Actions ─────────────────────────────────── */}
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: '0 0 14px' }}>
            Quick Actions
          </h2>
          <div className="grid-2">
            <QuickAction label="New Narrative" desc="Document today's activities"
              accent="#F97316" onClick={() => router.push('/narratives/create')} icon={icons.newNarr} />
            <QuickAction label="My Narratives" desc="View all submissions"
              accent="#8B5CF6" onClick={() => router.push('/narratives')} icon={icons.myNarr} />
            <QuickAction label="Requirements" desc="Track your checklist"
              accent="#10B981" onClick={() => router.push('/checklist')} icon={icons.checklist} />
            <QuickAction label="Announcements" desc="Latest from teachers"
              accent="#F59E0B" onClick={() => router.push('/announcements')} icon={icons.announce} />
          </div>
        </div>

        {/* ── Info Row ─────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}
          className="grid-3">
          <InfoPill label="Company"       value={student?.company} />
          <InfoPill label="Supervisor"    value={student?.supervisor?.name} />
          <InfoPill label="Grade & Section"
            value={student?.gradeLevel && student?.section?.name
              ? `Grade ${student.gradeLevel} — ${student.section.name}` : undefined} />
        </div>

        {/* ── Recent Activity ───────────────────────────────── */}
        <div style={{ background: 'white', borderRadius: 20, border: '1px solid #E5E7EB',
          boxShadow: '0 1px 8px rgba(0,0,0,0.05)', padding: '24px 28px', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: 0 }}>Recent Activity</h2>
            {recentNarratives.length > 0 && (
              <button onClick={() => router.push('/narratives')} style={{
                fontSize: 12, color: '#F97316', background: 'none', border: 'none',
                cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
              }}>View All →</button>
            )}
          </div>

          {recentNarratives.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', padding: '32px 0', gap: 12, textAlign: 'center' }}>
              <div style={{ width: 52, height: 52, background: '#F3F4F6', borderRadius: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>
                {icons.clock}
              </div>
              <p style={{ fontSize: 14, color: '#9CA3AF', margin: 0 }}>No narratives submitted yet.</p>
              <button onClick={() => router.push('/narratives/create')} style={{
                padding: '9px 22px', background: '#F97316', color: 'white',
                border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>Write Your First Narrative</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {recentNarratives.map((n, i) => {
                const title = n.content.match(/\*\*Activity:\*\*\s*(.+)/i)?.[1] ?? 'Daily Activity'
                const dateStr = new Date(n.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                const STATUS: Record<string, { bg: string; color: string; label: string }> = {
                  approved:           { bg: '#D1FAE5', color: '#065F46', label: 'Approved' },
                  pending:            { bg: '#FEF3C7', color: '#92400E', label: 'Pending' },
                  revision_requested: { bg: '#FFEDD5', color: '#9A3412', label: 'Revision' },
                }
                const badge = n.isDraft
                  ? { bg: '#F3F4F6', color: '#6B7280', label: 'Draft' }
                  : (STATUS[n.status] ?? STATUS.pending)
                return (
                  <div key={n.id}
                    onClick={() => router.push(`/narratives/${n.id}`)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '12px 0', cursor: 'pointer',
                      borderBottom: i < recentNarratives.length - 1 ? '1px solid #F3F4F6' : 'none',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.75' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      background: badge.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg style={{ width: 18, height: 18, color: badge.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: 14, color: '#111827', margin: 0,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {title}
                      </p>
                      <p style={{ fontSize: 12, color: '#9CA3AF', margin: '2px 0 0' }}>{dateStr}</p>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px',
                      borderRadius: 999, background: badge.bg, color: badge.color, whiteSpace: 'nowrap' }}>
                      {badge.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AppShell>
  )
}
