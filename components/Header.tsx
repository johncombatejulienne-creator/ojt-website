'use client'

import { useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ShareButton } from './ui/ShareButton'

/* ─── Avatar ─────────────────────────────────────────────── */
export function Avatar({
  src,
  name,
  size = 36,
  className = '',
}: {
  src?: string | null
  name?: string | null
  size?: number
  className?: string
}) {
  const [err, setErr] = useState(false)
  const initials = name
    ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  if (src && !err) {
    return (
      <div
        className={`rounded-full overflow-hidden flex-shrink-0 ${className}`}
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
      className={`rounded-full flex items-center justify-center font-bold flex-shrink-0 select-none ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
    >
      {initials}
    </div>
  )
}

/* ─── Nav Item ───────────────────────────────────────────── */
function NavItem({
  label,
  icon,
  onClick,
}: {
  label: string
  icon: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700
        hover:bg-gray-50 transition-colors text-left"
    >
      <span className="text-gray-400 flex-shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  )
}

/* ─── Header ─────────────────────────────────────────────── */
export default function Header({ strandCode }: { strandCode?: string }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  if (!session) return null

  const isTeacher    = session.user?.role === 'teacher'
  // Use URL path as fallback in case session hasn't refreshed yet
  const isOnTeacherPage    = typeof window !== 'undefined' && window.location.pathname.startsWith('/teacher')
  const effectiveIsTeacher = isTeacher || isOnTeacherPage
  const dashPath     = effectiveIsTeacher ? '/teacher/dashboard' : '/dashboard'
  const userName     = session.user?.name ?? session.user?.email?.split('@')[0] ?? 'User'
  const userEmail    = session.user?.email ?? ''
  const userRole     = effectiveIsTeacher ? 'Teacher' : 'Student'
  const profilePic   = session.user?.profilePicture

  // Strand accent colour for the header bar
  const strandGradients: Record<string, string> = {
    STEM:  'from-sky-600 to-indigo-600',
    ABM:   'from-emerald-600 to-teal-600',
    HUMSS: 'from-violet-600 to-purple-600',
    TVL:   'from-orange-600 to-amber-500',
  }
  const gradient = strandCode
    ? (strandGradients[strandCode.toUpperCase()] ?? 'from-indigo-600 to-purple-600')
    : isTeacher
      ? 'from-slate-700 to-slate-800'
      : 'from-indigo-600 to-purple-600'

  const handleSignOut = () => signOut({ callbackUrl: '/login', redirect: true })

  return (
    <header
      className={`sticky top-0 z-50 bg-gradient-to-r ${gradient} shadow-md`}
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-4">

          {/* ── Logo ──────────────────────────────────────── */}
          <button
            onClick={() => router.push(dashPath)}
            className="flex items-center gap-3 min-w-0 hover:opacity-90 transition-opacity"
            aria-label="Go to dashboard"
          >
            {/* Logo mark */}
            <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/25
              flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
              <span className="text-white font-black text-sm tracking-tight">WI</span>
            </div>

            {/* Site name — hidden on very small screens */}
            <div className="hidden sm:block min-w-0">
              <p className="text-white font-semibold text-sm leading-tight truncate">
                Work Immersion Portal
              </p>
              {strandCode && (
                <p className="text-white/70 text-xs leading-tight">{strandCode} Strand</p>
              )}
            </div>
          </button>

          {/* ── Right side ────────────────────────────────── */}
          <div className="flex items-center gap-2 flex-shrink-0">

            {/* Share icon — desktop */}
            <div className="hidden md:flex">
              <ShareButton
                shareOptions={{ title: 'Work Immersion Portal', text: 'Track your work immersion progress.' }}
                variant="ghost"
                size="sm"
                showText={false}
                className="text-white/70 hover:text-white hover:bg-white/10 rounded-lg p-2"
              />
            </div>

            {/* User button */}
            <div className="relative">
              <button
                onClick={() => setOpen(v => !v)}
                aria-expanded={open}
                aria-haspopup="true"
                className="flex items-center gap-2 rounded-xl px-2.5 py-1.5
                  hover:bg-white/10 transition-colors"
              >
                <Avatar
                  src={profilePic}
                  name={userName}
                  size={32}
                  className="bg-white/20 text-white ring-2 ring-white/30"
                />
                <div className="hidden sm:block text-left max-w-[140px]">
                  <p className="text-white text-xs font-semibold truncate leading-tight">{userName}</p>
                  <p className="text-white/60 text-xs leading-tight">{userRole}</p>
                </div>
                <svg
                  className={`w-3.5 h-3.5 text-white/60 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown */}
              {open && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl
                    shadow-xl border border-gray-100 z-20 overflow-hidden animate-scale-in">

                    {/* User info */}
                    <div className="px-4 py-3.5 border-b border-gray-100">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar
                          src={profilePic}
                          name={userName}
                          size={40}
                          className="bg-indigo-100 text-indigo-600 ring-2 ring-indigo-100 flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                          <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                          <span className="inline-block mt-0.5 px-2 py-0.5 text-xs font-medium
                            bg-indigo-50 text-indigo-700 rounded-full capitalize">
                            {userRole}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="py-1.5">
                      <NavItem
                        label="Dashboard"
                        onClick={() => { setOpen(false); router.push(dashPath) }}
                        icon={
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                        }
                      />

                      {!effectiveIsTeacher && (
                        <NavItem
                          label="Edit Profile"
                          onClick={() => { setOpen(false); router.push('/profile/edit') }}
                          icon={
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          }
                        />
                      )}

                      <div className="md:hidden px-4 py-2.5 flex items-center gap-3 text-sm text-gray-700">
                        <ShareButton
                          shareOptions={{ title: 'Work Immersion Portal', text: 'Track your work immersion progress.' }}
                          variant="ghost"
                          size="sm"
                          showText
                          className="text-gray-700 p-0 font-normal text-sm"
                        />
                      </div>
                    </div>

                    <div className="border-t border-gray-100 py-1.5">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm
                          text-red-600 hover:bg-red-50 transition-colors text-left"
                      >
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    </header>
  )
}
