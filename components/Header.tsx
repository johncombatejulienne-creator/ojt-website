'use client'

import { useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'

/* ─── Avatar ─────────────────────────────────────────────── */
export function Avatar({ src, name, size = 34, round = true }: {
  src?: string | null; name?: string | null; size?: number; round?: boolean
}) {
  const [err, setErr] = useState(false)
  const initials = name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?'
  const radius = round ? '50%' : 10

  if (src && !err) return (
    <div style={{ width: size, height: size, borderRadius: radius, overflow: 'hidden', flexShrink: 0 }}>
      <Image src={src} alt={name ?? 'Profile'} width={size} height={size}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        unoptimized={src.startsWith('data:')} onError={() => setErr(true)} />
    </div>
  )

  return (
    <div style={{
      width: size, height: size, borderRadius: radius, flexShrink: 0,
      background: 'rgba(255,255,255,0.25)', border: '2px solid rgba(255,255,255,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontWeight: 800, fontSize: Math.round(size * 0.36),
    }}>{initials}</div>
  )
}

/* ─── Strand gradient for header ────────────────────────── */
const STRAND_GRAD: Record<string, string> = {
  STEM:    'linear-gradient(135deg,#F97316,#FBBF24)',
  ABM:     'linear-gradient(135deg,#D97706,#F59E0B)',
  HUMSS:   'linear-gradient(135deg,#B45309,#D97706)',
  TVL:     'linear-gradient(135deg,#EA580C,#F97316)',
  TEACHER: 'linear-gradient(135deg,#374151,#4B5563)',
  DEFAULT: 'linear-gradient(135deg,#F97316,#FBBF24)',
}

/* ─── Nav item ───────────────────────────────────────────── */
function NavLink({ label, path, current, onClick }: {
  label: string; path: string; current: boolean; onClick: () => void
}) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: current ? 'rgba(255,255,255,0.18)' : hov ? 'rgba(255,255,255,0.1)' : 'transparent',
        border: 'none', borderRadius: 8, padding: '6px 12px',
        color: current ? 'white' : 'rgba(255,255,255,0.75)',
        fontSize: 13, fontWeight: current ? 700 : 500, cursor: 'pointer',
        fontFamily: 'inherit', transition: 'all 0.15s', whiteSpace: 'nowrap',
      }}>
      {label}
    </button>
  )
}

