'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface StudentData {
  id: string
  name: string
  studentId: string
  email: string
  company?: string
  gradeLevel?: number
  strand?: { name: string; code: string }
  section?: { name: string }
  supervisor?: { name: string }
}

interface ChecklistStats {
  totalItems: number
  completedItems: number
  progressPercentage: number
}

interface NarrativeStats {
  total: number
  thisWeek: number
  pending: number
}

export default function StudentDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [student, setStudent] = useState<StudentData | null>(null)
  const [checklistStats, setChecklistStats] = useState<ChecklistStats>({
    totalItems: 0,
    completedItems: 0,
    progressPercentage: 0,
  })
  const [narrativeStats, setNarrativeStats] = useState<NarrativeStats>({
    total: 0,
    thisWeek: 0,
    pending: 0,
  })
  const [loading, setLoading] = useState(true)
  const [needsRegistration, setNeedsRegistration] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch student profile
        const profileRes = await fetch('/api/students/profile')
        if (profileRes.ok) {
          const profileData = await profileRes.json()
          setStudent(profileData.student)
          
          // Check if registration is complete
          if (!profileData.student.strandId || !profileData.student.sectionId) {
            setNeedsRegistration(true)
          }
        }

        // Fetch checklist progress
        const checklistRes = await fetch('/api/checklists/my-checklist')
        if (checklistRes.ok) {
          const checklistData = await checklistRes.json()
          if (checklistData.checklists && checklistData.checklists.length > 0) {
            const stats = checklistData.checklists[0].stats
            setChecklistStats(stats)
          }
        }

        // Fetch narrative stats
        const narrativesRes = await fetch('/api/narratives?stats=true')
        if (narrativesRes.ok) {
          const narrativesData = await narrativesRes.json()
          setNarrativeStats(narrativesData.stats || { total: 0, thisWeek: 0, pending: 0 })
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (session?.user) {
      fetchDashboardData()
    }
  }, [session])

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (needsRegistration) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Complete Your Registration</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Please complete your profile to access the Work Immersion System.
            </p>
            <Button onClick={() => router.push('/profile/complete')} className="w-full">
              Complete Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Work Immersion Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Welcome back, {student?.name}</p>
            </div>
            <Button variant="outline" onClick={() => router.push('/api/auth/signout')}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Student Overview */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Student ID</p>
              <p className="font-medium text-gray-900">{student?.studentId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Grade & Section</p>
              <p className="font-medium text-gray-900">
                {student?.gradeLevel && student?.section?.name 
                  ? `Grade ${student.gradeLevel} - ${student.section.name}`
                  : 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Strand</p>
              <p className="font-medium text-gray-900">
                {student?.strand?.code || 'Not assigned'}
              </p>
            </div>
            {student?.company && (
              <div>
                <p className="text-sm text-gray-600">Company/Establishment</p>
                <p className="font-medium text-gray-900">{student.company}</p>
              </div>
            )}
            {student?.supervisor && (
              <div>
                <p className="text-sm text-gray-600">Supervisor</p>
                <p className="font-medium text-gray-900">{student.supervisor.name}</p>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Narrative Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Narratives</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Submitted</span>
                  <span className="font-semibold">{narrativeStats.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">This Week</span>
                  <span className="font-semibold">{narrativeStats.thisWeek}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pending Review</span>
                  <span className="font-semibold text-yellow-600">{narrativeStats.pending}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Overall Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary-600 mb-2">
                  {checklistStats.progressPercentage}%
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {checklistStats.completedItems} of {checklistStats.totalItems} items completed
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${checklistStats.progressPercentage}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Profile</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    Complete
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Requirements</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    checklistStats.progressPercentage === 100
                      ? 'bg-green-100 text-green-800'
                      : checklistStats.progressPercentage > 50
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {checklistStats.progressPercentage === 100
                      ? 'Complete'
                      : checklistStats.progressPercentage > 50
                      ? 'In Progress'
                      : 'Starting'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              onClick={() => router.push('/narratives/create')}
              className="h-24 flex flex-col items-center justify-center gap-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>New Narrative</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => router.push('/narratives')}
              className="h-24 flex flex-col items-center justify-center gap-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>My Narratives</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => router.push('/checklist')}
              className="h-24 flex flex-col items-center justify-center gap-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>Requirements</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => router.push('/announcements')}
              className="h-24 flex flex-col items-center justify-center gap-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
              <span>Announcements</span>
            </Button>
          </div>
        </div>

        {/* Recent Activity Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 text-center py-8">
              Your recent submissions and updates will appear here
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
