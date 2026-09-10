'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Input } from '@/components/ui/Input'
import AppShell from '@/components/AppShell'
import VerificationCamera from '@/components/VerificationCamera'

const MIN = 50

/* ─── Step types ─────────────────────────────────────────── */
type Step = 'form' | 'camera' | 'done'

/* ─── Field ──────────────────────────────────────────────── */
function Field({ label, name, value, onChange, rows = 4, placeholder, required, hint }: {
  label: string; name: string; value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  rows?: number; placeholder?: string; required?: boolean; hint?: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={name} style={{
        display: 'block', fontSize: 11, fontWeight: 700,
        color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6,
      }}>
        {label}{required && <span style={{ color: '#EF4444', marginLeft: 4 }}>*</span>}
      </label>
      <textarea id={name} name={name} value={value} onChange={onChange} rows={rows}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '12px 16px', border: '1.5px solid #E5E7EB',
          borderRadius: 12, fontSize: 14, background: 'white', resize: 'vertical',
          outline: 'none', fontFamily: 'inherit', lineHeight: 1.6,
          boxSizing: 'border-box', color: '#111827', transition: 'border-color 0.15s',
        }}
        onFocus={e => { e.target.style.borderColor = '#F97316' }}
        onBlur={e => { e.target.style.borderColor = '#E5E7EB' }}
      />
      {hint}
    </div>
  )
}

