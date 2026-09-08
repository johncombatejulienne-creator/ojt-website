'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function HomePage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'loading') return

    if (session?.user) {
      router.replace(session.user.role === 'teacher' ? '/teacher/dashboard' : '/dashboard')
    } else {
      router.replace('/login')
    }
  }, [session, status, router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Logo */}
      <div className="w-16 h-16 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 rounded-full flex items-center justify-center shadow-xl">
        <span className="text-2xl font-bold text-white">WI</span>
      </div>

      {/* Spinner */}
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
        <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
      </div>

      <p className="text-gray-500 text-sm">Loading…</p>
    </div>
  )
}
