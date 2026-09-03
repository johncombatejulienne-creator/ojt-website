'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface Strand {
  id: string
  name: string
}

interface Section {
  id: string
  name: string
  gradeLevel: number
}

export default function EditProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [strands, setStrands] = useState<Strand[]>([])
  const [sections, setSections] = useState<Section[]>([])
  
  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    strandId: '',
    sectionId: '',
    company: '',
    course: '',
    gradeLevel: 11,
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch current profile
        const profileRes = await fetch('/api/students/profile')
        if (profileRes.ok) {
          const profileData = await profileRes.json()
          const student = profileData.student
          setFormData({
            name: student.name || '',
            studentId: student.studentId || '',
            strandId: student.strandId || '',
            sectionId: student.sectionId || '',
            company: student.company || '',
            course: student.course || '',
            gradeLevel: student.gradeLevel || 11,
          })
        }

        // Fetch strands
        const strandsRes = await fetch('/api/strands')
        if (strandsRes.ok) {
          const strandsData = await strandsRes.json()
          setStrands(strandsData.strands || [])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (session?.user) {
      fetchData()
    }
  }, [session])

  useEffect(() => {
    const fetchSections = async () => {
      if (formData.strandId) {
        try {
          const res = await fetch(`/api/sections?strandId=${formData.strandId}`)
          if (res.ok) {
            const data = await res.json()
            setSections(data.sections || [])
          }
        } catch (error) {
          console.error('Error fetching sections:', error)
        }
      }
    }

    fetchSections()
  }, [formData.strandId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch('/api/students/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        alert('Profile updated successfully!')
        router.push('/dashboard')
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
            className="mb-4"
          >
            ← Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
          <p className="text-gray-600 mt-2">Update your personal information</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Juan Dela Cruz"
                />
              </div>

              {/* Student ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student ID <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  required
                  placeholder="2024-12345"
                />
                <p className="text-sm text-gray-500 mt-1">Your school-assigned student ID</p>
              </div>

              {/* Grade Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grade Level <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.gradeLevel}
                  onChange={(e) => setFormData({ ...formData, gradeLevel: parseInt(e.target.value) })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value={11}>Grade 11</option>
                  <option value={12}>Grade 12</option>
                </select>
              </div>

              {/* Strand */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Strand <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.strandId}
                  onChange={(e) => {
                    setFormData({ ...formData, strandId: e.target.value, sectionId: '' })
                    setSections([])
                  }}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select Strand</option>
                  {strands.map((strand) => (
                    <option key={strand.id} value={strand.id}>
                      {strand.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.sectionId}
                  onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
                  required
                  disabled={!formData.strandId || sections.length === 0}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select Section</option>
                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.name}
                    </option>
                  ))}
                </select>
                {!formData.strandId && (
                  <p className="text-sm text-gray-500 mt-1">Please select a strand first</p>
                )}
              </div>

              {/* Course */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course (Optional)
                </label>
                <Input
                  type="text"
                  value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                  placeholder="Your intended college course"
                />
              </div>

              {/* Company */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company/Establishment (Optional)
                </label>
                <Input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Where you're doing your immersion"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Email Info */}
        <Card className="mt-6">
          <CardContent className="py-4">
            <p className="text-sm text-gray-600">
              <strong>Email:</strong> {session?.user?.email}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Your email cannot be changed. It's linked to your Google account.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
