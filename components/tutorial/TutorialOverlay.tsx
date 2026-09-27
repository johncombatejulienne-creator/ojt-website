'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useTutorial } from './TutorialContext'

type TargetRect = { top: number; left: number; width: number; height: number; bottom: number; right: number }

const PAD = 12
const CARD_H = 270
const CARD_MARGIN = 12

function getTargetRect(target?: string): TargetRect | null {
  if (!target) return null
  try {
    const el = document.querySelector(`[data-tutorial="${target}"]`) as HTMLElement | null
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { top: r.top, left: r.left, width: r.width, height: r.height, bottom: r.bottom, right: r.right }
  } catch { return null }
}

function scrollToTarget(target?: string) {
  if (!target) return
  try {
    const el = document.querySelector(`[data-tutorial="${target}"]`) as HTMLElement | null
    if (!el) return
    const r = el.getBoundingClientRect()
    const vph = window.innerHeight
    const idealBottom = vph * 0.45
    if (r.top >= 64 && r.bottom <= idealBottom) return
    const targetY = window.scrollY + r.top - 90
    window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' })
  } catch { /* ignore */ }
}

export default function TutorialOverlay() {
  const { state, steps, nextStep, prevStep, skipTutorial, finishTutorial } = useTutorial()
  const step     = steps[state.currentStep]
  const isFirst  = state.currentStep === 0
  const isLast   = state.currentStep === steps.length - 1
  const isCentered = !step?.target

  const [rect,      setRect]      = useState<TargetRect | null>(null)
  const [visible,   setVisible]   = useState(false)   // controls card fade-in after positioning
  const [direction, setDirection] = useState<'next' | 'prev'>('next')
  const [animKey,   setAnimKey]   = useState(0)        // bump to re-trigger animation on step change
  const prevStep_ = useRef(state.currentStep)

  const updateRect = useCallback(() => {
    if (!step?.target) { setRect(null); return }
    setRect(getTargetRect(step.target))
  }, [step?.target])

  // On step change: detect direction, hide card, scroll, measure, show card
  useEffect(() => {
    if (!state.active || !step) return
    const dir = state.currentStep > prevStep_.current ? 'next' : 'prev'
    setDirection(dir)
    prevStep_.current = state.currentStep
    setVisible(false)
    setRect(null)

    const t1 = setTimeout(() => {
      scrollToTarget(step.target)
      const t2 = setTimeout(() => {
        updateRect()
        setAnimKey(k => k + 1)
        setVisible(true)
      }, 500)
      return () => clearTimeout(t2)
    }, 80)
    return () => clearTimeout(t1)
  }, [state.active, state.currentStep, step, updateRect])

  // Keep spotlight locked during scroll/resize
  useEffect(() => {
    if (!state.active || isCentered) return
    const h = () => updateRect()
    window.addEventListener('scroll', h, { passive: true, capture: true })
    window.addEventListener('resize', h, { passive: true })
    return () => {
      window.removeEventListener('scroll', h, { capture: true })
      window.removeEventListener('resize', h)
    }
  }, [state.active, isCentered, updateRect])

  // Keyboard nav
  useEffect(() => {
    if (!state.active) return
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') skipTutorial()
      else if (e.key === 'ArrowRight' || e.key === 'Enter') isLast ? finishTutorial() : nextStep()
      else if (e.key === 'ArrowLeft') prevStep()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [state.active, isLast, nextStep, prevStep, skipTutorial, finishTutorial])

  if (!state.active || !step) return null

  const progress = ((state.currentStep + 1) / steps.length) * 100
  const AMBER = '#F97316'
  const AMBER_LIGHT = 'rgba(249,115,22,0.12)'

  const vph = typeof window !== 'undefined' ? window.innerHeight : 800
  const vpw = typeof window !== 'undefined' ? window.innerWidth  : 400

  // Card placement: below or above spotlight
  let cardTop: number | undefined
  let cardBottom: number | undefined
  let arrowUp = true  // arrow points up (card is below target)

  if (rect && !isCentered) {
    const spotBottom = rect.bottom + PAD
    const spaceBelow = vph - spotBottom - CARD_MARGIN
    const spaceAbove = rect.top - PAD - CARD_MARGIN
    if (spaceBelow >= CARD_H || spaceBelow >= spaceAbove) {
      cardTop = spotBottom + CARD_MARGIN
      arrowUp = true
    } else {
      cardBottom = vph - (rect.top - PAD - CARD_MARGIN)
      arrowUp = false
    }
  }

  // Slide direction for card animation
  const slideFrom = isCentered ? 'scale(0.94)' : direction === 'next' ? 'translateY(18px)' : 'translateY(-18px)'

  const cardStyle: React.CSSProperties = isCentered
    ? { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: `min(360px,calc(100vw - 32px))` }
    : { position: 'fixed', left: 16, right: 16, ...(cardTop !== undefined ? { top: cardTop } : { bottom: cardBottom }), maxHeight: `min(${CARD_H + 20}px, 46vh)` }

  return (
    <>
      <style>{`
        @keyframes tut-scrim  { from{opacity:0} to{opacity:1} }
        @keyframes tut-spot   { from{opacity:0;transform:scale(0.88)} to{opacity:1;transform:scale(1)} }
        @keyframes tut-card-next { from{opacity:0;transform:${slideFrom}} to{opacity:1;transform:none} }
        @keyframes tut-center { from{opacity:0;transform:translate(-50%,-50%) scale(0.93)} to{opacity:1;transform:translate(-50%,-50%) scale(1)} }
        @keyframes tut-pulse  {
          0%,100%{box-shadow:0 0 0 0 rgba(249,115,22,0),0 0 0 3px ${AMBER},0 0 20px rgba(249,115,22,0.2);}
          50%    {box-shadow:0 0 0 7px rgba(249,115,22,0.1),0 0 0 3px ${AMBER},0 0 28px rgba(249,115,22,0.3);}
        }
        @keyframes tut-arrow-bounce {
          0%,100%{transform:translateY(0)} 50%{transform:translateY(4px)}
        }
      `}</style>

      {/* Dark scrim */}
      <div style={{
        position:'fixed', inset:0, zIndex:9998,
        background:'rgba(15,15,20,0.6)',
        backdropFilter:'blur(1px)',
        animation:'tut-scrim 0.25s ease both',
        pointerEvents:'none',
      }}/>

      {/* Spotlight cutout */}
      {rect && !isCentered && (
        <div style={{
          position:'fixed',
          top: rect.top - PAD, left: rect.left - PAD,
          width: rect.width + PAD*2, height: rect.height + PAD*2,
          zIndex:9999,
          borderRadius:16,
          boxShadow:`0 0 0 9999px rgba(15,15,20,0.6), 0 0 0 3px ${AMBER}, 0 0 0 6px rgba(249,115,22,0.3)`,
          animation:'tut-spot 0.3s cubic-bezier(0.34,1.4,0.64,1) both',
          pointerEvents:'none',
          transition:'top 0.35s cubic-bezier(0.4,0,0.2,1),left 0.35s cubic-bezier(0.4,0,0.2,1),width 0.35s cubic-bezier(0.4,0,0.2,1),height 0.35s cubic-bezier(0.4,0,0.2,1)',
          background: AMBER_LIGHT,
        }}/>
      )}

      {/* Bouncing arrow */}
      {rect && !isCentered && visible && (
        <div style={{
          position:'fixed',
          ...(arrowUp
            ? { top: rect.bottom + PAD + 2 }
            : { bottom: (cardBottom ?? 0) - 12 }),
          left: Math.min(Math.max(rect.left + rect.width/2 - 10, 24), vpw - 44),
          zIndex:10000, pointerEvents:'none',
          animation:'tut-arrow-bounce 1.2s ease infinite',
          transition:'left 0.35s ease, top 0.35s ease',
          opacity: visible ? 1 : 0,
        }}>
          <svg width="20" height="11" viewBox="0 0 20 11" fill={AMBER}>
            {arrowUp ? <path d="M10 11L0 0h20L10 11z"/> : <path d="M10 0L0 11h20L10 0z"/>}
          </svg>
        </div>
      )}

      {/* Tutorial card */}
      <div
        key={animKey}
        role="dialog" aria-modal="true"
        aria-label={`Tutorial step ${state.currentStep + 1} of ${steps.length}`}
        onClick={e => e.stopPropagation()}
        style={{
          ...cardStyle,
          zIndex:10003,
          background:'white',
          borderRadius:22,
          boxShadow:'0 12px 48px rgba(0,0,0,0.14), 0 0 0 1px rgba(249,115,22,0.12)',
          animation: isCentered
            ? 'tut-center 0.38s cubic-bezier(0.34,1.3,0.64,1) both'
            : 'tut-card-next 0.38s cubic-bezier(0.34,1.2,0.64,1) both',
          fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
          overflow:'hidden',
          opacity: visible || isCentered ? 1 : 0,
        }}
      >
        {/* Orange accent top bar */}
        <div style={{
          height:4,
          background:`linear-gradient(90deg,#F97316,#FB923C,#FDBA74)`,
          borderRadius:'22px 22px 0 0',
        }}/>

        <div style={{ padding:'16px 20px 0' }}>
          {/* Step badge + close */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <div style={{
              display:'flex', alignItems:'center', gap:7,
              background:'#FFF7ED', border:'1.5px solid rgba(249,115,22,0.25)',
              borderRadius:999, padding:'5px 12px 5px 7px',
            }}>
              <div style={{
                width:22, height:22, borderRadius:'50%',
                background:'linear-gradient(135deg,#F97316,#FB923C)',
                display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
              }}>
                <svg width="11" height="11" fill="white" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                </svg>
              </div>
              <span style={{ fontSize:11, fontWeight:800, color:'#C2410C', letterSpacing:'0.06em' }}>
                STEP {state.currentStep+1} OF {steps.length}
              </span>
            </div>
            <button onClick={skipTutorial} style={{
              width:30, height:30, borderRadius:'50%',
              background:'#F3F4F6', border:'none', cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center',
              color:'#9CA3AF', fontSize:18, fontFamily:'inherit', flexShrink:0,
              transition:'background 0.15s',
            }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='#E5E7EB'}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='#F3F4F6'}}
            >×</button>
          </div>

          {/* Dot indicators */}
          <div style={{ display:'flex', gap:5, marginBottom:11 }}>
            {steps.map((_,i) => (
              <div key={i} style={{
                height:5, borderRadius:999,
                width: i===state.currentStep ? 20 : 6,
                background: i===state.currentStep ? '#F97316' : i<state.currentStep ? '#FDBA74' : '#E5E7EB',
                transition:'all 0.35s cubic-bezier(0.34,1.3,0.64,1)',
              }}/>
            ))}
          </div>

          {/* Progress bar */}
          <div style={{ height:3, background:'#FEE2E2', borderRadius:999, marginBottom:14, overflow:'hidden' }}>
            <div style={{
              height:'100%', width:`${progress}%`, borderRadius:999,
              background:'linear-gradient(90deg,#F97316,#FB923C,#FDBA74)',
              transition:'width 0.5s cubic-bezier(0.4,0,0.2,1)',
            }}/>
          </div>

          {/* Title */}
          <h3 style={{ fontSize:16, fontWeight:900, color:'#1C1917', margin:'0 0 6px', lineHeight:1.3 }}>
            {step.title}
          </h3>
          {/* Description */}
          <p style={{ fontSize:13, color:'#78716C', lineHeight:1.65, margin:0 }}>
            {step.description}
          </p>
        </div>

        {/* Footer */}
        <div style={{ padding:'13px 20px 18px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <button onClick={skipTutorial} style={{
            fontSize:13, fontWeight:600, color:'#A8A29E',
            background:'none', border:'none', cursor:'pointer',
            fontFamily:'inherit', padding:'8px 4px',
          }}>Skip</button>
          <div style={{ display:'flex', gap:8 }}>
            {!isFirst && (
              <button onClick={prevStep} style={{
                padding:'9px 18px', borderRadius:12, fontSize:13, fontWeight:700,
                background:'#F3F4F6', color:'#374151', border:'none',
                cursor:'pointer', fontFamily:'inherit',
                transition:'background 0.15s',
              }}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='#E5E7EB'}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='#F3F4F6'}}
              >← Back</button>
            )}
            <button onClick={isLast ? finishTutorial : nextStep} style={{
              padding:'9px 22px', borderRadius:12, fontSize:13, fontWeight:800,
              background:'linear-gradient(135deg,#F97316,#FB923C,#FDBA74)',
              color:'white', border:'none', cursor:'pointer', fontFamily:'inherit',
              boxShadow:'0 3px 12px rgba(249,115,22,0.35)',
              display:'flex', alignItems:'center', gap:5,
              transition:'transform 0.15s, box-shadow 0.15s',
            }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-1px)';(e.currentTarget as HTMLElement).style.boxShadow='0 5px 18px rgba(249,115,22,0.45)'}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='';(e.currentTarget as HTMLElement).style.boxShadow='0 3px 12px rgba(249,115,22,0.35)'}}
            >
              {isLast ? 'Get Started! 🎉' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
