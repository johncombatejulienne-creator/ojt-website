'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface Strand {
  id: string
  name: string
  code: string
}

interface Section {
  id: string
  name: string
  gradeLevel: number
  strandId: string
}

export default function CompleteProfilePage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [useCustomSection, setUseCustomSection] = useState(false)
  
  const [strands, setStrands] = useState<Strand[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [filteredSections, setFilteredSections] = useState<Section[]>([])
  
  const [formData, setFormData] = useState({
    studentId: '',
    gradeLevel: 12,
    strandId: '',
    sectionId: '',
    customSection: '',
    company: '',
    course: '',
  })

  useEffect(() => {
    fetchStrands()
  }, [])

  useEffect(() => {
    if (formData.strandId) {
      fetchSections(formData.strandId)
    }
  }, [formData.strandId])

  const fetchStrands = async () => {
    try {
      const response = await fetch('/api/strands')
      if (response.ok) {
        const data = await response.json()
        setStrands(data.strands || [])
      }
    } catch (error) {
      console.error('Error fetching strands:', error)
    }
  }

  const fetchSections = async (strandId: string) => {
    try {
      const response = await fetch(`/api/sections?strandId=${strandId}`)
      if (response.ok) {
        const data = await response.json()
        setSections(data.sections || [])
        setFilteredSections(data.sections || [])
      }
    } catch (error) {
      console.error('Error fetching sections:', error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Reset section when strand changes
      ...(name === 'strandId' ? { sectionId: '' } : {})
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    // Validation
    if (!formData.studentId || !formData.strandId) {
      setError('Please fill in all required fields')
      setIsSubmitting(false)
      return
    }

    // Check if section is provided (either from dropdown or custom input)
    if (!useCustomSection && !formData.sectionId) {
      setError('Please select a section or enter a custom section name')
      setIsSubmitting(false)
      return
    }

    if (useCustomSection && !formData.customSection.trim()) {
      setError('Please enter your section name')
      setIsSubmitting(false)
      return
    }

    try {
      const submissionData = {
        ...formData,
        // If using custom section, create it or find existing one
        sectionName: useCustomSection ? formData.customSection : undefined,
      }

      const response = await fetch('/api/students/complete-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to complete registration')
      }

      // Success - redirect to dashboard
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'An error occurred')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <Card className="max-w-3xl w-full shadow-2xl">
        <CardHeader className="space-y-3 pb-6">
          <CardTitle className="text-3xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Complete Your Profile
          </CardTitle>
          <p className="text-gray-600 text-base leading-relaxed">
            Please provide your information to access the Work Immersion Program
          </p>
        </CardHeader>
        <CardContent className="space-y-8">
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Student Information */}
            <div className="space-y-5">
              <h3 className="font-semibold text-gray-900 flex items-center gap-3 text-lg">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                Student Information
              </h3>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Student ID Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleChange}
                  placeholder="e.g., 2024-12345 or 202412345"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base"
                />
                <p className="text-xs text-gray-500 leading-relaxed">
                  Enter your school-assigned student ID number
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={session?.user?.email || ''}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 text-base"
                />
                <p className="text-xs text-gray-500 leading-relaxed">
                  📧 This is your registered Gmail account (cannot be changed)
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={session?.user?.name || ''}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 text-base"
                />
                <p className="text-xs text-gray-500 leading-relaxed">
                  👤 From your Google account (can be edited later in profile settings)
                </p>
              </div>
            </div>

            {/* Academic Information */}
            <div className="space-y-5 pt-6 border-t-2 border-gray-100">
              <h3 className="font-semibold text-gray-900 flex items-center gap-3 text-lg">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                Academic Information
              </h3>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Grade Level <span className="text-red-500">*</span>
                </label>
                <select
                  name="gradeLevel"
                  value={formData.gradeLevel}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base"
                >
                  <option value="11">Grade 11</option>
                  <option value="12">Grade 12</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Strand <span className="text-red-500">*</span>
                </label>
                <select
                  name="strandId"
                  value={formData.strandId}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base"
                >
                  <option value="">Select your strand</option>
                  {strands.map((strand) => (
                    <option key={strand.id} value={strand.id}>
                      {strand.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section *
                </label>
                
                {/* Toggle between dropdown and custom input */}
                <div className="flex gap-4 mb-3">
                  <button
                    type="button"
                    onClick={() => setUseCustomSection(false)}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-300 ${
                      !useCustomSection
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Select from List
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseCustomSection(true)}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-300 ${
                      useCustomSection
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Type My Section
                  </button>
                </div>

                {/* Dropdown for existing sections */}
                {!useCustomSection && (
                  <select
                    name="sectionId"
                    value={formData.sectionId}
                    onChange={handleChange}
                    required={!useCustomSection}
                    disabled={!formData.strandId}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 text-base"
                  >
                    <option value="">
                      {formData.strandId ? 'Select your section' : 'Select a strand first'}
                    </option>
                    {filteredSections.map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.name}
                      </option>
                    ))}
                  </select>
                )}

                {/* Custom input for typing section name */}
                {useCustomSection && (
                  <div>
                    <input
                      type="text"
                      name="customSection"
                      value={formData.customSection}
                      onChange={handleChange}
                      placeholder="e.g., Section A, Einstein, 12-STEM-1"
                      required={useCustomSection}
                      disabled={!formData.strandId}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 text-base"
                    />
                    <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                      💡 Type the name of your section. This will be visible to your teacher.
                    </p>
                  </div>
                )}
                
                {formData.strandId && filteredSections.length === 0 && !useCustomSection && (
                  <p className="text-xs text-yellow-600 mt-2 leading-relaxed">
                    ⚠️ No sections available yet. Click "Type My Section" to enter your section name.
                  </p>
                )}
              </div>
            </div>

            {/* Work Immersion Information */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Work Immersion Details (Optional)
              </h3>

              <Input
                label="Company/Establishment"
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="e.g., ABC Company"
              />

              <Input
                label="Course/Program"
                type="text"
                name="course"
                value={formData.course}
                onChange={handleChange}
                placeholder="e.g., Computer Science"
              />

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-2">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-blue-800">
                    You can update company and course information later from your profile settings
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                isLoading={isSubmitting}
                disabled={isSubmitting}
                className="w-full"
              >
                Complete Registration
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
