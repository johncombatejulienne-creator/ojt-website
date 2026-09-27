'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useTutorial } from './TutorialContext'

/**
 * Mounts in AppShell — automatically starts tutorial for first-time users.
 * Role is read from the session.
 */
export function TutorialAutoStart() {
  const { data: session, status } = useSession()
  const { shouldShowOnboarding, startTutorial, state } = useTutorial()
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current) return
    if (status !== 'authenticated' || !session?.user) return
    if (state.active) return

    const role = session.user.role as 'student' | 'teacher' | undefined
    if (role !== 'student' && role !== 'teacher') return

    // Slight delay so page renders first
    const t = setTimeout(() => {
      if (shouldShowOnboarding(role)) {
        fired.current = true
        startTutorial(role)
      }
    }, 1200)
    return () => clearTimeout(t)
  }, [status, session, shouldShowOnboarding, startTutorial, state.active])

  return null
}

/**
 * "How to Use" floating button — manual tutorial restart.
 * Replaces/extends the existing HelpButton for teacher pages.
 */
export function TutorialHowToUseButton() {
  const { data: session } = useSession()
  const { startTutorial } = useTutorial()

  const role = session?.user?.role as 'student' | 'teacher' | undefined
  if (!role || (role !== 'student' && role !== 'teacher')) return null

  return (
    <button
      data-tutorial="how-to-use"
      onClick={() => startTutorial(role)}
      title="Start Tutorial"
      style={{
        position: 'fixed', bottom: 84, right: 20, zIndex: 100,
        width: 44, height: 44, borderRadius: '50%',
        background: 'linear-gradient(135deg,#1E293B,#334155)',
        border: '2px solid rgba(255,255,255,0.15)',
        cursor: 'pointer', color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
        transition: 'all 0.2s ease',
        fontFamily: 'inherit',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
      aria-label="How to Use — Start Tutorial"
    >
      <svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    </button>
  )
}