/* ─── Header ─────────────────────────────────────────────── */
export default function Header({ strandCode }: { strandCode?: string }) {
  const { data: session } = useSession()
  const router   = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)

  if (!session) return null

  const isTeacher = session.user?.role === 'teacher'
  const dashPath  = isTeacher ? '/teacher/dashboard' : '/dashboard'
  const grad      = isTeacher
    ? STRAND_GRAD.TEACHER
    : strandCode ? (STRAND_GRAD[strandCode.toUpperCase()] ?? STRAND_GRAD.DEFAULT) : STRAND_GRAD.DEFAULT

  const userName   = session.user?.name ?? session.user?.email?.split('@')[0] ?? 'User'
  const userEmail  = session.user?.email ?? ''
  const profilePic = session.user?.profilePicture
  const userRole   = isTeacher ? 'Teacher' : 'Student'

  const studentNav = [
    { label: 'Home',          path: '/dashboard' },
    { label: 'Narratives',    path: '/narratives' },
    { label: 'Requirements',  path: '/checklist' },
    { label: 'Announcements', path: '/announcements' },
    { label: 'Profile',       path: '/profile/edit' },
  ]
  const teacherNav = [
    { label: 'Dashboard',     path: '/teacher/dashboard', tab: '' },
    { label: 'Students',      path: '/teacher/dashboard?tab=students',      tab: 'students' },
    { label: 'Announcements', path: '/teacher/dashboard?tab=announcements', tab: 'announcements' },
    { label: 'Teachers',      path: '/teacher/dashboard?tab=teachers',      tab: 'teachers' },
  ]
  const navItems = isTeacher ? teacherNav : studentNav

  const handleSignOut = () => signOut({ callbackUrl: '/login', redirect: true })

  return (
    <>
      <header style={{ background: grad, position: 'sticky', top: 0, zIndex: 50,
        boxShadow: '0 2px 16px rgba(0,0,0,0.15)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', height: 60, gap: 12 }}>

            {/* Logo */}
            <button onClick={() => router.push(dashPath)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none',
                border: 'none', cursor: 'pointer', flexShrink: 0 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden',
                background: 'white', flexShrink: 0,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/psbc-logo.svg" alt="PSBC Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <div style={{ display: 'none' }} className="header-title">
                <p style={{ color: 'white', fontWeight: 800, fontSize: 13, margin: 0, lineHeight: 1.2,
                  textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
                  PSBC Work Immersion
                </p>
                <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 10, margin: 0 }}>
                  Paete Science and Business College
                </p>
              </div>
            </button>

            {/* Desktop Nav */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, overflow: 'hidden' }}
              className="header-nav">
              {navItems.map(item => (
                <NavLink
                  key={item.label}
                  label={item.label}
                  path={item.path}
                  current={
                    isTeacher
                      ? (item as { tab?: string }).tab
                        ? (typeof window !== 'undefined' && window.location.search.includes(`tab=${(item as { tab?: string }).tab}`))
                        : pathname === '/teacher/dashboard' && !window.location.search.includes('tab=')
                      : pathname === item.path
                  }
                  onClick={() => router.push(item.path)}
                />
              ))}
            </nav>

            {/* Spacer */}
            <div style={{ flex: 1 }} className="header-spacer" />

            {/* Right side */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>

              {/* Mobile menu button */}
              <button onClick={() => setMobileNav(v => !v)} className="header-mobile-btn"
                style={{ display: 'none', background: 'rgba(255,255,255,0.15)', border: 'none',
                  borderRadius: 8, padding: 8, cursor: 'pointer', color: 'white' }}>
                <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d={mobileNav ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
                </svg>
              </button>

              {/* Profile button */}
              <div style={{ position: 'relative' }}>
                <button onClick={() => setMenuOpen(v => !v)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8,
                    background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 10, padding: '6px 10px 6px 7px', cursor: 'pointer',
                    transition: 'background 0.15s', fontFamily: 'inherit' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.2)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)' }}
                >
                  <Avatar src={profilePic} name={userName} size={28} />
                  <div style={{ textAlign: 'left' }} className="header-username">
                    <p style={{ color: 'white', fontSize: 12, fontWeight: 700, margin: 0,
                      lineHeight: 1.2, maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {userName}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, margin: 0 }}>{userRole}</p>
                  </div>
                  <svg style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.7)',
                    transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown */}
                {menuOpen && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 10 }}
                      onClick={() => setMenuOpen(false)} />
                    <div style={{
                      position: 'absolute', right: 0, top: '100%', marginTop: 8,
                      width: 240, background: 'white', borderRadius: 16,
                      boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)',
                      border: '1px solid #E5E7EB', zIndex: 20, overflow: 'hidden',
                      animation: 'fadeIn 0.15s ease',
                    }}>
                      {/* User info */}
                      <div style={{ padding: '16px 18px', borderBottom: '1px solid #F3F4F6',
                        display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 10, overflow: 'hidden',
                          flexShrink: 0, background: '#FFF7ED',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#F97316', fontWeight: 800, fontSize: 15 }}>
                          {profilePic
                            ? <Image src={profilePic} alt={userName} width={42} height={42}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                unoptimized={profilePic.startsWith('data:')} />
                            : userName.charAt(0).toUpperCase()
                          }
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {userName}
                          </p>
                          <p style={{ fontSize: 11, color: '#9CA3AF', margin: '2px 0 0',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {userEmail}
                          </p>
                          <span style={{ display: 'inline-block', marginTop: 3, fontSize: 10, fontWeight: 700,
                            background: '#FFF7ED', color: '#F97316', padding: '1px 8px', borderRadius: 999,
                            textTransform: 'capitalize' }}>{userRole}</span>
                        </div>
                      </div>

                      {/* Menu items */}
                      <div style={{ padding: '6px 0' }}>
                        {[
                          { label: 'Dashboard',    path: dashPath,           icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
                          ...(isTeacher
                            ? [{ label: 'Edit Profile', path: '/teacher/profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }]
                            : [{ label: 'Edit Profile', path: '/profile/edit',    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }]
                          ),
                        ].map(item => (
                          <button key={item.path + item.label}
                            onClick={() => { setMenuOpen(false); router.push(item.path) }}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                              padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer',
                              fontSize: 13, color: '#374151', fontFamily: 'inherit', textAlign: 'left',
                              transition: 'background 0.1s' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F9FAFB' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                          >
                            <svg style={{ width: 16, height: 16, color: '#9CA3AF', flexShrink: 0 }}
                              fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                            </svg>
                            {item.label}
                          </button>
                        ))}
                      </div>

                      <div style={{ borderTop: '1px solid #F3F4F6', padding: '6px 0' }}>
                        <button onClick={handleSignOut}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer',
                            fontSize: 13, color: '#EF4444', fontFamily: 'inherit', textAlign: 'left',
                            transition: 'background 0.1s' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#FEF2F2' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                        >
                          <svg style={{ width: 16, height: 16, flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile nav drawer */}
        {mobileNav && (
          <div style={{ background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ maxWidth: 1280, margin: '0 auto', padding: '12px 20px',
              display: 'flex', flexDirection: 'column', gap: 4 }}>
              {navItems.map(item => (
                <button key={item.path + item.label}
                  onClick={() => { router.push(item.path); setMobileNav(false) }}
                  style={{ padding: '10px 14px', background: pathname === item.path ? 'rgba(255,255,255,0.15)' : 'transparent',
                    border: 'none', borderRadius: 8, color: 'white', fontSize: 14, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }

        @media (min-width: 640px) {
          .header-title { display: block !important; }
          .header-username { display: block !important; }
        }

        @media (min-width: 768px) {
          .header-nav { display: flex !important; }
          .header-spacer { display: block !important; }
          .header-mobile-btn { display: none !important; }
        }

        @media (max-width: 767px) {
          .header-nav { display: none !important; }
          .header-spacer { display: block !important; flex: 1 !important; }
          .header-mobile-btn { display: flex !important; }
        }
      `}</style>
    </>
  )
}
