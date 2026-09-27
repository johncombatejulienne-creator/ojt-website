'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useTutorial } from './TutorialContext'

interface Rect { top: number; left: number; width: number; height: number }

function getTargetRect(target?: string): Rect | null {
  if (!target) return null
  try {
    const el = document.querySelector(`[data-tutorial="${target}"]`) as HTMLElement
    if (!el) return null
    const rect = el.getBoundingClientRect()
    return {
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
      height: rect.height,
    }
  } catch { return null }
}

function scrollToTarget(target?: string) {
  if (!target) return
  try {
    const el = document.querySelector(`[data-tutorial="${target}"]`) as HTMLElement
    if (!el) return
    const rect = el.getBoundingClientRect()
    const inView = rect.top >= 80 && rect.bottom <= window.innerHeight - 80
    if (!inView) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  } catch { /* ignore */ }
}

export default function TutorialOverlay() {
  const { state, steps, nextStep, prevStep, skipTutorial, finishTutorial } = useTutorial()
  const [targetRect, setTargetRect] = useState<Rect | null>(null)
  const [cardPos, setCardPos] = useState({ top: '50%', left: '50%', transform: 'translate(-50%,-50%)' } as React.CSSProperties)
  const [visible, setVisible] = useState(false)
  const resizeRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentStep = steps[state.currentStep]
  const isFirst = state.currentStep === 0
  const isLast = state.currentStep === steps.length - 1
  const isCentered = !currentStep?.target || currentStep?.placement === 'center'
  const PAD = 16

  const updatePosition = useCallback(() => {
    if (!state.active || !currentStep) return
    const rect = getTargetRect(currentStep.target)
    setTargetRect(rect)

    if (!rect || isCentered) {
      setCardPos({ top: '50%', left: '50%', transform: 'translate(-50%,-50%)' })
      return
    }

    const VW = window.innerWidth
    const VH = window.innerHeight
    const CARD_W = Math.min(320, VW - 32)
    const CARD_H = 220
    const placement = currentStep.placement ?? 'bottom'

    let top = 0, left = 0

    const absTop = rect.top - window.scrollY
    const absLeft = rect.left - window.scrollX

    if (placement === 'bottom' && absTop + rect.height + CARD_H + PAD < VH) {
      top = rect.top + rect.height + PAD
      left = Math.max(PAD, Math.min(rect.left + rect.width / 2 - CARD_W / 2, window.scrollX + VW - CARD_W - PAD))
    } else if (placement === 'top' && absTop - CARD_H - PAD > 0) {
      top = rect.top - CARD_H - PAD
      left = Math.max(PAD, Math.min(rect.left + rect.width / 2 - CARD_W / 2, window.scrollX + VW - CARD_W - PAD))
    } else if (placement === 'right' && absLeft + rect.width + CARD_W + PAD < VW) {
      top = rect.top + rect.height / 2 - CARD_H / 2
      left = rect.left + rect.width + PAD
    } else if (placement === 'left' && absLeft - CARD_W - PAD > 0) {
      top = rect.top + rect.height / 2 - CARD_H / 2
      left = rect.left - CARD_W - PAD
    } else {
      // Fallback: bottom
      top = rect.top + rect.height + PAD
      left = Math.max(PAD + window.scrollX, Math.min(rect.left + rect.width / 2 - CARD_W / 2, window.scrollX + VW - CARD_W - PAD))
      // If that's off screen, go above
      if (top - window.scrollY + CARD_H > VH) {
        top = rect.top - CARD_H - PAD
      }
    }

    setCardPos({ position: 'absolute', top, left, transform: 'none' })
  }, [state.active, currentStep, isCentered])

  // Scroll then position
  useEffect(() => {
    if (!state.active || !currentStep) return
    setVisible(false)
    scrollToTarget(currentStep.target)
    const t = setTimeout(() => {
      updatePosition()
      setVisible(true)
    }, 400)
    return () => clearTimeout(t)
  }, [state.active, state.currentStep, currentStep, updatePosition])

  // Reposition on resize
  useEffect(() => {
    const handler = () => {
      if (resizeRef.current) clearTimeout(resizeRef.current)
      resizeRef.current = setTimeout(updatePosition, 150)
    }
    window.addEventListener('resize', handler)
    window.addEventListener('scroll', handler, { passive: true })
    return () => {
      window.removeEventListener('resize', handler)
      window.removeEventListener('scroll', handler)
    }
  }, [updatePosition])

  // Keyboard nav
  useEffect(() => {
    if (!state.active) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') skipTutorial()
      if (e.key === 'ArrowRight' || e.key === 'Enter') isLast ? finishTutorial() : nextStep()
      if (e.key === 'ArrowLeft') prevStep()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [state.active, isLast, nextStep, prevStep, skipTutorial, finishTutorial])

  if (!state.active || !currentStep) return null

  const CARD_W = Math.min(320, window.innerWidth - 32)
  const progress = ((state.currentStep + 1) / steps.length) * 100

  return (
    <>
      <style>{`
        @keyframes tutFadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes tutSlideUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        @keyframes tutPulse { 0%,100%{box-shadow:0 0 0 4px rgba(249,115,22,0.4)} 50%{box-shadow:0 0 0 8px rgba(249,115,22,0.15)} }
        .tut-highlight { position:relative; z-index:10001!important; border-radius:12px; animation:tutPulse 2s ease infinite; outline:3px solid #F97316; outline-offset:4px; }
      `}</style>

      {/* ── Overlay ──────────────────────────────────────── */}
      <div
        onClick={e => { if (e.target === e.currentTarget) skipTutorial() }}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          animation: 'tutFadeIn 0.2s ease',
          pointerEvents: 'auto',
          // SVG cutout spotlight
          background: isCentered || !targetRect
            ? 'rgba(0,0,0,0.65)'
            : 'transparent',
        }}
      >
        {/* Spotlight cutout using box-shadow trick */}
        {!isCentered && targetRect && (
          <div style={{
            position: 'absolute',
            top: targetRect.top - window.scrollY - 8,
            left: targetRect.left - window.scrollX - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            borderRadius: 14,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.65)',
            zIndex: 10000,
            pointerEvents: 'none',
          }} />
        )}
      </div>

      {/* ── Tutorial Card ─────────────────────────────── */}
      <div
        style={{
          position: isCentered ? 'fixed' : 'absolute',
          ...(isCentered
            ? { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }
            : cardPos
          ),
          zIndex: 10002,
          width: CARD_W,
          maxWidth: 'calc(100vw - 32px)',
          background: 'white',
          borderRadius: 20,
          boxShadow: '0 24px 64px rgba(0,0,0,0.3), 0 0 0 1px rgba(249,115,22,0.2)',
          overflow: 'hidden',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.25s ease',
          fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
        }}
      >
        {/* Top accent bar */}
        <div style={{ height: 4, background: 'linear-gradient(90deg,#F97316,#FBBF24)' }} />

        <div style={{ padding: '18px 20px 16px' }}>
          {/* Step indicator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%',
                background: 'linear-gradient(135deg,#F97316,#EA580C)',
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg style={{ width: 14, height: 14, color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                </svg>
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                STEP {state.currentStep + 1} OF {steps.length}
              </span>
            </div>
            <button onClick={skipTutorial}
              style={{ width: 28, height: 28, borderRadius: '50%', background: '#F3F4F6',
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#9CA3AF', fontSize: 18, lineHeight: 1 }}>
              ×
            </button>
          </div>

          {/* Progress bar */}
          <div style={{ height: 4, background: '#F3F4F6', borderRadius: 999, marginBottom: 14, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, borderRadius: 999,
              background: 'linear-gradient(90deg,#F97316,#FBBF24)',
              transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)' }} />
          </div>

          {/* Dot indicators */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginBottom: 14 }}>
            {steps.map((_, i) => (
              <div key={i} style={{
                width: i === state.currentStep ? 18 : 6,
                height: 6, borderRadius: 999,
                background: i === state.currentStep ? '#F97316' : i < state.currentStep ? '#FBBF24' : '#E5E7EB',
                transition: 'all 0.3s ease',
              }} />
            ))}
          </div>

          {/* Content */}
          <h3 style={{ fontSize: 16, fontWeight: 900, color: '#111827', margin: '0 0 8px', lineHeight: 1.3 }}>
            {currentStep.title}
          </h3>
          <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.65, margin: 0 }}>
            {currentStep.description}
          </p>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderTop: '1px solid #F9FAFB' }}>
          <button onClick={skipTutorial}
            style={{ fontSize: 13, fontWeight: 600, color: '#9CA3AF', background: 'none', border: 'none',
              cursor: 'pointer', fontFamily: 'inherit' }}>
            Skip
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            {!isFirst && (
              <button onClick={prevStep}
                style={{ padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                  background: '#F3F4F6', color: '#374151', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                ← Back
              </button>
            )}
            <button onClick={isLast ? finishTutorial : nextStep}
              style={{ padding: '9px 20px', borderRadius: 10, fontSize: 13, fontWeight: 800,
                background: 'linear-gradient(135deg,#F97316,#EA580C)', color: 'white',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 3px 10px rgba(249,115,22,0.4)',
                display: 'flex', alignItems: 'center', gap: 5 }}>
              {isLast ? 'Get Started!' : 'Next →'}
            </button>
          </div>
        </div>
      </div>

      {/* Arrow pointer toward target */}
      {!isCentered && targetRect && visible && (() => {
        const targetCenterX = targetRect.left - window.scrollX + targetRect.width / 2
        const targetCenterY = targetRect.top - window.scrollY + targetRect.height / 2
        const placement = currentStep.placement ?? 'bottom'
        const arrowStyle: React.CSSProperties = {
          position: 'fixed', zIndex: 10003, pointerEvents: 'none',
          width: 20, height: 20,
        }
        if (placement === 'bottom') {
          arrowStyle.top = targetRect.top - window.scrollY + targetRect.height + PAD - 8
          arrowStyle.left = targetCenterX - 10
        } else if (placement === 'top') {
          arrowStyle.top = targetRect.top - window.scrollY - PAD - 12
          arrowStyle.left = targetCenterX - 10
          arrowStyle.transform = 'rotate(180deg)'
        }
        return (
          <svg style={arrowStyle} viewBox="0 0 20 20" fill="#F97316">
            <path d="M10 0L0 20h20L10 0z"/>
          </svg>
        )
      })()}
    </>
  )
}
