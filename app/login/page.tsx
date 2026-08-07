'use client'

import React, { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Chrome } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [userType, setUserType] = useState<'student' | 'teacher'>('student')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      const result = await signIn('google', {
        callbackUrl: '/dashboard',
        redirect: false,
      })

      if (result?.error) {
        setError('Failed to sign in with Google')
      } else if (result?.url) {
        router.push(result.url)
      }
    } catch (err) {
      setError('An error occurred during sign in')
    } finally {
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
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
      } else if (result?.url) {
        router.push(result.url)
      }
    } catch (err) {
      setError('An error occurred during sign in')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-background to-accent/20 p-4">
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-600 rounded-full mb-4 shadow-lg">
            <span className="text-3xl font-bold text-white">W</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Work Immersion System
          </h1>
          <p className="text-gray-600">
            Digital Journal for Students & Supervisors
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            {/* User Type Selection */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setUserType('student')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                  userType === 'student'
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Student
              </button>
              <button
                onClick={() => setUserType('teacher')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                  userType === 'teacher'
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Teacher
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
                <Button
                  onClick={handleGoogleSignIn}
                  isLoading={isLoading}
                  className="w-full"
                  variant="outline"
                >
                  <Chrome className="w-5 h-5 mr-2" />
                  Sign in with Google
                </Button>
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
                  <Chrome className="w-5 h-5 mr-2" />
                  Sign in with Google
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          {userType === 'student'
            ? 'Make sure you are using your registered Gmail account'
            : 'Use your school email or Google Workspace account'}
        </p>
      </div>
    </div>
  )
}
