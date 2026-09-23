'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface Strand  { id: string; name: string }
interface Section { id: string; name: string; gradeLevel: number; strandId: string }

/* ─── Strand visual config ───────────────────────────────── */
const STRAND_VISUAL: Record<string, {
  grad: string; light: string; border: string; color: string; emoji: string; desc: string
}> = {
  STEM:  {
    grad: 'linear-gradient(135deg,#F97316,#FBBF24)', light: '#FFF7ED',
    border: '#FED7AA', color: '#C2410C', emoji: '🔬',
    desc: 'Science, Technology, Engineering & Math',
  },
  ABM:   {
    grad: 'linear-gradient(135deg,#D97706,#F59E0B)', light: '#FFFBEB',
    border: '#FDE68A', color: '#92400E', emoji: '📊',
    desc: 'Accountancy, Business & Management',
  },
  HUMSS: {
    grad: 'linear-gradient(135deg,#7C3AED,#A78BFA)', light: '#F5F3FF',
    border: '#DDD6FE', color: '#5B21B6', emoji: '📚',
    desc: 'Humanities & Social Sciences',
  },
  TVL:   {
    grad: 'linear-gradient(135deg,#0EA5E9,#38BDF8)', light: '#F0F9FF',
    border: '#BAE6FD', color: '#0369A1', emoji: '🛠️',
    desc: 'Technical-Vocational-Livelihood',
  },
}

function getStrandKey(name: string) {
  const u = name.toUpperCase()
  for (const key of Object.keys(STRAND_VISUAL)) {
    if (u.includes(key)) return key
  }
  return null
}

