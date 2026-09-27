'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useTutorial } from './TutorialContext'

type TargetRect = { top: number; left: number; width: number; height: number; bottom: number; right: number }

const PAD = 10          // spotlight padding around target
const CARD_H = 260      // estimated card height for placement math
const CARD_MARGIN = 14  // gap between spotlight and card

function scrollToTarget(target?: string) {
  if (!target) return
  try {
    const el = document.querySelector(`[data-tutorial="${target}"]`) as HTMLElement | null
    if (!el) return
    const rect = el.getBoundingClientRect()
    const vph  = window.innerHeight
    // We want the element to sit in the top 40% so the card has room below it.
    // If it's already there, don't scroll.
    const idealBottom = vph * 0.42
    if (rect.top >= 64 && rect.bottom <= idealBottom) return

    // Scroll so the element top is ~80px from viewport top
    const targetScrollY = window.scrollY + rect.top - 90
    window.scrollTo({ top: Math.max(0, targetScrollY), behavior: 'smooth' })
  } catch { /* ignore */ }
}

function getTargetRect(target?: string): TargetRect | null {
  if (!target) return null
  try {
    const el = document.querySelector(`[data-tutorial="${target}"]`) as HTMLElement | null
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { top: r.top, left: r.left, width: r.width, height: r.height, bottom: r.bottom, right: r.right }
  } catch { return null }
}

