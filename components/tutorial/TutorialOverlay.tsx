'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useTutorial } from './TutorialContext'

function scrollToTarget(target?: string) {
  if (!target) return
  try {
    const el = document.querySelector(`[data-tutorial="${target}"]`) as HTMLElement | null
    if (!el) return
    const rect = el.getBoundingClientRect()
    const inView = rect.top >= 80 && rect.bottom <= window.innerHeight - 220
    if (!inView) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  } catch { /* ignore */ }
}

function getTargetRect(target?: string) {
  if (!target) return null
  try {
    const el = document.querySelector(`[data-tutorial="${target}"]`) as HTMLElement | null
    if (!el) return null
    const rect = el.getBoundingClientRect()
    return { top: rect.top, left: rect.left, width: rect.width, height: rect.height,
      bottom: rect.bottom, right: rect.right }
  } catch { return null }
}

export default function TutorialOverlay() {
  const { state, steps, nextStep, prevStep, skipTutorial, finishTutorial } = useTutorial()
  const scrolled = useRef(false)
  const step = steps[state.currentStep]
  const isFirst = state.currentStep === 0
  const isLast = state.currentStep === steps.length - 1
  const isCentered = !step?.target

  // Scroll to target when step changes
  useEffect(() => {
    if (!state.active || !step) return
    scrolled.current = false
    const t = setTimeout(() => {
      scrollToTarget(step.target)
      scrolled.current = true
    }, 100)
    return () => clearTimeout(t)
  }, [state.active, state.currentStep, step])

  // Keyboard nav
  useEffect(() => {
    if (!state.active) return
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') skipTutorial()
      else if (e.key === 'Enter' || e.key === 'ArrowRight') isLast ? finishTutorial() : nextStep()
      else if (e.key === 'ArrowLeft') prevStep()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [state.active, isLast, nextStep, prevStep, skipTutorial, finishTutorial])

  if (!state.active || !step) return null

  const progress = ((state.currentStep + 1) / steps.length) * 100
  const rect = isCentered ? null : getTargetRect(step.target)

  // Spotlight highlight color — amber/gold like reference
  const AMBER = '#F59E0B'
  const AMBER_LIGHT = 'rgba(245,158,11,0.15)'

  return (
    <>
      <style>{`
        @keyframes tut-in { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
        @keyframes tut-fade { from { opacity:0 } to { opacity:1 } }
        @keyframes tut-pulse { 0%,100%{box-shadow:0 0 0 3px rgba(245,158,11,0.6),0 0 0 6px rgba(245,158,11,0.2)} 50%{box-shadow:0 0 0 4px rgba(245,158,11,0.8),0 0 0 8px rgba(245,158,11,0.1)} }
        [data-tutorial-active] { position:relative!important; z-index:10002!important; border-radius:12px!important; animation:tut-pulse 1.8s ease infinite!important; }
      `}</style>

      {/* ── Dark overlay ─────────────────────────────── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        background: 'rgba(15,23,42,0.72)',
        animation: 'tut-fade 0.25s ease',
        pointerEvents: 'none',
      }} />

      {/* ── Spotlight cutout ──────────────────────────── */}
      {rect && !isCentered && (
        <div style={{
          position: 'fixed',
          top: rect.top - 8,
          left: rect.left - 8,
          width: rect.width + 16,
          height: rect.height + 16,
          zIndex: 9999,
          borderRadius: 14,
          boxShadow: `0 0 0 9999px rgba(15,23,42,0.72), 0 0 0 3px ${AMBER}`,
          pointerEvents: 'none',
          transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
          background: AMBER_LIGHT,
        }} />
      )}

      {/* ── Arrow pointer (only when target visible) ─── */}
      {rect && !isCentered && rect.bottom < window.innerHeight - 200 && (
        <div style={{
          position: 'fixed',
          top: rect.bottom + 8,
          left: rect.left + rect.width / 2 - 10,
          zIndex: 10001,
          pointerEvents: 'none',
          transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
        }}>
          <svg width="20" height="12" viewBox="0 0 20 12" fill={AMBER}>
            <path d="M10 0L0 12h20L10 0z"/>
          </svg>
        </div>
      )}

      {/* ── Tutorial card — pinned to bottom ─────────── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Tutorial step ${state.currentStep + 1}`}
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          zIndex: 10003,
          background: 'white',
          borderRadius: '20px 20px 0 0',
          boxShadow: '0 -8px 40px rgba(15,23,42,0.25)',
          animation: 'tut-in 0.3s cubic-bezier(0.34,1.2,0.64,1)',
          fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
          overflow: 'hidden',
          maxHeight: '55vh',
        }}
      >
        {/* Top drag handle */}
        <div style={{ width: 36, height: 4, borderRadius: 999, background: '#E5E7EB',
          margin: '12px auto 0', flexShrink: 0 }} />

        <div style={{ padding: '12px 20px 0' }}>
          {/* Step badge + close */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6,
              background: '#FFFBEB', border: '1px solid #FDE68A',
              borderRadius: 999, padding: '4px 10px 4px 6px' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%',
                background: 'linear-gradient(135deg,#F59E0B,#D97706)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="10" height="10" fill="white" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                </svg>
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#92400E', letterSpacing: '0.05em' }}>
                STEP {state.currentStep + 1} OF {steps.length}
              </span>
            </div>
            <button onClick={skipTutorial}
              style={{ width: 28, height: 28, borderRadius: '50%', background: '#F3F4F6',
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: '#9CA3AF', fontSize: 16, fontFamily: 'inherit' }}>
              ×
            </button>
          </div>

          {/* Progress bar */}
          <div style={{ height: 3, background: '#F3F4F6', borderRadius: 999, marginBottom: 12, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, borderRadius: 999,
              background: 'linear-gradient(90deg,#F59E0B,#F97316)',
              transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)' }} />
          </div>

          {/* Dot indicators */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
            {steps.map((_, i) => (
              <div key={i} style={{
                width: i === state.currentStep ? 16 : 5,
                height: 5, borderRadius: 999,
                background: i === state.currentStep ? '#F59E0B' : i < state.currentStep ? '#FCD34D' : '#E5E7EB',
                transition: 'all 0.3s ease',
              }} />
            ))}
          </div>

          {/* Title */}
          <h3 style={{ fontSize: 16, fontWeight: 900, color: '#111827', margin: '0 0 6px', lineHeight: 1.3 }}>
            {step.title}
          </h3>
          {/* Description */}
          <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6, margin: 0 }}>
            {step.description}
          </p>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px 20px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginTop: 4 }}>
          <button onClick={skipTutorial}
            style={{ fontSize: 13, fontWeight: 600, color: '#9CA3AF', background: 'none',
              border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '8px 4px' }}>
            Skip
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            {!isFirst && (
              <button onClick={prevStep}
                style={{ padding: '10px 18px', borderRadius: 12, fontSize: 13, fontWeight: 700,
                  background: '#F3F4F6', color: '#374151', border: 'none',
                  cursor: 'pointer', fontFamily: 'inherit' }}>
                ← Back
              </button>
            )}
            <button onClick={isLast ? finishTutorial : nextStep}
              style={{ padding: '10px 22px', borderRadius: 12, fontSize: 13, fontWeight: 800,
                background: 'linear-gradient(135deg,#F59E0B,#D97706)', color: 'white',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 3px 10px rgba(245,158,11,0.4)',
                display: 'flex', alignItems: 'center', gap: 5 }}>
              {isLast ? 'Get Started! 🎉' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
