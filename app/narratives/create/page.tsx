'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function CreateNarrativePage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    activity: '',
    narrative: '',
    learnings: '',
    skills: '',
    challenges: '',
    solutions: '',
    reflection: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const validateForm = () => {
    if (!formData.date) {
      setError('Please select a date')
      return false
    }
    if (!formData.narrative || formData.narrative.trim().length < 50) {
      setError('Narrative must be at least 50 characters long')
      return false
    }
    return true
  }

  const handleSubmit = async (isDraft: boolean) => {
    setError('')
    setSuccess('')

    if (!isDraft && !validateForm()) {
      return
    }

    if (isDraft) {
      setIsSavingDraft(true)
    } else {
      setIsSubmitting(true)
    }

    try {
      // Combine all fields into content
      const content = `
**Activity:** ${formData.activity || 'Not specified'}

**Narrative:**
${formData.narrative}

**What I Learned:**
${formData.learnings || 'Not specified'}

**Skills Demonstrated:**
${formData.skills || 'Not specified'}

**Challenges Encountered:**
${formData.challenges || 'Not specified'}

**How I Handled It:**
${formData.solutions || 'Not specified'}

**Reflection:**
${formData.reflection || 'Not specified'}
      `.trim()

      const response = await fetch('/api/narratives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date(formData.date).toISOString(),
          content: content,
          isDraft: isDraft,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save narrative')
      }

      const data = await response.json()
      
      if (isDraft) {
        setSuccess('Draft saved successfully!')
        setTimeout(() => router.push('/narratives'), 1500)
      } else {
        setSuccess('Narrative submitted successfully!')
        setTimeout(() => router.push('/narratives'), 1500)
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setIsSubmitting(false)
      setIsSavingDraft(false)
    }
  }

  const characterCount = formData.narrative.length
  const minCharacters = 50

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">New Narrative Assessment</h1>
              <p className="text-sm text-gray-600 mt-1">Document your daily work immersion activities</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Narrative Details</CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              All fields marked with * are required. Your submission timestamp will be automatically recorded.
            </p>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Activity *
                </label>
                <Input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                  required
                  className="max-w-xs"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Select the date when this activity occurred
                </p>
              </div>

              {/* Activity Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activity/Task Title
                </label>
                <Input
                  type="text"
                  name="activity"
                  value={formData.activity}
                  onChange={handleChange}
                  placeholder="e.g., Customer Service Training, Data Entry, File Organization"
                  maxLength={200}
                />
              </div>

              {/* Main Narrative */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Narrative Description *
                </label>
                <textarea
                  name="narrative"
                  value={formData.narrative}
                  onChange={handleChange}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Describe what you did today, the tasks you completed, and your observations. Be detailed and specific."
                  required
                />
                <div className="flex justify-between text-xs mt-1">
                  <span className={characterCount < minCharacters ? 'text-red-600' : 'text-gray-500'}>
                    Minimum {minCharacters} characters required
                  </span>
                  <span className="text-gray-500">
                    {characterCount} characters
                  </span>
                </div>
              </div>

              {/* Learnings */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What I Learned Today
                </label>
                <textarea
                  name="learnings"
                  value={formData.learnings}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="What new knowledge or insights did you gain?"
                />
              </div>

              {/* Skills */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skills Demonstrated/Developed
                </label>
                <textarea
                  name="skills"
                  value={formData.skills}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="What skills did you use or develop? (e.g., communication, problem-solving, technical skills)"
                />
              </div>

              {/* Challenges */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Challenges Encountered
                </label>
                <textarea
                  name="challenges"
                  value={formData.challenges}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="What difficulties or obstacles did you face?"
                />
              </div>

              {/* Solutions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How I Addressed the Challenges
                </label>
                <textarea
                  name="solutions"
                  value={formData.solutions}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="How did you overcome the challenges? Who helped you?"
                />
              </div>

              {/* Reflection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Personal Reflection
                </label>
                <textarea
                  name="reflection"
                  value={formData.reflection}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Your thoughts, feelings, and insights about today's experience"
                />
              </div>

              {/* Important Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Important:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Your submission date and time will be automatically recorded</li>
                      <li>You cannot modify the timestamp after submission</li>
                      <li>Save as draft if you need to continue later</li>
                      <li>Submitted narratives will be reviewed by your supervisor</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  type="button"
                  onClick={() => handleSubmit(true)}
                  variant="outline"
                  isLoading={isSavingDraft}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  Save as Draft
                </Button>
                <Button
                  type="button"
                  onClick={() => handleSubmit(false)}
                  isLoading={isSubmitting}
                  disabled={isSavingDraft || characterCount < minCharacters}
                  className="flex-1"
                >
                  Submit Narrative
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Guidelines Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Writing Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex gap-2">
                <span className="text-primary-600">•</span>
                <span>Be specific and detailed about your activities</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary-600">•</span>
                <span>Use complete sentences and proper grammar</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary-600">•</span>
                <span>Focus on what you learned and how you contributed</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary-600">•</span>
                <span>Reflect on your experiences honestly and thoughtfully</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary-600">•</span>
                <span>Minimum 50 characters for the main narrative section</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
