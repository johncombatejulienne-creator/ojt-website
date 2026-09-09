'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import AppShell from '@/components/AppShell'
import PageHeader from '@/components/PageHeader'
import VerificationCamera from '@/components/VerificationCamera'

const MIN = 50

function Field({ label, name, value, onChange, rows = 4, placeholder, required, hint }: {
  label: string; name: string; value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  rows?: number; placeholder?: string; required?: boolean
  hint?: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={name} style={{
        display: 'block', fontSize: 11, fontWeight: 700,
        color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6,
      }}>
        {label}{required && <span style={{ color: '#EF4444', marginLeft: 4 }}>*</span>}
      </label>
      <textarea
        id={name} name={name} value={value} onChange={onChange} rows={rows}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '12px 16px', border: '1.5px solid #E5E7EB',
          borderRadius: 12, fontSize: 14, background: 'white', resize: 'vertical',
          outline: 'none', fontFamily: 'inherit', lineHeight: 1.6,
          boxSizing: 'border-box', color: '#111827',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => { e.target.style.borderColor = '#6366F1' }}
        onBlur={e => { e.target.style.borderColor = '#E5E7EB' }}
      />
      {hint}
    </div>
  )
}

export default function CreateNarrativePage() {
  const router = useRouter()
  const { data: session } = useSession()

  const [busy,    setBusy]    = useState(false)
  const [draft,   setDraft]   = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')

  // Camera state
  const [showCamera, setShowCamera]       = useState(false)
  const [verifyPhoto, setVerifyPhoto]     = useState<string | null>(null)

  const [form, setForm] = useState({
    date:        new Date().toISOString().split('T')[0],
    activity:    '',
    narrative:   '',
    learnings:   '',
    skills:      '',
    challenges:  '',
    solutions:   '',
    reflection:  '',
  })

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmitDraft = () => submit(true, null)

  const handleSubmitFinal = () => {
    if (!verifyPhoto) {
      setShowCamera(true)
      return
    }
    submit(false, verifyPhoto)
  }

  // Called directly from camera capture — avoids stale closure
  const submitWithPhoto = (photo: string) => submit(false, photo)

  const submit = async (isDraft: boolean, photoUrl: string | null) => {
    setError(''); setSuccess('')
    if (!isDraft && form.narrative.trim().length < MIN) {
      setError(`Narrative needs at least ${MIN} characters.`); return
    }
    isDraft ? setDraft(true) : setBusy(true)
    try {
      const content = [
        `**Activity:** ${form.activity || 'Not specified'}`,
        `\n**Narrative:**\n${form.narrative}`,
        `\n**What I Learned:**\n${form.learnings || 'Not specified'}`,
        `\n**Skills Demonstrated:**\n${form.skills || 'Not specified'}`,
        `\n**Challenges:**\n${form.challenges || 'Not specified'}`,
        `\n**How I Handled It:**\n${form.solutions || 'Not specified'}`,
        `\n**Reflection:**\n${form.reflection || 'Not specified'}`,
      ].join('\n')

      const res = await fetch('/api/narratives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date:                 new Date(form.date).toISOString(),
          content,
          isDraft,
          verificationPhotoUrl: isDraft ? undefined : photoUrl,
        }),
      })

      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.detail ?? d.error ?? 'Submission failed')
      }

      setSuccess(isDraft ? 'Draft saved!' : 'Narrative submitted successfully!')
      setTimeout(() => router.push('/narratives'), 1400)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An error occurred')
    } finally {
      setBusy(false); setDraft(false)
    }
  }

  const chars = form.narrative.length
  const ready = chars >= MIN

  const studentName = session?.user?.name ?? session?.user?.email?.split('@')[0] ?? 'Student'

  return (
    <AppShell>
      {/* Verification Camera Modal */}
      {showCamera && (
        <VerificationCamera
          studentName={studentName}
          onCapture={photo => {
            setVerifyPhoto(photo)
            setShowCamera(false)
            // Pass photo directly to avoid stale closure
            submitWithPhoto(photo)
          }}
          onCancel={() => setShowCamera(false)}
        />
      )}

      <PageHeader
        title="New Narrative Assessment"
        subtitle="Document your daily work immersion activities"
        backHref="/narratives" backLabel="Narratives"
      />

      <div style={{ maxWidth: 720 }}>

        {/* Alerts */}
        {error && (
          <div style={{
            display: 'flex', gap: 12, padding: '14px 16px',
            background: '#FEF2F2', border: '1px solid #FECACA',
            borderRadius: 12, marginBottom: 16, color: '#DC2626', fontSize: 14,
          }}>
            <svg style={{ width: 18, height: 18, flexShrink: 0, marginTop: 1 }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
            </svg>
            {error}
          </div>
        )}
        {success && (
          <div style={{
            display: 'flex', gap: 12, padding: '14px 16px',
            background: '#ECFDF5', border: '1px solid #A7F3D0',
            borderRadius: 12, marginBottom: 16, color: '#065F46', fontSize: 14,
          }}>
            <svg style={{ width: 18, height: 18, flexShrink: 0, marginTop: 1 }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
            {success}
          </div>
        )}

        {/* Verification photo preview */}
        {verifyPhoto && (
          <div style={{
            background: '#ECFDF5', border: '1.5px solid #6EE7B7',
            borderRadius: 14, padding: '12px 16px', marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={verifyPhoto} alt="Verification" style={{
              width: 52, height: 52, borderRadius: 8, objectFit: 'cover', flexShrink: 0,
            }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#065F46' }}>
                Verification photo captured
              </p>
              <p style={{ fontSize: 11, color: '#6EE7B7', marginTop: 2 }}>
                Your name and timestamp are stamped on the photo
              </p>
            </div>
            <button
              onClick={() => setVerifyPhoto(null)}
              style={{ fontSize: 11, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Retake
            </button>
          </div>
        )}

        {/* Form */}
        <div style={{
          background: 'white', borderRadius: 16, border: '1px solid #E5E7EB',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: 24,
          display: 'flex', flexDirection: 'column', gap: 20,
        }}>
          {/* Date + Activity */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Input
              label="Date of Activity" type="date" name="date" value={form.date}
              onChange={handle} max={new Date().toISOString().split('T')[0]} required
            />
            <Input
              label="Activity / Task Title" type="text" name="activity" value={form.activity}
              onChange={handle} placeholder="e.g. Customer Service Training" maxLength={200}
            />
          </div>

          <Field
            label="Narrative Description" name="narrative" value={form.narrative}
            onChange={handle} rows={8} required
            placeholder="Describe in detail what you did, the tasks you completed, and your observations..."
            hint={
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{
                  fontSize: 11,
                  color: ready ? '#059669' : '#9CA3AF',
                  fontWeight: ready ? 600 : 400,
                }}>
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
            onChange={handle} rows={3} placeholder="Difficulties or obstacles you faced..." />
          <Field label="How I Handled It" name="solutions" value={form.solutions}
            onChange={handle} rows={3} placeholder="How you overcame the challenges..." />
          <Field label="Personal Reflection" name="reflection" value={form.reflection}
            onChange={handle} rows={4} placeholder="Your thoughts and insights about today..." />

          {/* Info box */}
          <div style={{
            display: 'flex', gap: 10, padding: '12px 14px',
            background: '#EFF6FF', border: '1px solid #BFDBFE',
            borderRadius: 10, fontSize: 12, color: '#1E40AF',
          }}>
            <svg style={{ width: 16, height: 16, flexShrink: 0, marginTop: 1 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <ul style={{ listStyle: 'disc inside', lineHeight: 1.7 }}>
              <li>Submission date and time are automatically recorded</li>
              <li><strong>Final submission requires a verification selfie</strong> with a date/time stamp</li>
              <li>Save as draft if you need to continue later</li>
              <li>Submitted narratives are reviewed by your supervisor</li>
            </ul>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 12 }}>
            <Button
              type="button" variant="outline" size="lg"
              style={{ flex: 1 }}
              isLoading={draft} disabled={busy}
              onClick={handleSubmitDraft}
            >
              Save as Draft
            </Button>
            <Button
              type="button" size="lg"
              style={{ flex: 1, background: '#4F46E5', color: 'white' }}
              isLoading={busy} disabled={draft || !ready}
              onClick={handleSubmitFinal}
            >
              {verifyPhoto ? 'Submit Narrative' : 'Take Photo & Submit'}
            </Button>
          </div>
        </div>

        {/* Guidelines */}
        <div style={{
          background: 'white', borderRadius: 16, border: '1px solid #E5E7EB',
          padding: 20, marginTop: 16,
        }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#111827', marginBottom: 12 }}>
            Writing Guidelines
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              'Be specific and detailed about your daily activities',
              'Use complete sentences and proper grammar',
              'Focus on what you learned and how you contributed',
              'Reflect honestly and thoughtfully on your experience',
              `Minimum ${MIN} characters required for the narrative section`,
              'A verification selfie with date/time stamp is required for final submission',
            ].map(tip => (
              <li key={tip} style={{ display: 'flex', gap: 8, fontSize: 13, color: '#6B7280' }}>
                <span style={{ color: '#6366F1', flexShrink: 0 }}>&#8226;</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AppShell>
  )
}
