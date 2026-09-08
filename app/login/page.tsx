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

  // Redirect if already logged in
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const role = session.user.role
      router.push(role === 'teacher' ? '/teacher/dashboard' : '/dashboard')
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
      await signOut({ redirect: false })
      await new Promise(resolve => setTimeout(resolve, 300))
      await signIn('google', { callbackUrl: '/dashboard', redirect: true })
    } catch {
      setError('An error occurred during sign in. Please try again.')
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
        const msg = result.error
        if (msg.includes('No teacher account')) {
          setError('No teacher account found with this email address.')
        } else if (msg.includes('Incorrect password')) {
          setError('Incorrect password. Please try again.')
        } else if (msg.includes('Google Sign-In')) {
          setError('This account requires Google Sign-In.')
        } else {
          setError('Invalid email or password.')
        }
        setIsLoading(false)
      } else if (result?.url) {
        router.push(result.url)
      }
    } catch {
      setError('An error occurred during sign in.')
      setIsLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden px-4 py-8">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 rounded-full mb-4 shadow-2xl">
            <span className="text-3xl font-bold text-white">WI</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Work Immersion Program
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Track Your Journey, Shape Your Future</p>
          <div className="mt-3 flex justify-center">
            <ShareButton
              shareOptions={{
                title: 'Work Immersion Program',
                text: 'Join our work immersion tracking system',
              }}
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700 text-xs"
            />
          </div>
        </div>

        {/* Existing session warning */}
        {status === 'authenticated' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-sm text-yellow-800 mb-2">
              Signed in as <strong>{session?.user?.email}</strong>
            </p>
            <Button onClick={handleSignOut} variant="outline" size="sm" fullWidth
              className="border-yellow-300 text-yellow-700 hover:bg-yellow-50">
              Sign out and use a different account
            </Button>
          </div>
        )}

        {/* Login Card */}
        <Card className="shadow-2xl border-0">
          <CardHeader padding="lg" divider>
            <CardTitle level={2} className="text-center text-xl">
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
                      onClick={() => { setUserType(type); setError('') }}
                      className={cn(
                        'py-3 px-4 rounded-xl font-medium transition-all duration-200 flex flex-col items-center gap-1',
                        userType === type
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      <span className="text-xl">{type === 'student' ? 'ðŸŽ“' : 'ðŸ‘¨â€ðŸ«'}</span>
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

              {/* Student Login â€” Google only */}
              {userType === 'student' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                    <p className="text-sm font-semibold text-blue-800 mb-1">ðŸ“§ Students sign in with Gmail</p>
                    <p className="text-xs text-blue-600">
                      Use the Google account registered with your school.
                    </p>
                  </div>
                  <Button
                    onClick={handleGoogleSignIn}
                    isLoading={isLoading}
                    fullWidth
                    size="lg"
                    variant="outline"
                    className="border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                    leftIcon={
                      !isLoading ? (
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                      ) : undefined
                    }
                  >
                    {isLoading ? 'Signing inâ€¦' : 'Continue with Google'}
                  </Button>
                </div>
              )}

              {/* Teacher Login â€” Email + Password */}
              {userType === 'teacher' && (
                <div className="space-y-4">
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
                    <div className="relative">
                      <Input
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                        required
                        autoComplete="current-password"
                        rightIcon={
                          <button
                            type="button"
                            onClick={() => setShowPassword(v => !v)}
                            className="text-gray-400 hover:text-gray-600 focus:outline-none"
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
                    </div>
                    <Button type="submit" isLoading={isLoading} fullWidth size="lg">
                      {isLoading ? 'Signing inâ€¦' : 'Sign In'}
                    </Button>
                  </form>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-3 bg-white text-gray-400">or sign in with</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleGoogleSignIn}
                    isLoading={isLoading}
                    fullWidth
                    size="md"
                    variant="outline"
                    className="border-2 border-gray-200 text-gray-700 hover:border-gray-300"
                    leftIcon={
                      !isLoading ? (
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                      ) : undefined
                    }
                  >
                    {isLoading ? 'Signing inâ€¦' : 'Google Workspace'}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Info footer */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200 text-center text-xs text-gray-500">
          {userType === 'student' ? (
            <>
              <span className="text-base mr-1">ðŸŽ“</span>
              Use your registered Gmail to sign in as a student.
              <br />
              <span className="text-gray-400">First time? You&apos;ll be prompted to complete your profile.</span>
            </>
          ) : (
            <>
              <span className="text-base mr-1">ðŸ‘¨â€ðŸ«</span>
              Use your school email and password to sign in as a teacher.
              <br />
              <span className="text-gray-400">Google Workspace login is also available.</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

