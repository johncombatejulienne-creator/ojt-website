'use client'

import { useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ShareButton } from './ui/ShareButton'

/* ── Avatar ─────────────────────────────────────────── */
function Avatar({
  src,
  name,
  size = 36,
}: {
  src?: string | null
  name?: string | null
  size?: number
}) {
  const [imgError, setImgError] = useState(false)
  const initial =
    name?.charAt(0)?.toUpperCase() ??
    '?'

  if (src && !imgError) {
    return (
      <div
        className="rounded-full overflow-hidden ring-2 ring-white/40 flex-shrink-0"
        style={{ width: size, height: size }}
      >
        <Image
          src={src}
          alt={name ?? 'Profile'}
          width={size}
          height={size}
          className="object-cover w-full h-full"
          unoptimized={src.startsWith('data:')}
          onError={() => setImgError(true)}
        />
      </div>
    )
  }

  return (
    <div
      className="rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-semibold ring-2 ring-white/40 flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initial}
    </div>
  )
}

/* ── Header ─────────────────────────────────────────── */
export default function Header() {
  const { data: session } = useSession()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login', redirect: true })
  }

  if (!session) return null

  const isTeacher = session.user?.role === 'teacher'
  const dashboardPath = isTeacher ? '/teacher/dashboard' : '/dashboard'
  const profilePath = '/profile/edit'

  return (
    <header className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">

          {/* Logo */}
          <button
            onClick={() => router.push(dashboardPath)}
            className="flex items-center gap-2.5 hover:opacity-90 transition-opacity"
            aria-label="Go to dashboard"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center shadow-md flex-shrink-0">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 font-bold text-base sm:text-lg">
                WI
              </span>
            </div>
            <div className="hidden sm:block">
              <p className="text-white font-semibold text-sm leading-tight">Work Immersion Program</p>
              <p className="text-blue-100 text-xs opacity-80 truncate max-w-[200px]">
                {session.user?.email}
              </p>
            </div>
          </button>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">

            {/* Share — desktop only */}
            <div className="hidden sm:block">
              <ShareButton
                shareOptions={{
                  title: 'Work Immersion Program',
                  text: 'Track your work immersion progress and activities',
                }}
                variant="ghost"
                size="sm"
                className="text-white/80 hover:text-white hover:bg-white/10"
                showText={false}
              />
            </div>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 hover:bg-white/10 rounded-xl px-2 py-1.5 transition-colors"
                aria-expanded={menuOpen}
                aria-haspopup="true"
              >
                <Avatar
                  src={session.user?.profilePicture}
                  name={session.user?.name}
                  size={34}
                />
                <div className="hidden sm:block text-left">
                  <p className="text-white text-sm font-medium leading-tight truncate max-w-[120px]">
                    {session.user?.name ?? session.user?.email?.split('@')[0]}
                  </p>
                  <p className="text-blue-100 text-xs capitalize opacity-80">{session.user?.role}</p>
                </div>
                <svg
                  className={`w-4 h-4 text-white/70 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown */}
              {menuOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 z-20 overflow-hidden animate-scale-in">
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                      <Avatar
                        src={session.user?.profilePicture}
                        name={session.user?.name}
                        size={38}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {session.user?.name ?? 'User'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{session.user?.email}</p>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="py-1">
                      <button
                        onClick={() => { setMenuOpen(false); router.push(dashboardPath) }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Dashboard
                      </button>

                      {!isTeacher && (
                        <button
                          onClick={() => { setMenuOpen(false); router.push(profilePath) }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Edit Profile
                        </button>
                      )}

                      {/* Share — mobile only (appears in dropdown) */}
                      <div className="sm:hidden px-4 py-2.5 flex items-center gap-3">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                        </svg>
                        <ShareButton
                          shareOptions={{
                            title: 'Work Immersion Program',
                            text: 'Track your work immersion progress and activities',
                          }}
                          variant="ghost"
                          size="sm"
                          className="text-sm text-gray-700 p-0 h-auto font-normal hover:bg-transparent"
                          showText
                        />
                      </div>
                    </div>

                    <div className="border-t border-gray-100 py-1">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
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