/* ─── Step indicator ──────────────────────────────────────── */
function Steps({ current }: { current: 1 | 2 | 3 }) {
  const labels = ['Identity', 'Academic', 'Work Details']
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
      {labels.map((label, i) => {
        const n = i + 1
        const done   = current > n
        const active = current === n
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center',
            flex: i < labels.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 800,
                background: done ? '#10B981' : active ? 'linear-gradient(135deg,#F97316,#EA580C)' : '#E5E7EB',
                color: (done || active) ? 'white' : '#9CA3AF',
                boxShadow: active ? '0 4px 14px rgba(249,115,22,0.45)' : 'none',
                transition: 'all 0.3s ease',
              }}>
                {done ? '✓' : n}
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap',
                color: active ? '#F97316' : done ? '#10B981' : '#9CA3AF',
                textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div style={{ flex: 1, height: 2, margin: '0 6px', marginBottom: 20,
                background: done ? '#10B981' : '#E5E7EB', transition: 'background 0.4s ease' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ─── Field wrapper ──────────────────────────────────────── */
function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#6B7280',
        textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
        {label}{required && <span style={{ color: '#EF4444', marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {hint && <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 5, lineHeight: 1.4 }}>{hint}</p>}
    </div>
  )
}

const inp: React.CSSProperties = {
  width: '100%', padding: '12px 14px', border: '1.5px solid #E5E7EB',
  borderRadius: 12, fontSize: 15, background: 'white', fontFamily: 'inherit',
  boxSizing: 'border-box', color: '#111827', outline: 'none',
  transition: 'border-color 0.18s, box-shadow 0.18s',
}

/* ════════════════════════════════════════════════════════════
   PAGE
═════════════════════════════════════════════════════════════ */
export default function CompleteProfilePage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  const [step,             setStep]             = useState<1 | 2 | 3>(1)
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
    if (error && errorRef.current)
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [error])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value, ...(name === 'strandId' ? { sectionId: '' } : {}) }))
    if (error) setError('')
  }

  /* ── Step 1 → 2 ─────────────────────────────────────────── */
  const goStep2 = () => {
    if (!form.studentId.trim()) { setError('Student ID is required.'); return }
    setError(''); setStep(2)
  }

  /* ── Step 2 → 3 ─────────────────────────────────────────── */
  const goStep3 = () => {
    if (!form.strandId) { setError('Please select your strand.'); return }
    if (!useCustomSection && !form.sectionId) {
      setError('Please select a section or click "Type My Section" to enter one.'); return
    }
    if (useCustomSection && !form.customSection.trim()) {
      setError('Please enter your section name.'); return
    }
    setError(''); setStep(3)
  }

  /* ── Final submit ────────────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true); setError('')
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

  /* ── Loading ─────────────────────────────────────────────── */
  if (status === 'loading') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#F8FAFC' }}>
      <div style={{ width: 44, height: 44, border: '4px solid #FFEDD5', borderTopColor: '#F97316',
        borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  /* ── Derive selected strand visual ──────────────────────── */
  const selectedStrand = strands.find(s => s.id === form.strandId)
  const strandKey      = selectedStrand ? getStrandKey(selectedStrand.name) : null
  const strandVis      = strandKey ? STRAND_VISUAL[strandKey] : null

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC',
      fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <style>{`
        @keyframes spin         { to { transform: rotate(360deg); } }
        @keyframes fadeSlideUp  { from { opacity:0; transform:translateY(18px) } to { opacity:1; transform:translateY(0) } }
        @keyframes scaleIn      { from { opacity:0; transform:scale(0.94) } to { opacity:1; transform:scale(1) } }
        @keyframes bounceIn     { 0%{transform:scale(0.3);opacity:0} 55%{transform:scale(1.07)} 75%{transform:scale(0.95)} 100%{transform:scale(1);opacity:1} }
        .inp-focus:focus        { border-color:#F97316 !important; box-shadow:0 0 0 3px rgba(249,115,22,0.14) !important; outline:none; }
        .strand-card            { transition:all 0.2s cubic-bezier(0.34,1.2,0.64,1); cursor:pointer; }
        .strand-card:hover      { transform:translateY(-3px); box-shadow:0 8px 28px rgba(0,0,0,0.12); }
      `}</style>

      {/* ── Decorative top bar ─────────────────────────────── */}
      <div style={{ height: 4, background: 'linear-gradient(90deg,#F97316,#FBBF24,#10B981,#6366F1)' }} />

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '32px 16px 64px' }}>

        {/* ── Hero header ───────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: 32, animation: 'fadeSlideUp 0.5s ease both' }}>
          {/* Logo mark */}
          <div style={{ width: 72, height: 72, borderRadius: 20, margin: '0 auto 18px',
            background: strandVis?.grad ?? 'linear-gradient(135deg,#F97316,#FBBF24)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 10px 28px rgba(249,115,22,0.4)',
            transition: 'background 0.4s ease',
            animation: 'bounceIn 0.7s cubic-bezier(0.34,1.3,0.64,1) both' }}>
            <svg style={{ width: 36, height: 36, color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#111827', margin: '0 0 8px' }}>
            Welcome to Work Immersion 👋
          </h1>
          <p style={{ fontSize: 14, color: '#6B7280', margin: 0, lineHeight: 1.6 }}>
            {session?.user?.name
              ? `Hi ${session.user.name.split(' ')[0]}! Let's set up your profile.`
              : "Let's set up your profile to get started."}
          </p>
        </div>

        {/* ── Step indicator ────────────────────────────────── */}
        <div style={{ animation: 'fadeSlideUp 0.5s 0.1s ease both' }}>
          <Steps current={step} />
        </div>

        {/* ── Error banner ─────────────────────────────────── */}
        {error && (
          <div ref={errorRef} style={{ display: 'flex', gap: 10, padding: '12px 16px',
            marginBottom: 20, background: '#FEF2F2', border: '1.5px solid #FECACA',
            borderRadius: 14, fontSize: 13, color: '#DC2626', animation: 'scaleIn 0.2s ease' }}>
            <svg style={{ width: 16, height: 16, flexShrink: 0, marginTop: 1 }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
            </svg>
            {error}
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            STEP 1 — Student Identity
        ═══════════════════════════════════════════════════ */}
        {step === 1 && (
          <div style={{ animation: 'fadeSlideUp 0.45s ease both' }}>
            <div style={{ background: 'white', borderRadius: 20, border: '1px solid #E5E7EB',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden', marginBottom: 16 }}>

              {/* Card header strip */}
              <div style={{ padding: '16px 22px', background: 'linear-gradient(135deg,#FFF7ED,#FFEDD5)',
                borderBottom: '1px solid #FED7AA', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10,
                  background: 'linear-gradient(135deg,#F97316,#EA580C)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg style={{ width: 17, height: 17, color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c0 1.306.835 2.417 2 2.83V21h-2v-2H9v2H7v-2.17A3.001 3.001 0 017 16z"/>
                  </svg>
                </div>
                <div>
                  <p style={{ fontWeight: 800, fontSize: 14, color: '#92400E', margin: 0 }}>Step 1 of 3 — Student Identity</p>
                  <p style={{ fontSize: 12, color: '#B45309', margin: 0 }}>Your account and ID information</p>
                </div>
              </div>

              <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: 18 }}>

                {/* Account info (read-only pills) */}
                <div style={{ background: '#F9FAFB', borderRadius: 12, padding: '14px 16px',
                  border: '1px solid #F3F4F6' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase',
                    letterSpacing: '0.07em', margin: '0 0 10px' }}>Signed in as</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%',
                      background: 'linear-gradient(135deg,#F97316,#FBBF24)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
                      {session?.user?.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: 14, color: '#111827', margin: 0,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {session?.user?.name ?? 'Unknown'}
                      </p>
                      <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {session?.user?.email}
                      </p>
                    </div>
                    <span style={{ marginLeft: 'auto', flexShrink: 0, fontSize: 10, fontWeight: 700,
                      background: '#D1FAE5', color: '#065F46', padding: '3px 8px', borderRadius: 999,
                      border: '1px solid #A7F3D0' }}>Google ✓</span>
                  </div>
                </div>

                {/* Student ID */}
                <Field label="Student ID Number" required hint="Any format — no length limit (e.g. 2024-12345)">
                  <input
                    className="inp-focus"
                    name="studentId" value={form.studentId} onChange={handleChange}
                    placeholder="e.g. 2024-12345 or your school-issued ID"
                    style={{ ...inp }}
                    autoFocus
                  />
                </Field>
              </div>
            </div>

            <button type="button" onClick={goStep2}
              style={{ width: '100%', padding: '14px', borderRadius: 14, fontSize: 15, fontWeight: 800,
                background: 'linear-gradient(135deg,#F97316,#EA580C)', color: 'white',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 6px 20px rgba(249,115,22,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s ease' }}>
              Continue to Academic Info
              <svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/>
              </svg>
            </button>

            <button type="button" onClick={() => router.push('/login')}
              style={{ width: '100%', padding: '11px', background: 'none', border: 'none',
                fontSize: 13, color: '#9CA3AF', cursor: 'pointer', fontFamily: 'inherit',
                marginTop: 8 }}>
              ← Back to Login
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            STEP 2 — Academic Info (strand picker + section)
        ═══════════════════════════════════════════════════ */}
        {step === 2 && (
          <div style={{ animation: 'fadeSlideUp 0.45s ease both' }}>
            <div style={{ background: 'white', borderRadius: 20, border: '1px solid #E5E7EB',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden', marginBottom: 16 }}>

              {/* Card header strip */}
              <div style={{ padding: '16px 22px', background: 'linear-gradient(135deg,#F0F9FF,#E0F2FE)',
                borderBottom: '1px solid #BAE6FD', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#0EA5E9,#0284C7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg style={{ width: 17, height: 17, color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 14l9-5-9-5-9 5 9 5z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
                  </svg>
                </div>
                <div>
                  <p style={{ fontWeight: 800, fontSize: 14, color: '#0369A1', margin: 0 }}>Step 2 of 3 — Academic Details</p>
                  <p style={{ fontSize: 12, color: '#0284C7', margin: 0 }}>Your grade, strand, and section</p>
                </div>
              </div>

              <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: 22 }}>

                {/* Grade Level */}
                <Field label="Grade Level" required>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[11, 12].map(g => (
                      <button key={g} type="button"
                        onClick={() => { setForm(p => ({ ...p, gradeLevel: g })); setError('') }}
                        style={{ padding: '13px', borderRadius: 12, fontSize: 15, fontWeight: 800,
                          border: form.gradeLevel === g ? 'none' : '2px solid #E5E7EB',
                          background: form.gradeLevel === g
                            ? 'linear-gradient(135deg,#F97316,#EA580C)' : 'white',
                          color: form.gradeLevel === g ? 'white' : '#6B7280',
                          cursor: 'pointer', fontFamily: 'inherit',
                          boxShadow: form.gradeLevel === g ? '0 4px 14px rgba(249,115,22,0.4)' : 'none',
                          transition: 'all 0.2s cubic-bezier(0.34,1.2,0.64,1)',
                          transform: form.gradeLevel === g ? 'scale(1.02)' : 'scale(1)' }}>
                        Grade {g}
                      </button>
                    ))}
                  </div>
                </Field>

                {/* Strand picker — visual cards */}
                <Field label="Strand" required hint="Tap a strand to select it.">
                  {strands.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#9CA3AF', fontSize: 13,
                      background: '#F9FAFB', borderRadius: 12, border: '1px dashed #E5E7EB' }}>
                      <div style={{ width: 28, height: 28, border: '3px solid #E5E7EB', borderTopColor: '#F97316',
                        borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
                      Loading strands…
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                      {strands.map(s => {
                        const key = getStrandKey(s.name)
                        const vis = key ? STRAND_VISUAL[key] : null
                        const active = form.strandId === s.id
                        return (
                          <button key={s.id} type="button"
                            className="strand-card"
                            onClick={() => { setForm(p => ({ ...p, strandId: s.id, sectionId: '' })); setError('') }}
                            style={{ padding: '14px 12px', borderRadius: 14, border: active
                                ? `2px solid transparent` : '2px solid #E5E7EB',
                              background: active ? (vis?.grad ?? 'linear-gradient(135deg,#F97316,#EA580C)') : (vis?.light ?? 'white'),
                              cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                              boxShadow: active ? `0 6px 20px rgba(0,0,0,0.15)` : 'none',
                              transform: active ? 'scale(1.03)' : 'scale(1)',
                              position: 'relative', overflow: 'hidden' }}>
                            {active && (
                              <div style={{ position: 'absolute', top: 7, right: 7, width: 20, height: 20,
                                background: 'rgba(255,255,255,0.3)', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 11, fontWeight: 900, color: 'white' }}>✓</div>
                            )}
                            <div style={{ fontSize: 22, marginBottom: 6 }}>{vis?.emoji ?? '📋'}</div>
                            <p style={{ fontWeight: 800, fontSize: 13,
                              color: active ? 'white' : (vis?.color ?? '#374151'), margin: '0 0 3px' }}>
                              {/* show just the strand code if it matches, else full name */}
                              {key ?? s.name}
                            </p>
                            <p style={{ fontSize: 10, color: active ? 'rgba(255,255,255,0.8)' : '#9CA3AF',
                              margin: 0, lineHeight: 1.4 }}>
                              {vis?.desc ?? s.name}
                            </p>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </Field>

                {/* Section picker */}
                {form.strandId && (
                  <Field label="Section" required>
                    {/* Toggle: list vs type */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                      {(['list', 'custom'] as const).map(mode => {
                        const active = (mode === 'custom') === useCustomSection
                        return (
                          <button key={mode} type="button"
                            onClick={() => { setUseCustomSection(mode === 'custom'); setError('') }}
                            style={{ padding: '9px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                              border: active ? 'none' : '1.5px solid #E5E7EB',
                              background: active ? 'linear-gradient(135deg,#1E293B,#334155)' : 'white',
                              color: active ? 'white' : '#6B7280',
                              cursor: 'pointer', fontFamily: 'inherit',
                              boxShadow: active ? '0 3px 10px rgba(0,0,0,0.15)' : 'none',
                              transition: 'all 0.18s ease' }}>
                            {mode === 'list' ? '📋 Select from List' : '✏️ Type My Section'}
                          </button>
                        )
                      })}
                    </div>

                    {!useCustomSection ? (
                      <div style={{ position: 'relative' }}>
                        <select name="sectionId" value={form.sectionId} onChange={handleChange}
                          disabled={!form.strandId}
                          className="inp-focus"
                          style={{ ...inp, appearance: 'none', WebkitAppearance: 'none',
                            paddingRight: 36, color: form.sectionId ? '#111827' : '#9CA3AF' }}>
                          <option value="">{form.strandId ? 'Select your section' : 'Select a strand first'}</option>
                          {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <svg style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                          width: 16, height: 16, color: '#9CA3AF', pointerEvents: 'none' }}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                        </svg>
                        {form.strandId && sections.length === 0 && (
                          <p style={{ fontSize: 12, color: '#D97706', marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span>⚠️</span> No sections found — use &quot;Type My Section&quot; above.
                          </p>
                        )}
                      </div>
                    ) : (
                      <input name="customSection" value={form.customSection} onChange={handleChange}
                        className="inp-focus"
                        placeholder="e.g. Einstein, 12-STEM-1, Section A"
                        style={{ ...inp }}
                      />
                    )}
                    {useCustomSection && (
                      <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6, lineHeight: 1.5 }}>
                        Type your section name exactly. Students who enter the same name will be grouped together.
                      </p>
                    )}
                  </Field>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => { setStep(1); setError('') }}
                style={{ flex: '0 0 auto', padding: '14px 18px', borderRadius: 14, fontSize: 14, fontWeight: 700,
                  background: '#F3F4F6', color: '#374151', border: 'none', cursor: 'pointer',
                  fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/>
                </svg>
                Back
              </button>
              <button type="button" onClick={goStep3}
                style={{ flex: 1, padding: '14px', borderRadius: 14, fontSize: 15, fontWeight: 800,
                  background: 'linear-gradient(135deg,#F97316,#EA580C)', color: 'white',
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: '0 6px 20px rgba(249,115,22,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                Continue to Work Details
                <svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            STEP 3 — Work Immersion Details (optional)
        ═══════════════════════════════════════════════════ */}
        {step === 3 && (
          <form onSubmit={handleSubmit} style={{ animation: 'fadeSlideUp 0.45s ease both' }}>
            <div style={{ background: 'white', borderRadius: 20, border: '1px solid #E5E7EB',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden', marginBottom: 16 }}>

              {/* Card header strip */}
              <div style={{ padding: '16px 22px', background: 'linear-gradient(135deg,#F0FDF4,#DCFCE7)',
                borderBottom: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#10B981,#059669)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg style={{ width: 17, height: 17, color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                  </svg>
                </div>
                <div>
                  <p style={{ fontWeight: 800, fontSize: 14, color: '#065F46', margin: 0 }}>Step 3 of 3 — Work Immersion</p>
                  <p style={{ fontSize: 12, color: '#059669', margin: 0 }}>Optional — you can update this later in your profile</p>
                </div>
              </div>

              <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: 18 }}>

                {/* Summary of what was entered */}
                <div style={{ background: '#F9FAFB', borderRadius: 12, padding: '12px 16px',
                  border: '1px solid #F3F4F6', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    ✓ <strong style={{ color: '#374151' }}>Grade {form.gradeLevel}</strong>
                  </span>
                  {selectedStrand && (
                    <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      · {strandVis?.emoji} <strong style={{ color: '#374151' }}>{selectedStrand.name}</strong>
                    </span>
                  )}
                  {(form.customSection || sections.find(s => s.id === form.sectionId)?.name) && (
                    <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      · 📋 <strong style={{ color: '#374151' }}>{form.customSection || sections.find(s => s.id === form.sectionId)?.name}</strong>
                    </span>
                  )}
                </div>

                <Field label="Company / Establishment"
                  hint="Where you are doing your Work Immersion (e.g. ABC Company, City Hall)">
                  <input name="company" value={form.company} onChange={handleChange}
                    className="inp-focus"
                    placeholder="e.g. ABC Company, City Hall, Local Hospital"
                    style={{ ...inp }} />
                </Field>

                <Field label="Course / Program"
                  hint="Your course or track (e.g. Computer Science, Business Administration)">
                  <input name="course" value={form.course} onChange={handleChange}
                    className="inp-focus"
                    placeholder="e.g. Computer Science, Cookery, Business Administration"
                    style={{ ...inp }} />
                </Field>

                {/* You can fill these in later note */}
                <div style={{ display: 'flex', gap: 10, padding: '11px 14px',
                  background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10,
                  fontSize: 12, color: '#1D4ED8' }}>
                  <svg style={{ width: 15, height: 15, flexShrink: 0, marginTop: 1 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  These fields are optional — you can fill them in later from your profile settings.
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => { setStep(2); setError('') }}
                style={{ flex: '0 0 auto', padding: '14px 18px', borderRadius: 14, fontSize: 14, fontWeight: 700,
                  background: '#F3F4F6', color: '#374151', border: 'none', cursor: 'pointer',
                  fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/>
                </svg>
                Back
              </button>

              <button type="submit" disabled={submitting}
                style={{ flex: 1, padding: '14px', borderRadius: 14, fontSize: 15, fontWeight: 800,
                  background: submitting ? '#FED7AA' : 'linear-gradient(135deg,#10B981,#059669)',
                  color: 'white', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: submitting ? 'none' : '0 6px 20px rgba(16,185,129,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.2s ease' }}>
                {submitting ? (
                  <><div style={{ width: 18, height: 18, border: '3px solid rgba(255,255,255,0.4)',
                    borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  Completing…</>
                ) : (
                  <><svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                  </svg> Complete Registration 🎉</>
                )}
              </button>
            </div>

            <p style={{ textAlign: 'center', fontSize: 12, color: '#9CA3AF', marginTop: 16, lineHeight: 1.5 }}>
              By continuing, you agree to participate in the Work Immersion Program tracking system.
            </p>
          </form>
        )}

      </div>
    </div>
  )
}
