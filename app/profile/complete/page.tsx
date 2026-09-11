'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface Strand  { id: string; name: string }
interface Section { id: string; name: string; gradeLevel: number; strandId: string }

export default function CompleteProfilePage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  const [submitting,       setSubmitting]       = useState(false)
  const [error,            setError]            = useState('')
  const [strands,          setStrands]          = useState<Strand[]>([])
  const [sections,         setSections]         = useState<Section[]>([])
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

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    fetch('/api/strands').then(r => r.json()).then(d => setStrands(d.strands ?? [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (!form.strandId) { setSections([]); return }
    fetch(`/api/sections?strandId=${form.strandId}`)
      .then(r => r.json()).then(d => setSections(d.sections ?? [])).catch(() => {})
  }, [form.strandId])

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [error])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value, ...(name === 'strandId' ? { sectionId: '' } : {}) }))
    if (error) setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.studentId.trim())  { setError('Student ID is required.'); return }
    if (!form.strandId)          { setError('Please select your strand.'); return }
    if (!useCustomSection && !form.sectionId) {
      setError('Please select a section or click "Type My Section" to enter one.'); return
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
          sectionName: useCustomSection ? form.customSection.trim() : undefined,
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

  if (status === 'loading') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
      <div style={{ width: 44, height: 44, border: '4px solid #E5E7EB', borderTopColor: '#F97316', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const inp: React.CSSProperties = {
    width: '100%', padding: '11px 14px', border: '1.5px solid #E5E7EB',
    borderRadius: 10, fontSize: 14, outline: 'none', background: 'white',
    fontFamily: 'inherit', boxSizing: 'border-box', color: '#111827',
  }
  const label: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 700, color: '#374151',
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em',
  }
  const card: React.CSSProperties = {
    background: 'white', borderRadius: 16, border: '1px solid #E5E7EB',
    padding: '20px 24px', marginBottom: 16, boxSizing: 'border-box',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  }
  const sectionTitle: React.CSSProperties = {
    fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 16,
    paddingBottom: 10, borderBottom: '1px solid #F3F4F6',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', padding: '32px 16px 64px', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} input:focus,select:focus,textarea:focus{border-color:#F97316 !important; box-shadow:0 0 0 3px rgba(249,115,22,0.1);}`}</style>

      {/* Back button */}
      <button onClick={() => router.push('/login')} style={{
        display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6B7280',
        background: 'white', border: '1px solid #E5E7EB', borderRadius: 10,
        padding: '7px 14px', cursor: 'pointer', marginBottom: 24, fontFamily: 'inherit',
      }}>
        <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Login
      </button>

      <div style={{ maxWidth: 560, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18, margin: '0 auto 16px',
            background: 'linear-gradient(135deg,#F97316,#FBBF24)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(249,115,22,0.3)',
          }}>
            <svg style={{ width: 32, height: 32, color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#111827', margin: '0 0 6px' }}>Complete Your Profile</h1>
          <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>Fill in your details to access the Work Immersion Program.</p>
        </div>

        {/* Error */}
        {error && (
          <div ref={errorRef} style={{
            display: 'flex', gap: 10, padding: '12px 16px', marginBottom: 16,
            background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12,
            fontSize: 13, color: '#DC2626',
          }}>
            <svg style={{ width: 16, height: 16, flexShrink: 0, marginTop: 1 }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* Student Info */}
          <div style={card}>
            <p style={sectionTitle}>Student Information</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              <div>
                <label style={label}>Student ID Number <span style={{ color: '#EF4444' }}>*</span></label>
                <input name="studentId" value={form.studentId} onChange={handleChange}
                  placeholder="e.g. 2024-12345 or any school ID" style={inp} />
                <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Type any ID — no length limit</p>
              </div>

              <div>
                <label style={label}>Email Address</label>
                <input type="email" value={session?.user?.email ?? ''} disabled
                  style={{ ...inp, background: '#F9FAFB', color: '#9CA3AF', cursor: 'not-allowed' }} />
                <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>From your Google account — cannot be changed.</p>
              </div>

              <div>
                <label style={label}>Full Name</label>
                <input type="text" value={session?.user?.name ?? ''} disabled
                  style={{ ...inp, background: '#F9FAFB', color: '#9CA3AF', cursor: 'not-allowed' }} />
                <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Can be updated later in your profile settings.</p>
              </div>
            </div>
          </div>

          {/* Academic Info */}
          <div style={card}>
            <p style={sectionTitle}>Academic Information</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              <div>
                <label style={label}>Grade Level <span style={{ color: '#EF4444' }}>*</span></label>
                <select name="gradeLevel" value={form.gradeLevel} onChange={handleChange} style={inp}>
                  <option value={11}>Grade 11</option>
                  <option value={12}>Grade 12</option>
                </select>
              </div>

              <div>
                <label style={label}>Strand <span style={{ color: '#EF4444' }}>*</span></label>
                <select name="strandId" value={form.strandId} onChange={handleChange} style={inp}>
                  <option value="">Select your strand</option>
                  {strands.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {/* Section — toggle between pick list and free-type */}
              <div>
                <label style={label}>Section <span style={{ color: '#EF4444' }}>*</span></label>

                {/* Toggle buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                  {(['list', 'custom'] as const).map(mode => (
                    <button key={mode} type="button"
                      onClick={() => setUseCustomSection(mode === 'custom')}
                      style={{
                        padding: '8px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                        border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                        background: (mode === 'custom') === useCustomSection
                          ? 'linear-gradient(135deg,#F97316,#FBBF24)'
                          : '#F3F4F6',
                        color: (mode === 'custom') === useCustomSection ? 'white' : '#6B7280',
                      }}>
                      {mode === 'list' ? 'Select from List' : 'Type My Section'}
                    </button>
                  ))}
                </div>

                {!useCustomSection ? (
                  <>
                    <select name="sectionId" value={form.sectionId} onChange={handleChange}
                      disabled={!form.strandId} style={{ ...inp, color: form.sectionId ? '#111827' : '#9CA3AF' }}>
                      <option value="">{form.strandId ? 'Select your section' : 'Select a strand first'}</option>
                      {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    {form.strandId && sections.length === 0 && (
                      <p style={{ fontSize: 12, color: '#D97706', marginTop: 6 }}>
                        No sections available yet — click &quot;Type My Section&quot; above to enter yours.
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <input name="customSection" value={form.customSection} onChange={handleChange}
                      placeholder="e.g. Einstein, 12-STEM-1, Section A"
                      disabled={!form.strandId}
                      style={{ ...inp, color: form.customSection ? '#111827' : '#9CA3AF' }} />
                    <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
                      Type your section name exactly as it appears on your schedule. If another student types the same name, you will be grouped together.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Work Immersion Details */}
          <div style={card}>
            <p style={sectionTitle}>Work Immersion Details <span style={{ fontSize: 12, fontWeight: 400, color: '#9CA3AF' }}>(optional)</span></p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={label}>Company / Establishment</label>
                <input name="company" value={form.company} onChange={handleChange}
                  placeholder="e.g. ABC Company" style={inp} />
              </div>
              <div>
                <label style={label}>Course / Program</label>
                <input name="course" value={form.course} onChange={handleChange}
                  placeholder="e.g. Computer Science" style={inp} />
              </div>
            </div>
          </div>

          {/* Submit */}
          <button type="submit" disabled={submitting} style={{
            width: '100%', padding: '14px', borderRadius: 12, fontSize: 15, fontWeight: 700,
            background: submitting ? '#FED7AA' : 'linear-gradient(135deg,#F97316,#EA580C)',
            color: 'white', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', boxShadow: submitting ? 'none' : '0 4px 14px rgba(249,115,22,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            {submitting ? (
              <>
                <div style={{ width: 18, height: 18, border: '3px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                Completing registration...
              </>
            ) : 'Complete Registration'}
          </button>

          <p style={{ textAlign: 'center', fontSize: 12, color: '#9CA3AF', marginTop: 16 }}>
            By continuing, you agree to the terms of the Work Immersion Program.
          </p>
        </form>
      </div>
    </div>
  )
}
