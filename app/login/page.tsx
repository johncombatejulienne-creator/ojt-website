'use client'

import React, { useState, useEffect } from 'react'
import { signIn, signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ShareButton } from '@/components/ui/ShareButton'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [userType, setUserType] = useState<'student' | 'teacher'>('student')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      router.push(session.user.role === 'teacher' ? '/teacher/dashboard' : '/dashboard')
    }
  }, [status, session, router])

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    setError('')
  }

  const handleGoogleSignIn = async (asTeacher = false) => {
    setIsLoading(true)
    setError('')
    try {
      await signOut({ redirect: false })
      await new Promise(resolve => setTimeout(resolve, 300))
      // Pass the intended role so the JWT callback can use it
      await signIn('google', {
        callbackUrl: asTeacher ? '/teacher/dashboard' : '/dashboard',
        redirect: true,
      })
    } catch {
      setError('An error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  const handleTeacherSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      const result = await signIn('credentials', {
        email,
        password,
        role: 'teacher',
        callbackUrl: '/teacher/dashboard',
        redirect: false,
      })
      if (result?.error) {
        if (result.error.includes('No teacher account')) {
          setError('No teacher account found with this email.')
        } else if (result.error.includes('Incorrect password')) {
          setError('Incorrect password. Please try again.')
        } else {
          setError('Invalid email or password.')
        }
        setIsLoading(false)
      } else if (result?.url) {
        router.push(result.url)
      }
    } catch {
      setError('An error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 px-4 py-8">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-6">

        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 rounded-full mb-4 shadow-xl">
            <span className="text-3xl font-bold text-white">WI</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
            Work Immersion Program
          </h1>
          <p className="text-gray-500 text-sm">Track Your Journey, Shape Your Future</p>
          <div className="mt-3 flex justify-center">
            <ShareButton
              shareOptions={{
                title: 'Work Immersion Program',
                text: 'Join our work immersion tracking system',
              }}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-gray-600 text-xs"
            />
          </div>
        </div>

        {/* Existing session warning */}
        {status === 'authenticated' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-sm text-yellow-800 mb-2">
              Already signed in as <strong>{session?.user?.email}</strong>
            </p>
            <Button onClick={handleSignOut} variant="outline" size="sm" fullWidth
              className="border-yellow-300 text-yellow-700 hover:bg-yellow-50">
              Sign out and use a different account
            </Button>
          </div>
        )}

        {/* Login Card */}
        <Card className="shadow-2xl border border-gray-100">
          <CardHeader padding="lg" divider>
            <CardTitle level={2} className="text-center text-xl font-bold text-gray-900">
              Sign In to Your Account
            </CardTitle>
          </CardHeader>
          <CardContent padding="lg">
            <div className="space-y-5">

              {/* Role Toggle */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">I am a:</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['student', 'teacher'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => { setUserType(type); setError('') }}
                      className={cn(
                        'py-3 px-4 rounded-xl font-medium transition-all duration-200 flex flex-col items-center gap-1 border-2',
                        userType === type
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent shadow-md'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      )}
                    >
                      <span className="text-xl leading-none" role="img" aria-label={type}>
                        {type === 'student' ? '\u{1F393}' : '\u{1F468}\u200D\u{1F3EB}'}
                      </span>
                      <span className="text-sm capitalize">{type}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-3 flex items-start gap-2">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* Student: Google only */}
              {userType === 'student' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                    <p className="text-sm font-semibold text-blue-800 mb-1">
                      Students sign in with Gmail
                    </p>
                    <p className="text-xs text-blue-600">
                      Use the Google account registered with your school.
                    </p>
                  </div>
                  <Button
                    onClick={() => handleGoogleSignIn(false)}
                    isLoading={isLoading}
                    fullWidth
                    size="lg"
                    variant="outline"
                    className="border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                    leftIcon={
                      !isLoading ? (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                      ) : undefined
                    }
                  >
                    {isLoading ? 'Signing in...' : 'Continue with Google'}
                  </Button>
                </div>
              )}

              {/* Teacher: Email + Password */}
              {userType === 'teacher' && (
                <div className="space-y-4">

                  {/* Google sign-in — primary option for teachers/admins */}
                  <Button
                    onClick={() => handleGoogleSignIn(true)}
                    isLoading={isLoading}
                    fullWidth
                    size="lg"
                    variant="primary"
                    leftIcon={
                      !isLoading ? (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff"/>
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                      ) : undefined
                    }
                  >
                    {isLoading ? 'Signing in...' : 'Sign in with Google'}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-3 bg-white text-gray-400">or use email & password</span>
                    </div>
                  </div>

                  <form onSubmit={handleTeacherSignIn} className="space-y-4">
                    <Input
                      label="School Email Address"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="teacher@school.edu"
                      required
                      autoComplete="email"
                    />
                    <Input
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                      rightIcon={
                        <button
                          type="button"
                          onClick={() => setShowPassword(v => !v)}
                          className="text-gray-400 hover:text-gray-600"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      }
                    />
                    <Button type="submit" isLoading={isLoading} fullWidth size="lg" variant="outline">
                      {isLoading ? 'Signing in...' : 'Sign In with Email'}
                    </Button>
                  </form>
                </div>
              )}

            </div>
          </CardContent>
        </Card>

        {/* Footer info */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200 text-center text-xs text-gray-500">
          {userType === 'student' ? (
            <p>
              Use your registered Gmail to sign in as a student.
              <br />
              <span className="text-gray-400">First time? You will be prompted to complete your profile.</span>
            </p>
          ) : (
            <p>
              Use your school email and password to sign in as a teacher.
              <br />
              <span className="text-gray-400">Google Workspace login is also available.</span>
            </p>
          )}
        </div>

      </div>
    </div>
  )
}
