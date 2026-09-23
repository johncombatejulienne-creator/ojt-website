'use client'

import { useState, useRef, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Input } from '@/components/ui/Input'
import AppShell from '@/components/AppShell'
import VerificationCamera from '@/components/VerificationCamera'

// Force dynamic rendering — this page uses useSearchParams (?draft=ID)
export const dynamic = 'force-dynamic'

const MIN = 50

type Step = 'form' | 'camera' | 'done'

/* ─── Tooltip helper ──────────────────────────────────────── */
function FieldTip({ tip }: { tip: string }) {
  const [show, setShow] = useState(false)
  return (
    <span style={{ position: 'relative', display: 'inline-flex', marginLeft: 4 }}>
      <button type="button"
        onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}    onBlur={() => setShow(false)}
        style={{ width: 16, height: 16, borderRadius: '50%', background: '#E5E7EB', border: 'none',
          cursor: 'pointer', fontSize: 10, fontWeight: 800, color: '#6B7280',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          lineHeight: 1, padding: 0, transition: 'all 0.15s' }}
        aria-label="Help" tabIndex={0}
        onMouseDown={e => e.preventDefault()}>
        ?
      </button>
      {show && (
        <span style={{ position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%',
          transform: 'translateX(-50%)', background: '#1E293B', color: 'white',
          fontSize: 12, fontWeight: 500, padding: '7px 11px', borderRadius: 10,
          whiteSpace: 'normal', width: 220, zIndex: 50, lineHeight: 1.5,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)', pointerEvents: 'none',
          animation: 'scaleIn 0.15s cubic-bezier(0.34,1.3,0.64,1) both' }}>
          {tip}
          <span style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
            border: '5px solid transparent', borderTopColor: '#1E293B' }} />
        </span>
      )}
    </span>
  )
}

/* ─── Field label ─────────────────────────────────────────── */
function FieldLabel({ text, required, tip, chars, maxChars }:
  { text: string; required?: boolean; tip?: string; chars?: number; maxChars?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 800, color: '#6B7280',
        textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center' }}>
        {text}
        {required && <span style={{ color: '#EF4444', marginLeft: 3 }}>*</span>}
        {tip && <FieldTip tip={tip} />}
      </label>
      {chars !== undefined && (
        <span style={{ fontSize: 11, color: chars >= MIN ? '#10B981' : '#9CA3AF', fontWeight: 600 }}>
          {chars >= MIN ? `✓ ${chars}` : `${MIN - chars} more needed`}
          {maxChars && ` / ${maxChars}`}
        </span>
      )}
    </div>
  )
}

