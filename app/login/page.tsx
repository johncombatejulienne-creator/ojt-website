'use client'

import React, { useState, useEffect } from 'react'
import { signIn, signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

export default function LoginPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [userType, setUserType] = useState<'student' | 'teacher'>('student')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  // Redirect if already logged in
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      router.push('/dashboard')
    }
  }, [status, session, router])

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    setError('')
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      // Force complete sign out first to clear any cached sessions
      await signOut({ redirect: false })
      
      // Small delay to ensure sign out completes
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Now sign in fresh
      const result = await signIn('google', {
        callbackUrl: '/dashboard',
        redirect: true, // Changed to true for better mobile handling
      })

      if (result?.error) {
        setError('Failed to sign in with Google. Please try again.')
        setIsLoading(false)
      }
    } catch (err) {
      setError('An error occurred during sign in')
      setIsLoading(false)
    }
  }

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        role: userType,
        callbackUrl: userType === 'teacher' ? '/teacher/dashboard' : '/dashboard',
        redirect: true, // Changed to true for better handling
      })

      if (result?.error) {
        setError('Invalid email or password')
        setIsLoading(false)
      }
    } catch (err) {
      setError('An error occurred during sign in')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 relative overflow-hidden">
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/30 to-pink-400/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo/Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 rounded-full mb-4 shadow-2xl transform hover:scale-110 transition-transform duration-300">
            <span className="text-4xl font-bold text-white">WI</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Work Immersion Program
          </h1>
          <p className="text-gray-600 text-lg">
            Track Your Journey, Shape Your Future
          </p>
        </div>

        {/* Show sign out option if there's a session */}
        {status === 'authenticated' && (
          <div className="mb-4 p-4 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 backdrop-blur-sm border border-yellow-300/50 rounded-xl shadow-lg animate-fade-in">
            <p className="text-sm text-gray-800 mb-2">
              You're signed in as <strong className="text-purple-600">{session?.user?.email}</strong>
            </p>
            <button
              onClick={handleSignOut}
              className="w-full bg-white hover:bg-gray-50 text-gray-800 font-medium px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 shadow-md"
            >
              Sign out and use different account
            </button>
          </div>
        )}

        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-white/50">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">Sign In</h2>
            {/* User Type Selection */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setUserType('student')}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                  userType === 'student'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                🎓 Student
              </button>
              <button
                onClick={() => setUserType('teacher')}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                  userType === 'teacher'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                👨‍🏫 Teacher
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Student Login (Google Only) */}
            {userType === 'student' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 text-center">
                  Students must sign in with their Gmail account
                </p>
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full bg-white hover:bg-gray-50 border-2 border-gray-200 text-gray-800 font-medium px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  {isLoading ? 'Signing in...' : 'Sign in with Google'}
                </button>
              </div>
            )}

            {/* Teacher Login (Email & Password or Google) */}
            {userType === 'teacher' && (
              <div className="space-y-4">
                <form onSubmit={handleCredentialsSignIn} className="space-y-4">
                  <Input
                    label="School Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="teacher@school.edu"
                    required
                  />
                  <Input
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <Button
                    type="submit"
                    isLoading={isLoading}
                    className="w-full"
                  >
                    Sign In
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or</span>
                  </div>
                </div>

                <Button
                  onClick={handleGoogleSignIn}
                  isLoading={isLoading}
                  className="w-full"
                  variant="outline"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Sign in with Google
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6 animate-fade-in">
          {userType === 'student'
            ? '🎓 Make sure you are using your registered Gmail account'
            : '👨‍🏫 Use your school email or Google Workspace account'}
        </p>
      </div>
    </div>
  )
}