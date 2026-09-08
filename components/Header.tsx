'use client'

import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from './ui/Button'

export default function Header() {
  const { data: session } = useSession()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut({ 
      callbackUrl: '/login',
      redirect: true 
    })
  }

  if (!session) return null

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">OJT</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-gray-900">Work Immersion</h1>
                <p className="text-xs text-gray-600">{session.user?.email}</p>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile: Icon only */}
            <Button
              onClick={handleSignOut}
              variant="outline"
              size="sm"
              className="sm:hidden"
              title="Sign Out"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </Button>

            {/* Desktop: Full button */}
            <Button
              onClick={handleSignOut}
              variant="outline"
              size="sm"
              className="hidden sm:flex"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