/* ─── Textarea field ──────────────────────────────────────── */
function JournalField({ label, name, value, onChange, rows = 4, placeholder, required, tip, showCharCount, maxChars }: {
  label: string; name: string; value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  rows?: number; placeholder?: string; required?: boolean; tip?: string
  showCharCount?: boolean; maxChars?: number
}) {
  return (
    <div>
      <FieldLabel text={label} required={required} tip={tip}
        chars={showCharCount ? value.length : undefined} maxChars={maxChars} />
      <textarea id={name} name={name} value={value} onChange={onChange} rows={rows}
        placeholder={placeholder}
        className="journal-textarea"
        style={{ width: '100%', boxSizing: 'border-box' }}
        onFocus={e => { e.target.style.borderColor = '#F97316'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.12)' }}
        onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none' }}
      />
    </div>
  )
}

/* ─── Autosave status ─────────────────────────────────────── */
function SaveStatus({ state }: { state: 'idle' | 'saving' | 'saved' }) {
  if (state === 'idle') return null
  return (
    <span className={`save-status ${state}`}>
      {state === 'saving' ? (
        <><span style={{ width: 12, height: 12, border: '2px solid currentColor',
          borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite',
          display: 'inline-block' }} /> Saving…</>
      ) : (
        <><span>✓</span> Saved</>
      )}
    </span>
  )
}

/* ─── Step indicator ──────────────────────────────────────── */
function StepIndicator({ current }: { current: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: 'form',   label: 'Write' },
    { key: 'camera', label: 'Verify' },
    { key: 'done',   label: 'Done' },
  ]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 24 }}>
      {steps.map((s, i) => {
        const done    = steps.findIndex(x => x.key === current) > i
        const active  = s.key === current
        return (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800,
                background: done ? '#10B981' : active ? '#F97316' : '#E5E7EB',
                color: (done || active) ? 'white' : '#9CA3AF',
                boxShadow: active ? '0 4px 12px rgba(249,115,22,0.4)' : 'none',
                transition: 'all 0.3s ease' }}>
                {done ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: active ? '#F97316' : done ? '#10B981' : '#9CA3AF',
                textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 2, background: done ? '#10B981' : '#E5E7EB',
                margin: '0 8px', marginBottom: 22, transition: 'background 0.4s ease' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   PAGE (inner — uses useSearchParams, must be inside Suspense)
═════════════════════════════════════════════════════════════ */
function CreateNarrativeInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()

  const [step,         setStep]         = useState<Step>('form')
  const [submitting,   setSubmitting]   = useState(false)
  const [savingDraft,  setSavingDraft]  = useState(false)
  const [uploadingPic, setUploadingPic] = useState(false)
  const [error,        setError]        = useState('')
  const [loadingDraft, setLoadingDraft] = useState(false)
  const [saveStatus,   setSaveStatus]   = useState<'idle' | 'saving' | 'saved'>('idle')
  const [showSample,   setShowSample]   = useState(false)

  const savedNarrativeId = useRef<string | null>(null)
  const autoSaveTimer    = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [form, setForm] = useState({
    date:       new Date().toISOString().split('T')[0],
    activity:   '', narrative: '', learnings: '',
    skills: '', challenges: '', solutions: '', reflection: '',
  })

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
    setError('')
  }

  /* ── Autosave draft every 30s if content changes ────────── */
  const autoSave = useCallback(async () => {
    if (!form.narrative.trim() || submitting) return
    setSaveStatus('saving')
    try {
      const content = buildContent(form)
      if (savedNarrativeId.current) {
        await fetch(`/api/narratives/${savedNarrativeId.current}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, isDraft: true }),
        })
      }
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch { setSaveStatus('idle') }
  }, [form, submitting])

  useEffect(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    if (savedNarrativeId.current && form.narrative.trim()) {
      autoSaveTimer.current = setTimeout(autoSave, 30000)
    }
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current) }
  }, [form.narrative, autoSave])

  /* ── Load draft ──────────────────────────────────────────── */
  useEffect(() => {
    const draftId = searchParams.get('draft')
    if (!draftId) return
    savedNarrativeId.current = draftId
    setLoadingDraft(true)
    fetch(`/api/narratives/${draftId}`)
      .then(r => r.json())
      .then(d => {
        if (!d.narrative) return
        const n = d.narrative
        const dateStr = n.date ? new Date(n.date).toISOString().split('T')[0] : form.date
        const content: string = n.content ?? ''
        const get = (lbl: string) => {
          const m = content.match(new RegExp(`\\*\\*${lbl}:\\*\\*\\s*([\\s\\S]*?)(?=\\n\\*\\*|$)`))
          return m ? m[1].trim().replace(/^Not specified$/i, '') : ''
        }
        setForm({
          date: dateStr, activity: get('Activity'), narrative: get('Narrative'),
          learnings: get('What I Learned'), skills: get('Skills Demonstrated'),
          challenges: get('Challenges'), solutions: get('How I Handled It'), reflection: get('Reflection'),
        })
      })
      .catch(() => {})
      .finally(() => setLoadingDraft(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Save as draft ───────────────────────────────────────── */
  const handleDraft = async () => {
    if (savingDraft || submitting) return
    setSavingDraft(true); setError('')
    try {
      const content = buildContent(form)
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

  /* ── Submit → camera ─────────────────────────────────────── */
  const handleSubmitToCamera = async () => {
    if (submitting || savingDraft) return
    setError('')
    if (form.narrative.trim().length < MIN) {
      setError(`Narrative needs at least ${MIN} characters.`); return
    }
    setSubmitting(true)
    try {
      const content = buildContent(form)
      const dateISO = new Date(form.date).toISOString()
      let narrativeId: string | null = savedNarrativeId.current

      if (narrativeId) {
        const res = await fetch(`/api/narratives/${narrativeId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, isDraft: false, date: dateISO }),
        })
        if (!res.ok) narrativeId = null
      }
      if (!narrativeId) {
        const res = await fetch('/api/narratives', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: dateISO, content, isDraft: false }),
        })
        const d = await res.json()
        if (!res.ok) throw new Error(d.detail ?? d.error ?? 'Submission failed')
        narrativeId = d.narrative.id
      }
      savedNarrativeId.current = narrativeId
      setStep('camera')
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error') }
    finally { setSubmitting(false) }
  }

  /* ── Camera cancel → delete pending ─────────────────────── */
  const handleCameraCancel = async () => {
    if (savedNarrativeId.current) {
      await fetch(`/api/narratives/${savedNarrativeId.current}`, { method: 'DELETE' }).catch(() => {})
      savedNarrativeId.current = null
    }
    setStep('form'); setSubmitting(false)
  }

  /* ── Photo captured ──────────────────────────────────────── */
  const handlePhotoCapture = async (photoDataUrl: string) => {
    if (!savedNarrativeId.current) { setStep('done'); return }
    setUploadingPic(true)
    try {
      await fetch(`/api/narratives/${savedNarrativeId.current}/verification-photo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoDataUrl }),
      })
    } catch { /* non-critical */ }
    finally { setUploadingPic(false); setStep('done') }
  }

  const chars = form.narrative.length
  const ready = chars >= MIN
  const studentName = session?.user?.name ?? session?.user?.email?.split('@')[0] ?? 'Student'

  /* ─── DONE ───────────────────────────────────────────────── */
  if (step === 'done') return (
    <AppShell>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes bounceIn{0%{transform:scale(0.3);opacity:0}50%{transform:scale(1.08)}70%{transform:scale(0.95)}100%{transform:scale(1);opacity:1}}`}</style>
      <div style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center', padding: '48px 16px' }}>
        <div style={{ width: 88, height: 88, borderRadius: '50%',
          background: 'linear-gradient(135deg,#10B981,#059669)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 28px',
          boxShadow: '0 12px 32px rgba(16,185,129,0.45)',
          animation: 'bounceIn 0.7s cubic-bezier(0.34,1.3,0.64,1) both' }}>
          <svg style={{ width: 44, height: 44, color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#111827', margin: '0 0 10px' }}>Narrative Submitted! 🎉</h1>
        <p style={{ fontSize: 15, color: '#6B7280', margin: '0 0 28px', lineHeight: 1.7 }}>
          Your narrative has been saved and verified. Your teacher can now review your submission.
        </p>
        {/* Download banner */}
        <div style={{ background: 'linear-gradient(135deg,#FFF7ED,#FFEDD5)',
          border: '2px solid #FED7AA', borderRadius: 18, padding: '18px 20px',
          marginBottom: 24, textAlign: 'left' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 42, height: 42, background: '#F97316', borderRadius: 11, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg style={{ width: 20, height: 20, color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <div>
              <p style={{ fontWeight: 800, fontSize: 14, color: '#92400E', margin: '0 0 4px' }}>
                📥 Download Your Narrative
              </p>
              <p style={{ fontSize: 13, color: '#B45309', lineHeight: 1.55, margin: 0 }}>
                Keep a copy for your personal records and for submitting a printed copy to your teacher.
              </p>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {savedNarrativeId.current && (
            <a href={`/api/narratives/${savedNarrativeId.current}/download`} download
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '14px 24px', background: '#F97316', color: 'white',
                borderRadius: 14, fontSize: 15, fontWeight: 700, textDecoration: 'none',
                boxShadow: '0 6px 18px rgba(249,115,22,0.4)' }}>
              <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Download Narrative Now
            </a>
          )}
          <button onClick={() => router.push('/narratives')}
            style={{ padding: '13px 24px', background: '#F3F4F6', color: '#374151',
              border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
            View My Narratives
          </button>
          <button onClick={() => router.push('/dashboard')}
            style={{ padding: '11px', background: 'none', color: '#9CA3AF',
              border: 'none', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    </AppShell>
  )

  /* ─── CAMERA ─────────────────────────────────────────────── */
  if (step === 'camera') return (
    <AppShell>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      {uploadingPic && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
          <div style={{ width: 48, height: 48, border: '4px solid rgba(255,255,255,0.3)',
            borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>Saving verification photo…</p>
        </div>
      )}
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <StepIndicator current="camera" />
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#ECFDF5', border: '1px solid #A7F3D0',
            borderRadius: 20, padding: '8px 16px', marginBottom: 16 }}>
            <svg style={{ width: 15, height: 15, color: '#059669' }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#065F46' }}>Narrative saved successfully</span>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#111827', margin: '0 0 8px' }}>Verification Photo</h2>
          <p style={{ fontSize: 14, color: '#6B7280', margin: 0, lineHeight: 1.6 }}>
            Take a quick selfie to confirm your submission.<br/>
            Your name, date, and time will be stamped on the photo.
          </p>
        </div>
        <VerificationCamera studentName={studentName} onCapture={handlePhotoCapture} onCancel={handleCameraCancel} />
        <button onClick={handleCameraCancel}
          style={{ display: 'block', width: '100%', marginTop: 12,
            padding: '10px', background: 'none', color: '#9CA3AF',
            border: 'none', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
          ← Back to edit narrative
        </button>
      </div>
    </AppShell>
  )

  /* ─── LOADING DRAFT ──────────────────────────────────────── */
  if (loadingDraft) return (
    <AppShell>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '80px 0', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 44, height: 44, border: '4px solid #FFEDD5', borderTopColor: '#F97316',
          borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: 14, color: '#9CA3AF', fontWeight: 500 }}>Loading your draft…</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </AppShell>
  )

  /* ─── FORM ───────────────────────────────────────────────── */
  return (
    <AppShell>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes scaleIn{from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}} @keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>

      {/* Sample modal */}
      {showSample && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
          zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16, animation: 'fadeIn 0.15s ease' }}
          onClick={() => setShowSample(false)}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: 'white', borderRadius: 20, padding: '28px 24px',
              maxWidth: 520, width: '100%', maxHeight: '80vh', overflowY: 'auto',
              animation: 'scaleIn 0.25s cubic-bezier(0.34,1.3,0.64,1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 10, fontWeight: 800, background: '#FEF3C7', color: '#92400E',
                  padding: '3px 10px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Sample Only — Do Not Copy
                </span>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: '8px 0 0' }}>Example Narrative</h3>
              </div>
              <button onClick={() => setShowSample(false)}
                style={{ width: 32, height: 32, borderRadius: '50%', background: '#F3F4F6', border: 'none',
                  cursor: 'pointer', fontSize: 18, color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>
            <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Activity', text: 'Customer Service and Front Desk Operations Training' },
                { label: 'Narrative', text: 'Today, I was assigned to the front desk area under the supervision of Ms. Santos. I greeted customers as they arrived, assisted them with their inquiries, and directed them to the appropriate departments. I also helped answer incoming calls and recorded messages for staff members who were unavailable.' },
                { label: 'What I Learned', text: 'I learned the importance of professional communication and active listening. I discovered that customers feel more comfortable when addressed politely and when their concerns are acknowledged promptly.' },
                { label: 'Skills Demonstrated', text: 'Communication, active listening, problem-solving, time management, and professional conduct.' },
                { label: 'Challenges', text: 'I found it challenging to handle multiple customers at the same time, especially during peak hours in the morning.' },
                { label: 'How I Handled It', text: 'I prioritized urgent inquiries first and politely asked waiting customers to give me a moment. My supervisor guided me on how to manage the queue more effectively.' },
                { label: 'Reflection', text: 'This experience taught me that patience and composure are essential skills in any workplace. I am excited to improve my communication skills further in the coming days.' },
              ].map(({ label, text }) => (
                <div key={label}>
                  <p style={{ fontSize: 10, fontWeight: 800, color: '#F97316', textTransform: 'uppercase',
                    letterSpacing: '0.08em', margin: '0 0 4px' }}>{label}</p>
                  <p style={{ margin: 0 }}>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <button onClick={() => router.push('/narratives')} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#9CA3AF',
          background: 'none', border: 'none', cursor: 'pointer', marginBottom: 10, padding: '4px 0',
          fontFamily: 'inherit', transition: 'color 0.15s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#F97316' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#9CA3AF' }}>
          <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
          Narratives
        </button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#111827', margin: '0 0 4px' }}>
              ✍️ {searchParams.get('draft') ? 'Continue Draft' : 'New Narrative'}
            </h1>
            <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>
              Document your daily work immersion activities
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <SaveStatus state={saveStatus} />
            <button type="button" onClick={() => setShowSample(true)}
              style={{ padding: '7px 14px', background: '#F3F4F6', color: '#6B7280',
                border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg style={{ width: 13, height: 13 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
              View Example
            </button>
          </div>
        </div>
      </div>

      {/* Step indicator */}
      <StepIndicator current="form" />

      <div style={{ maxWidth: 720 }}>
        {/* Error */}
        {error && (
          <div style={{ display: 'flex', gap: 10, padding: '12px 16px', background: '#FEF2F2',
            border: '1px solid #FECACA', borderRadius: 12, marginBottom: 16, color: '#DC2626', fontSize: 13 }}>
            <svg style={{ width: 16, height: 16, flexShrink: 0, marginTop: 1 }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
            </svg>
            {error}
          </div>
        )}

        {/* Journal form card */}
        <div style={{ background: 'white', borderRadius: 20, border: '1px solid #E5E7EB',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: '24px 26px',
          display: 'flex', flexDirection: 'column', gap: 22, boxSizing: 'border-box' }}>

          {/* Date + activity title row */}
          <div className="grid-2">
            <div>
              <FieldLabel text="Date of Activity" required
                tip="Enter the actual date of your work immersion for this entry." />
              <Input type="date" name="date" value={form.date}
                onChange={handle} max={new Date().toISOString().split('T')[0]} required />
            </div>
            <div>
              <FieldLabel text="Activity / Task Title"
                tip="A short title for today's main task — e.g. Customer Service Training." />
              <Input type="text" name="activity" value={form.activity}
                onChange={handle} placeholder="e.g. Customer Service Training" maxLength={200} />
            </div>
          </div>

          {/* Main narrative — required */}
          <JournalField
            label="Narrative Description" name="narrative" value={form.narrative}
            onChange={handle} rows={9} required showCharCount
            tip="Describe the tasks you completed, what you observed, and how you participated. Be specific and detailed."
            placeholder="Describe what you did today, the tasks you completed, and your observations…

What happened? Who did you work with? What processes did you learn? Be as detailed as possible."
          />

          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #E5E7EB, transparent)' }} />

          {/* Reflective fields */}
          <JournalField label="What I Learned" name="learnings" value={form.learnings}
            onChange={handle} rows={3}
            tip="Explain the knowledge, skills, or lessons you gained from today's experience."
            placeholder="New knowledge or insights you gained today…" />

          <JournalField label="Skills Demonstrated" name="skills" value={form.skills}
            onChange={handle} rows={3}
            tip="List the skills you used or developed — e.g. teamwork, communication, technical skills."
            placeholder="Skills you used or developed during this experience…" />

          <JournalField label="Challenges Encountered" name="challenges" value={form.challenges}
            onChange={handle} rows={3}
            tip="Describe difficulties or problems you encountered and how they affected your work."
            placeholder="Difficulties or obstacles you faced today…" />

          <JournalField label="How I Handled It" name="solutions" value={form.solutions}
            onChange={handle} rows={3}
            tip="Explain what steps you took to overcome the challenges you described above."
            placeholder="How you overcame the challenges…" />

          <JournalField label="Personal Reflection" name="reflection" value={form.reflection}
            onChange={handle} rows={4}
            tip="Share your personal thoughts about today's experience and what it means for your career growth."
            placeholder="Your thoughts and insights about today. How did this experience help you grow? What would you do differently?" />

          {/* Info note */}
          <div style={{ display: 'flex', gap: 10, padding: '12px 16px',
            background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 12,
            fontSize: 12, color: '#92400E', lineHeight: 1.7 }}>
            <svg style={{ width: 16, height: 16, flexShrink: 0, marginTop: 2, color: '#F97316' }}
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <div>
              <strong>Before you submit:</strong>
              <ul style={{ margin: '4px 0 0', paddingLeft: 16 }}>
                <li>Submission timestamp is recorded automatically</li>
                <li>You will take a verification selfie after submitting</li>
                <li>Download your narrative after submission for your records</li>
              </ul>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button type="button" onClick={handleDraft}
              disabled={savingDraft || submitting}
              style={{ flex: '1 1 120px', padding: '13px 16px', background: 'white',
                border: '2px solid #E5E7EB', borderRadius: 12, fontSize: 14, fontWeight: 700,
                color: '#374151', cursor: (savingDraft || submitting) ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', transition: 'all 0.15s', opacity: (savingDraft || submitting) ? 0.6 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              {savingDraft ? (
                <><div style={{ width: 16, height: 16, border: '2.5px solid #D1D5DB', borderTopColor: '#9CA3AF',
                  borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />Saving…</>
              ) : <>💾 Save as Draft</>}
            </button>

            <button type="button" onClick={handleSubmitToCamera}
              disabled={!ready || submitting || savingDraft}
              className={ready ? 'btn-premium' : ''}
              style={{ flex: '2 1 200px', padding: '13px 16px',
                background: !ready ? '#FED7AA' : undefined,
                color: !ready ? '#92400E' : undefined,
                borderRadius: 12, fontSize: 14, fontWeight: 700,
                cursor: (!ready || submitting || savingDraft) ? 'not-allowed' : 'pointer',
                border: 'none', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: (ready && !submitting) ? '0 6px 18px rgba(249,115,22,0.4)' : 'none' }}>
              {submitting ? (
                <><div style={{ width: 18, height: 18, border: '3px solid rgba(255,255,255,0.4)',
                  borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />Saving…</>
              ) : !ready ? (
                `Need ${MIN - chars} more characters`
              ) : (
                <><svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                </svg> Submit & Take Verification Photo</>
              )}
            </button>
          </div>
        </div>

        {/* Writing guidelines */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E7EB',
          padding: '18px 22px', marginTop: 16, boxSizing: 'border-box' }}>
          <p style={{ fontWeight: 800, fontSize: 13, color: '#111827', marginBottom: 12, margin: '0 0 12px',
            display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 16 }}>💡</span> Writing Guidelines
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 8 }}>
            {[
              { icon: '📝', tip: 'Be specific about your daily tasks and activities' },
              { icon: '💬', tip: 'Use complete sentences and proper grammar' },
              { icon: '🎯', tip: 'Focus on what you learned and how you contributed' },
              { icon: '🪞', tip: 'Reflect honestly — the good and the challenging' },
              { icon: '📏', tip: `Minimum ${MIN} characters for the narrative section` },
              { icon: '📸', tip: 'A verification selfie is required after submitting' },
            ].map(({ icon, tip }) => (
              <div key={tip} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
                <span style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5 }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}

/* ─── Build stored content ───────────────────────────────── */
function buildContent(form: {
  activity: string; narrative: string; learnings: string
  skills: string; challenges: string; solutions: string; reflection: string
}) {
  return [
    `**Activity:** ${form.activity || 'Not specified'}`,
    `\n**Narrative:**\n${form.narrative}`,
    `\n**What I Learned:**\n${form.learnings || 'Not specified'}`,
    `\n**Skills Demonstrated:**\n${form.skills || 'Not specified'}`,
    `\n**Challenges:**\n${form.challenges || 'Not specified'}`,
    `\n**How I Handled It:**\n${form.solutions || 'Not specified'}`,
    `\n**Reflection:**\n${form.reflection || 'Not specified'}`,
  ].join('\n')
}

/* ── Suspense wrapper — required because useSearchParams is used inside ── */
export default function CreateNarrativePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#F8FAFC', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 40, height: 40, border: '4px solid #FFEDD5',
          borderTopColor: '#F97316', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ fontSize: 14, color: '#9CA3AF', fontWeight: 500, fontFamily: 'system-ui,sans-serif' }}>
          Loading…
        </p>
      </div>
    }>
      <CreateNarrativeInner />
    </Suspense>
  )
}
