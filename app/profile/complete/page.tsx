'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

/* â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
interface Strand  { id: string; name: string; code: string }
interface Section { id: string; name: string; gradeLevel: number; strandId: string }

/* â”€â”€â”€ Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export default function CompleteProfilePage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  const [submitting,  setSubmitting]  = useState(false)
  const [error,       setError]       = useState('')
  const [strands,     setStrands]     = useState<Strand[]>([])
  const [sections,    setSections]    = useState<Section[]>([])
  const [useCustomSection, setUseCustomSection] = useState(false)
  const errorRef = useRef<HTMLDivElement>(null)

  const [form, setForm] = useState({
    studentId:     '',
    gradeLevel:    12,
    strandId:      '',
    sectionId:     '',
    customSection: '',
    company:       '',
    course:        '',
  })

  /* â”€â”€ Redirect unauthenticated â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  /* â”€â”€ Load strands â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  useEffect(() => {
    let cancelled = false
    fetch('/api/strands')
      .then((r) => r.json())
      .then((data) => { if (!cancelled) setStrands(data.strands ?? []) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  /* â”€â”€ Load sections when strand changes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  useEffect(() => {
    if (!form.strandId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSections([])
      return
    }
    let cancelled = false
    fetch(`/api/sections?strandId=${form.strandId}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setSections(d.sections ?? []) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [form.strandId])

  /* â”€â”€ Scroll to error â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [error])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'strandId' ? { sectionId: '' } : {}),
    }))
    if (error) setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Client-side validation
    if (!form.studentId.trim())  { setError('Student ID is required.'); return }
    if (!form.strandId)          { setError('Please select your strand.'); return }
    if (!useCustomSection && !form.sectionId) {
      setError('Please select a section or type your section name.'); return
    }
    if (useCustomSection && !form.customSection.trim()) {
      setError('Please enter your section name.'); return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/students/complete-registration', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          sectionName: useCustomSection ? form.customSection : undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Registration failed. Please try again.')
      }

      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred.')
    } finally {
      setSubmitting(false)
    }
  }

  /* â”€â”€ Loading â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loadingâ€¦</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-4">

      {/* Back to login */}
      <button
        onClick={() => router.push('/login')}
        className="fixed top-4 left-4 z-50 flex items-center gap-2 bg-white/80 hover:bg-white backdrop-blur-sm px-3 py-2 rounded-xl shadow-md transition-all text-sm font-medium text-gray-700 hover:text-gray-900"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Login
      </button>

      <div className="max-w-2xl mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Complete Your Profile
          </h1>
          <p className="text-gray-500 text-sm mt-2 max-w-xs mx-auto">
            Fill in your details to access the Work Immersion Program.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div
            ref={errorRef}
            role="alert"
            className="mb-5 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 animate-slide-down"
          >
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-5">

            {/* â”€â”€ Student Info â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <Card>
              <CardContent padding="lg">
                <SectionHeading
                  icon="ðŸ‘¤"
                  title="Student Information"
                />
                <div className="space-y-4 mt-4">

                  <Input
                    label="Student ID Number"
                    name="studentId"
                    value={form.studentId}
                    onChange={handleChange}
                    placeholder="e.g. 2024-12345"
                    required
                    helperText="Your school-assigned student ID"
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={session?.user?.email ?? ''}
                      disabled
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-400 mt-1.5">
                      ðŸ“§ From your Google account â€” cannot be changed.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={session?.user?.name ?? ''}
                      disabled
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-400 mt-1.5">
                      ðŸ‘¤ Can be updated later in your profile settings.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* â”€â”€ Academic Info â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <Card>
              <CardContent padding="lg">
                <SectionHeading icon="ðŸ“š" title="Academic Information" />
                <div className="space-y-4 mt-4">

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Grade Level <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="gradeLevel"
                      value={form.gradeLevel}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white appearance-none"
                    >
                      <option value={11}>Grade 11</option>
                      <option value={12}>Grade 12</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Strand <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="strandId"
                      value={form.strandId}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white appearance-none"
                    >
                      <option value="">Select your strand</option>
                      {strands.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Section toggle */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Section <span className="text-red-500">*</span>
                    </label>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {(['list', 'custom'] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setUseCustomSection(mode === 'custom')}
                          className={`py-2 px-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                            (mode === 'custom') === useCustomSection
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {mode === 'list' ? 'Select from List' : 'Type My Section'}
                        </button>
                      ))}
                    </div>

                    {!useCustomSection ? (
                      <>
                        <select
                          name="sectionId"
                          value={form.sectionId}
                          onChange={handleChange}
                          disabled={!form.strandId}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white appearance-none disabled:bg-gray-50 disabled:text-gray-400"
                        >
                          <option value="">
                            {form.strandId ? 'Select your section' : 'Select a strand first'}
                          </option>
                          {sections.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                        {form.strandId && sections.length === 0 && (
                          <p className="text-xs text-yellow-600 mt-1.5">
                            âš ï¸ No sections available yet â€” try &ldquo;Type My Section&rdquo; above.
                          </p>
                        )}
                      </>
                    ) : (
                      <Input
                        name="customSection"
                        value={form.customSection}
                        onChange={handleChange}
                        placeholder="e.g. Section A, Einstein, 12-STEM-1"
                        disabled={!form.strandId}
                        helperText="Your section name as it appears on your schedule."
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* â”€â”€ Work Immersion Details â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <Card>
              <CardContent padding="lg">
                <SectionHeading icon="ðŸ¢" title="Work Immersion Details" subtitle="Optional â€” you can add these later" />
                <div className="space-y-4 mt-4">
                  <Input
                    label="Company / Establishment"
                    name="company"
                    value={form.company}
                    onChange={handleChange}
                    placeholder="e.g. ABC Company"
                  />
                  <Input
                    label="Course / Program"
                    name="course"
                    value={form.course}
                    onChange={handleChange}
                    placeholder="e.g. Computer Science"
                  />
                </div>
              </CardContent>
            </Card>

            {/* â”€â”€ Submit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <Button
              type="submit"
              isLoading={submitting}
              disabled={submitting}
              fullWidth
              size="lg"
              className="rounded-2xl"
            >
              {submitting ? 'Completing registrationâ€¦' : 'Complete Registration'}
            </Button>

          </div>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6 pb-8">
          By continuing, you agree to the terms of the Work Immersion Program.
        </p>
      </div>
    </div>
  )
}

/* â”€â”€â”€ SectionHeading sub-component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function SectionHeading({
  icon,
  title,
  subtitle,
}: {
  icon: string
  title: string
  subtitle?: string
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
        {icon}
      </div>
      <div>
        <h2 className="font-semibold text-gray-900 text-sm">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}

