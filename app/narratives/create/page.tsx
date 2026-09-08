'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import PageHeader from '@/components/PageHeader'

const MIN_CHARS = 50

interface FormData {
  date: string
  activity: string
  narrative: string
  learnings: string
  skills: string
  challenges: string
  solutions: string
  reflection: string
}

function TextArea({
  label,
  name,
  value,
  onChange,
  rows = 4,
  placeholder,
  required,
  hint,
}: {
  label: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  rows?: number
  placeholder?: string
  required?: boolean
  hint?: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow resize-y"
      />
      {hint && <div className="mt-1">{hint}</div>}
    </div>
  )
}

export default function CreateNarrativePage() {
  const router  = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState<FormData>({
    date:        new Date().toISOString().split('T')[0],
    activity:    '',
    narrative:   '',
    learnings:   '',
    skills:      '',
    challenges:  '',
    solutions:   '',
    reflection:  '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (isDraft: boolean) => {
    setError('')
    setSuccess('')

    if (!isDraft) {
      if (!form.date) { setError('Please select a date.'); return }
      if (form.narrative.trim().length < MIN_CHARS) {
        setError(`Narrative must be at least ${MIN_CHARS} characters.`)
        return
      }
    }

    if (isDraft) setSavingDraft(true)
    else          setSubmitting(true)

    try {
      const content = `
**Activity:** ${form.activity || 'Not specified'}

**Narrative:**
${form.narrative}

**What I Learned:**
${form.learnings || 'Not specified'}

**Skills Demonstrated:**
${form.skills || 'Not specified'}

**Challenges Encountered:**
${form.challenges || 'Not specified'}

**How I Handled It:**
${form.solutions || 'Not specified'}

**Reflection:**
${form.reflection || 'Not specified'}
      `.trim()

      const res = await fetch('/api/narratives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date:    new Date(form.date).toISOString(),
          content,
          isDraft,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to save narrative')
      }

      setSuccess(isDraft ? 'Draft saved successfully!' : 'Narrative submitted successfully!')
      setTimeout(() => router.push('/narratives'), 1400)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSubmitting(false)
      setSavingDraft(false)
    }
  }

  const charCount = form.narrative.length
  const isReady   = charCount >= MIN_CHARS

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="New Narrative Assessment"
        subtitle="Document your daily work immersion activities"
        backHref="/narratives"
        backLabel="Narratives"
      />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5">

        {/* Feedback banners */}
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
            </svg>
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
            {success}
          </div>
        )}

        {/* Main form card */}
        <Card>
          <CardHeader padding="lg" divider>
            <CardTitle level={3}>Narrative Details</CardTitle>
            <p className="text-xs text-gray-500 mt-1">
              Fields marked <span className="text-red-500">*</span> are required. Submission time is automatically recorded.
            </p>
          </CardHeader>
          <CardContent padding="lg">
            <div className="space-y-5">
              {/* Date */}
              <div className="max-w-xs">
                <Input
                  label="Date of Activity"
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                  required
                  helperText="When did this activity occur?"
                />
              </div>

              {/* Activity title */}
              <Input
                label="Activity / Task Title"
                type="text"
                name="activity"
                value={form.activity}
                onChange={handleChange}
                placeholder="e.g. Customer Service Training, Data Entry"
                maxLength={200}
              />

              {/* Main narrative */}
              <TextArea
                label="Narrative Description"
                name="narrative"
                value={form.narrative}
                onChange={handleChange}
                rows={8}
                placeholder="Describe what you did today, the tasks you completed, and your observations. Be detailed and specific."
                required
                hint={
                  <div className="flex justify-between text-xs">
                    <span className={charCount < MIN_CHARS ? 'text-red-500' : 'text-green-600'}>
                      {charCount < MIN_CHARS
                        ? `${MIN_CHARS - charCount} more characters needed`
                        : '✓ Minimum reached'}
                    </span>
                    <span className="text-gray-400">{charCount} chars</span>
                  </div>
                }
              />

              <TextArea
                label="What I Learned Today"
                name="learnings"
                value={form.learnings}
                onChange={handleChange}
                rows={3}
                placeholder="What new knowledge or insights did you gain?"
              />

              <TextArea
                label="Skills Demonstrated / Developed"
                name="skills"
                value={form.skills}
                onChange={handleChange}
                rows={3}
                placeholder="What skills did you use or develop?"
              />

              <TextArea
                label="Challenges Encountered"
                name="challenges"
                value={form.challenges}
                onChange={handleChange}
                rows={3}
                placeholder="What difficulties or obstacles did you face?"
              />

              <TextArea
                label="How I Addressed the Challenges"
                name="solutions"
                value={form.solutions}
                onChange={handleChange}
                rows={3}
                placeholder="How did you overcome the challenges? Who helped you?"
              />

              <TextArea
                label="Personal Reflection"
                name="reflection"
                value={form.reflection}
                onChange={handleChange}
                rows={4}
                placeholder="Your thoughts, feelings, and insights about today's experience"
              />

              {/* Notice */}
              <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
                <svg className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <ul className="space-y-1 list-disc list-inside leading-relaxed">
                  <li>Submission date and time are automatically recorded</li>
                  <li>You cannot change the timestamp after submission</li>
                  <li>Save as draft if you need to continue later</li>
                  <li>Submitted narratives will be reviewed by your supervisor</li>
                </ul>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  type="button"
                  onClick={() => handleSubmit(true)}
                  variant="outline"
                  isLoading={savingDraft}
                  disabled={submitting}
                  className="flex-1"
                  size="lg"
                >
                  Save as Draft
                </Button>
                <Button
                  type="button"
                  onClick={() => handleSubmit(false)}
                  isLoading={submitting}
                  disabled={savingDraft || !isReady}
                  className="flex-1"
                  size="lg"
                >
                  Submit Narrative
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Guidelines */}
        <Card>
          <CardHeader padding="lg" divider>
            <CardTitle level={3} className="text-base">Writing Guidelines</CardTitle>
          </CardHeader>
          <CardContent padding="lg">
            <ul className="space-y-2 text-sm text-gray-600">
              {[
                'Be specific and detailed about your activities',
                'Use complete sentences and proper grammar',
                'Focus on what you learned and how you contributed',
                'Reflect on your experiences honestly and thoughtfully',
                `Minimum ${MIN_CHARS} characters for the main narrative section`,
              ].map((tip) => (
                <li key={tip} className="flex gap-2">
                  <span className="text-purple-500 flex-shrink-0 mt-0.5">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