/* ─── Page ───────────────────────────────────────────────── */
export default function CreateNarrativePage() {
  const router  = useRouter()
  const { data: session } = useSession()

  const [step,         setStep]         = useState<Step>('form')
  const [submitting,   setSubmitting]   = useState(false)
  const [savingDraft,  setSavingDraft]  = useState(false)
  const [uploadingPic, setUploadingPic] = useState(false)
  const [error,        setError]        = useState('')

  // Saved narrative ID (after first save)
  const savedNarrativeId = useRef<string | null>(null)

  const [form, setForm] = useState({
    date:       new Date().toISOString().split('T')[0],
    activity:   '', narrative: '', learnings: '',
    skills: '', challenges: '', solutions: '', reflection: '',
  })

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
    setError('')
  }

  /* ── Save draft ─────────────────────────────────────────── */
  const handleDraft = async () => {
    if (savingDraft || submitting) return
    setSavingDraft(true); setError('')
    try {
      const content = buildContent()
      const res = await fetch('/api/narratives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: new Date(form.date).toISOString(), content, isDraft: true }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.detail ?? d.error ?? 'Failed to save draft')
      savedNarrativeId.current = d.narrative.id
      router.push('/narratives')
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error') }
    finally { setSavingDraft(false) }
  }

  /* ── Submit narrative → go to camera ────────────────────── */
  const handleSubmitToCamera = async () => {
    if (submitting || savingDraft) return
    setError('')
    if (form.narrative.trim().length < MIN) {
      setError(`Narrative needs at least ${MIN} characters.`); return
    }
    setSubmitting(true)
    try {
      const content = buildContent()
      const res = await fetch('/api/narratives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: new Date(form.date).toISOString(), content, isDraft: false }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.detail ?? d.error ?? 'Submission failed')
      savedNarrativeId.current = d.narrative.id
      setStep('camera')
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error') }
    finally { setSubmitting(false) }
  }

  /* ── Camera captured → upload verification photo ────────── */
  const handlePhotoCapture = async (photoDataUrl: string) => {
    if (!savedNarrativeId.current) { setStep('done'); return }
    setUploadingPic(true)
    try {
      await fetch(`/api/narratives/${savedNarrativeId.current}/verification-photo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoDataUrl }),
      })
    } catch { /* non-critical — narrative was already saved */ }
    finally {
      setUploadingPic(false)
      setStep('done')
    }
  }

  const buildContent = () => [
    `**Activity:** ${form.activity || 'Not specified'}`,
    `\n**Narrative:**\n${form.narrative}`,
    `\n**What I Learned:**\n${form.learnings || 'Not specified'}`,
    `\n**Skills Demonstrated:**\n${form.skills || 'Not specified'}`,
    `\n**Challenges:**\n${form.challenges || 'Not specified'}`,
    `\n**How I Handled It:**\n${form.solutions || 'Not specified'}`,
    `\n**Reflection:**\n${form.reflection || 'Not specified'}`,
  ].join('\n')

  const chars = form.narrative.length
  const ready = chars >= MIN
  const studentName = session?.user?.name ?? session?.user?.email?.split('@')[0] ?? 'Student'

  /* ─── STEP: DONE ─────────────────────────────────────────── */
  if (step === 'done') {
    return (
      <AppShell>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center', padding: '48px 16px' }}>
          {/* Success icon */}
          <div style={{ width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg,#10B981,#059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: '0 8px 24px rgba(16,185,129,0.4)' }}>
            <svg style={{ width: 40, height: 40, color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#111827', margin: '0 0 10px' }}>
            Narrative Submitted!
          </h1>
          <p style={{ fontSize: 15, color: '#6B7280', margin: '0 0 32px', lineHeight: 1.6 }}>
            Your narrative has been saved and the verification photo has been recorded.
            Your teacher can now review your submission.
          </p>

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {savedNarrativeId.current && (
              <a href={`/api/narratives/${savedNarrativeId.current}/download`} download
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '14px 24px', background: '#F97316', color: 'white',
                  borderRadius: 12, fontSize: 15, fontWeight: 700, textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(249,115,22,0.35)',
                }}>
                <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Narrative
              </a>
            )}
            <button onClick={() => router.push('/narratives')} style={{
              padding: '13px 24px', background: '#F3F4F6', color: '#374151',
              border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              View My Narratives
            </button>
            <button onClick={() => router.push('/dashboard')} style={{
              padding: '11px', background: 'none', color: '#9CA3AF',
              border: 'none', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </AppShell>
    )
  }

  /* ─── STEP: CAMERA ───────────────────────────────────────── */
  if (step === 'camera') {
    return (
      <AppShell>
        {uploadingPic && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 16 }}>
            <div style={{ width: 48, height: 48, border: '4px solid rgba(255,255,255,0.3)',
              borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>Saving verification photo...</p>
          </div>
        )}
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#ECFDF5', border: '1px solid #A7F3D0',
              borderRadius: 20, padding: '8px 16px', marginBottom: 16 }}>
              <svg style={{ width: 16, height: 16, color: '#059669' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#065F46' }}>Narrative saved successfully</span>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>
              Verification Photo
            </h2>
            <p style={{ fontSize: 14, color: '#6B7280', margin: 0, lineHeight: 1.6 }}>
              Take a selfie to confirm your submission. Your name, date, and time will be stamped on the photo.
            </p>
          </div>

          <VerificationCamera
            studentName={studentName}
            onCapture={handlePhotoCapture}
            onCancel={() => setStep('done')}
          />

          <button onClick={() => setStep('done')} style={{
            display: 'block', width: '100%', marginTop: 12,
            padding: '10px', background: 'none', color: '#9CA3AF',
            border: 'none', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Skip verification photo
          </button>
        </div>
      </AppShell>
    )
  }

  /* ─── STEP: FORM ─────────────────────────────────────────── */
  return (
    <AppShell>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <button onClick={() => router.push('/narratives')} style={{
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6B7280',
          background: 'none', border: 'none', cursor: 'pointer', marginBottom: 8,
          padding: 0, fontFamily: 'inherit',
        }}>
          <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Narratives
        </button>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: 0 }}>New Narrative Assessment</h1>
        <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>Document your daily work immersion activities</p>
      </div>

      <div style={{ maxWidth: 720 }}>

        {/* Error */}
        {error && (
          <div style={{ display: 'flex', gap: 10, padding: '12px 14px',
            background: '#FEF2F2', border: '1px solid #FECACA',
            borderRadius: 12, marginBottom: 16, color: '#DC2626', fontSize: 13 }}>
            <svg style={{ width: 16, height: 16, flexShrink: 0, marginTop: 1 }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {/* Form */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E7EB',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: 24,
          display: 'flex', flexDirection: 'column', gap: 20 }}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Input label="Date of Activity" type="date" name="date" value={form.date}
              onChange={handle} max={new Date().toISOString().split('T')[0]} required />
            <Input label="Activity / Task Title" type="text" name="activity" value={form.activity}
              onChange={handle} placeholder="e.g. Customer Service Training" maxLength={200} />
          </div>

          <Field label="Narrative Description" name="narrative" value={form.narrative}
            onChange={handle} rows={8} required
            placeholder="Describe what you did, the tasks you completed, and your observations..."
            hint={
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ fontSize: 11, color: ready ? '#059669' : '#9CA3AF', fontWeight: ready ? 600 : 400 }}>
                  {ready ? `Ready (${chars} chars)` : `${MIN - chars} more characters needed`}
                </span>
                <span style={{ fontSize: 11, color: '#9CA3AF' }}>{chars}</span>
              </div>
            }
          />

          <Field label="What I Learned" name="learnings" value={form.learnings}
            onChange={handle} rows={3} placeholder="New knowledge or insights gained today..." />
          <Field label="Skills Demonstrated" name="skills" value={form.skills}
            onChange={handle} rows={3} placeholder="Skills you used or developed..." />
          <Field label="Challenges Encountered" name="challenges" value={form.challenges}
            onChange={handle} rows={3} placeholder="Difficulties or obstacles faced..." />
          <Field label="How I Handled It" name="solutions" value={form.solutions}
            onChange={handle} rows={3} placeholder="How you overcame the challenges..." />
          <Field label="Personal Reflection" name="reflection" value={form.reflection}
            onChange={handle} rows={4} placeholder="Your thoughts and insights about today..." />

          {/* Info */}
          <div style={{ display: 'flex', gap: 10, padding: '12px 14px',
            background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 10,
            fontSize: 12, color: '#92400E' }}>
            <svg style={{ width: 16, height: 16, flexShrink: 0, marginTop: 1 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <ul style={{ listStyle: 'disc inside', lineHeight: 1.8 }}>
              <li>Submission timestamp is recorded automatically</li>
              <li><strong>After submitting, you will take a verification selfie</strong></li>
              <li>You can download your narrative as a document after submission</li>
            </ul>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="button" onClick={handleDraft}
              disabled={savingDraft || submitting}
              style={{
                flex: 1, padding: '13px', background: savingDraft ? '#F3F4F6' : 'white',
                border: '2px solid #E5E7EB', borderRadius: 12, fontSize: 14, fontWeight: 600,
                color: '#374151', cursor: (savingDraft || submitting) ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', transition: 'all 0.15s',
                opacity: (savingDraft || submitting) ? 0.7 : 1,
              }}>
              {savingDraft ? 'Saving...' : 'Save as Draft'}
            </button>

            <button type="button" onClick={handleSubmitToCamera}
              disabled={!ready || submitting || savingDraft}
              style={{
                flex: 2, padding: '13px',
                background: (!ready || submitting || savingDraft) ? '#FED7AA' : '#F97316',
                color: 'white', border: 'none', borderRadius: 12,
                fontSize: 14, fontWeight: 700, cursor: (!ready || submitting || savingDraft) ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', transition: 'background 0.15s',
                boxShadow: (ready && !submitting && !savingDraft) ? '0 4px 12px rgba(249,115,22,0.35)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
              {submitting ? (
                <>
                  <div style={{ width: 18, height: 18, border: '3px solid rgba(255,255,255,0.4)',
                    borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  Saving...
                </>
              ) : (
                <>
                  <svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Submit & Take Verification Photo
                </>
              )}
            </button>
          </div>
        </div>

        {/* Guidelines */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E7EB',
          padding: 20, marginTop: 16 }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#111827', marginBottom: 12 }}>
            Writing Guidelines
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0,
            display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              'Be specific and detailed about your daily activities',
              'Use complete sentences and proper grammar',
              'Focus on what you learned and how you contributed',
              'Reflect honestly on your experience',
              `Minimum ${MIN} characters required for the narrative section`,
              'A verification selfie is required — it records the time you submitted',
            ].map(tip => (
              <li key={tip} style={{ display: 'flex', gap: 8, fontSize: 13, color: '#6B7280' }}>
                <span style={{ color: '#F97316', flexShrink: 0 }}>&#8226;</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AppShell>
  )
}