export default function TutorialOverlay() {
  const { state, steps, nextStep, prevStep, skipTutorial, finishTutorial } = useTutorial()
  const scrolled = useRef(false)
  const step     = steps[state.currentStep]
  const isFirst  = state.currentStep === 0
  const isLast   = state.currentStep === steps.length - 1
  const isCentered = !step?.target

  const [rect, setRect] = useState<TargetRect | null>(null)

  const updateRect = useCallback(() => {
    if (!step?.target) { setRect(null); return }
    setRect(getTargetRect(step.target))
  }, [step?.target])

  // Scroll then measure — re-measure after scroll settles
  useEffect(() => {
    if (!state.active || !step) return
    scrolled.current = false
    setRect(null)
    const t1 = setTimeout(() => {
      scrollToTarget(step.target)
      scrolled.current = true
      const t2 = setTimeout(updateRect, 600)
      return () => clearTimeout(t2)
    }, 120)
    return () => clearTimeout(t1)
  }, [state.active, state.currentStep, step, updateRect])

  // Keep highlight locked to element during scroll / resize
  useEffect(() => {
    if (!state.active || isCentered) return
    const handler = () => updateRect()
    window.addEventListener('scroll', handler, { passive: true, capture: true })
    window.addEventListener('resize', handler, { passive: true })
    return () => {
      window.removeEventListener('scroll', handler, { capture: true })
      window.removeEventListener('resize', handler)
    }
  }, [state.active, isCentered, updateRect])

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
  const AMBER = '#F5A623'
  const AMBER_GLOW = 'rgba(245,166,35,0.25)'

  // ── Card position: below spotlight if space, otherwise above ──
  const vph = typeof window !== 'undefined' ? window.innerHeight : 800
  const vpw = typeof window !== 'undefined' ? window.innerWidth  : 400

  let cardTop: number | undefined
  let cardBottom: number | undefined

  if (rect && !isCentered) {
    const spotBottom = rect.bottom + PAD
    const spaceBelow = vph - spotBottom - CARD_MARGIN
    const spaceAbove = rect.top - PAD - CARD_MARGIN

    if (spaceBelow >= CARD_H) {
      // Place below — most common
      cardTop = spotBottom + CARD_MARGIN
    } else if (spaceAbove >= CARD_H) {
      // Place above
      cardBottom = vph - (rect.top - PAD - CARD_MARGIN)
    } else {
      // Fallback: below but scrollable
      cardTop = spotBottom + CARD_MARGIN
    }
  }

  const cardStyle: React.CSSProperties = isCentered
    ? {
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: `min(360px, calc(100vw - 32px))`,
      }
    : {
        position: 'fixed',
        left: 16,
        right: 16,
        ...(cardTop    !== undefined ? { top: cardTop }                : {}),
        ...(cardBottom !== undefined ? { bottom: cardBottom }          : {}),
        maxHeight: `min(${CARD_H + 20}px, 45vh)`,
      }

  return (
    <>
      <style>{`
        @keyframes tut-in   { from { opacity:0; transform:translateY(12px) scale(0.97) } to { opacity:1; transform:translateY(0) scale(1) } }
        @keyframes tut-cin  { from { opacity:0; transform:translate(-50%,-48%) scale(0.96) } to { opacity:1; transform:translate(-50%,-50%) scale(1) } }
        @keyframes tut-fade { from { opacity:0 } to { opacity:1 } }
        @keyframes tut-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(245,166,35,0), 0 0 0 3px ${AMBER}, 0 0 20px ${AMBER_GLOW}; }
          50%     { box-shadow: 0 0 0 6px rgba(245,166,35,0.12), 0 0 0 3px ${AMBER}, 0 0 28px ${AMBER_GLOW}; }
        }
      `}</style>

      {/* ── Dark scrim — pointer-events off so the target stays clickable ── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        background: 'rgba(10,10,20,0.68)',
        animation: 'tut-fade 0.2s ease',
        pointerEvents: 'none',
      }} />

      {/* ── Spotlight cutout (uses box-shadow hole trick) ── */}
      {rect && !isCentered && (
        <div style={{
          position: 'fixed',
          top:    rect.top  - PAD,
          left:   rect.left - PAD,
          width:  rect.width  + PAD * 2,
          height: rect.height + PAD * 2,
          zIndex: 9999,
          borderRadius: 14,
          /* giant box-shadow punches a hole through the scrim */
          boxShadow: `0 0 0 9999px rgba(10,10,20,0.68), 0 0 0 3px ${AMBER}, 0 0 24px ${AMBER_GLOW}`,
          animation: 'tut-pulse 2s ease infinite',
          pointerEvents: 'none',
          transition: 'top 0.25s ease, left 0.25s ease, width 0.25s ease, height 0.25s ease',
          background: 'transparent',
        }} />
      )}

      {/* ── Arrow: points from spotlight down toward card (or up) ── */}
      {rect && !isCentered && cardTop !== undefined && (
        <div style={{
          position: 'fixed',
          top: rect.bottom + PAD + 2,
          left: Math.min(
            Math.max(rect.left + rect.width / 2 - 10, 24),
            vpw - 44
          ),
          zIndex: 10000,
          pointerEvents: 'none',
          transition: 'top 0.25s ease, left 0.25s ease',
        }}>
          <svg width="20" height="10" viewBox="0 0 20 10" fill={AMBER}>
            <path d="M10 10L0 0h20L10 10z"/>
          </svg>
        </div>
      )}
      {rect && !isCentered && cardBottom !== undefined && (
        <div style={{
          position: 'fixed',
          bottom: cardBottom - 10,
          left: Math.min(
            Math.max(rect.left + rect.width / 2 - 10, 24),
            vpw - 44
          ),
          zIndex: 10000,
          pointerEvents: 'none',
        }}>
          <svg width="20" height="10" viewBox="0 0 20 10" fill={AMBER}>
            <path d="M10 0L0 10h20L10 0z"/>
          </svg>
        </div>
      )}

      {/* ── Tutorial card ─────────────────────────────────── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Tutorial step ${state.currentStep + 1} of ${steps.length}`}
        onClick={e => e.stopPropagation()}
        style={{
          ...cardStyle,
          zIndex: 10003,
          background: 'white',
          borderRadius: 20,
          boxShadow: '0 8px 40px rgba(0,0,0,0.18), 0 0 0 1px rgba(245,166,35,0.15)',
          animation: isCentered ? 'tut-cin 0.32s cubic-bezier(0.34,1.2,0.64,1)' : 'tut-in 0.3s cubic-bezier(0.34,1.2,0.64,1)',
          fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '18px 20px 0' }}>
          {/* Step badge + close */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7,
              background: '#FFFBF0', border: `1.5px solid ${AMBER}40`,
              borderRadius: 999, padding: '5px 12px 5px 7px' }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%',
                background: `linear-gradient(135deg,${AMBER},#D97706)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="11" height="11" fill="white" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                </svg>
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#92400E', letterSpacing: '0.06em' }}>
                STEP {state.currentStep + 1} OF {steps.length}
              </span>
            </div>
            <button onClick={skipTutorial}
              style={{ width: 30, height: 30, borderRadius: '50%', background: '#F3F4F6',
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: '#9CA3AF', fontSize: 17, fontFamily: 'inherit',
                flexShrink: 0 }}>
              ×
            </button>
          </div>

          {/* Dot indicators */}
          <div style={{ display: 'flex', gap: 5, marginBottom: 12 }}>
            {steps.map((_, i) => (
              <div key={i} style={{
                height: 5, borderRadius: 999,
                width: i === state.currentStep ? 20 : 6,
                background: i === state.currentStep ? AMBER : i < state.currentStep ? '#FCD34D' : '#E5E7EB',
                transition: 'all 0.3s ease',
              }} />
            ))}
          </div>

          {/* Progress bar */}
          <div style={{ height: 3, background: '#F3F4F6', borderRadius: 999, marginBottom: 14, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, borderRadius: 999,
              background: `linear-gradient(90deg,${AMBER},#D97706)`,
              transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)' }} />
          </div>

          {/* Title */}
          <h3 style={{ fontSize: 16, fontWeight: 900, color: '#1A1A2E', margin: '0 0 6px', lineHeight: 1.3 }}>
            {step.title}
          </h3>
          {/* Description */}
          <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.65, margin: 0 }}>
            {step.description}
          </p>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px 18px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between' }}>
          <button onClick={skipTutorial}
            style={{ fontSize: 13, fontWeight: 600, color: '#9CA3AF', background: 'none',
              border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '8px 4px' }}>
            Skip
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            {!isFirst && (
              <button onClick={prevStep}
                style={{ padding: '9px 18px', borderRadius: 12, fontSize: 13, fontWeight: 700,
                  background: '#F3F4F6', color: '#374151', border: 'none',
                  cursor: 'pointer', fontFamily: 'inherit' }}>
                ← Back
              </button>
            )}
            <button onClick={isLast ? finishTutorial : nextStep}
              style={{ padding: '9px 22px', borderRadius: 12, fontSize: 13, fontWeight: 800,
                background: `linear-gradient(135deg,${AMBER},#D97706)`, color: 'white',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: `0 3px 10px rgba(245,166,35,0.4)`,
                display: 'flex', alignItems: 'center', gap: 5 }}>
              {isLast ? 'Get Started! 🎉' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
