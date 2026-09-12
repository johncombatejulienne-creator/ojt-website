'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'

/**
 * PageEffects
 * Mounts once in the root layout.
 * Handles:
 *   1. Page loader / opening animation
 *   2. Scroll progress bar
 *   3. IntersectionObserver scroll-reveal for .reveal* classes
 *   4. Ripple effect on .ripple elements
 *   5. Header glass scroll effect
 *   6. Re-triggers scroll reveal on route change
 */
export default function PageEffects() {
  const pathname = usePathname()

  /* ── Page loader (first visit only) ──────────────────── */
  useEffect(() => {
    // Mark JS as ready — enables scroll-reveal hiding
    document.documentElement.classList.add('js-ready')

    const loader = document.getElementById('page-loader')
    if (!loader) return
    if (loader.classList.contains('loader-hidden')) return

    const hide = () => {
      loader.classList.add('loader-hidden')
      setTimeout(() => { loader.style.display = 'none' }, 600)
    }

    if (document.readyState === 'complete') {
      setTimeout(hide, 700)
    } else {
      window.addEventListener('load', () => setTimeout(hide, 700), { once: true })
    }
  }, [])

  /* ── Page-enter animation on route change ────────────── */
  useEffect(() => {
    // Apply entrance animation to the outermost content wrapper
    const wrapper = document.getElementById('content-wrapper')
    if (!wrapper) return
    wrapper.style.animation = 'none'
    void wrapper.offsetWidth
    wrapper.style.animation = 'blurIn 0.4s cubic-bezier(0.16,1,0.3,1) both'
  }, [pathname])

  /* ── Scroll progress bar ─────────────────────────────── */
  useEffect(() => {
    const bar = document.getElementById('scroll-progress')
    if (!bar) return
    const update = () => {
      const scrolled = window.scrollY
      const total    = document.documentElement.scrollHeight - window.innerHeight
      const pct      = total > 0 ? (scrolled / total) * 100 : 0
      bar.style.width = `${pct}%`
    }
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  /* ── IntersectionObserver scroll reveal ─────────────── */
  useEffect(() => {
    const revealEls = document.querySelectorAll(
      '.reveal, .reveal-left, .reveal-right, .reveal-scale'
    )
    if (!revealEls.length) return

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Small delay to ensure layout is stable
            setTimeout(() => {
              entry.target.classList.add('revealed')
            }, 50)
            obs.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.05, rootMargin: '0px 0px -20px 0px' }
    )

    revealEls.forEach(el => {
      // Elements already in viewport get revealed immediately
      const rect = el.getBoundingClientRect()
      if (rect.top < window.innerHeight - 20) {
        setTimeout(() => el.classList.add('revealed'), 100)
      } else {
        obs.observe(el)
      }
    })
    return () => obs.disconnect()
  }, [pathname])

  /* ── Ripple effect ───────────────────────────────────── */
  useEffect(() => {
    const triggerRipple = (clientX: number, clientY: number, target: HTMLElement) => {
      if (target.closest('#page-loader')) return
      const rect = target.getBoundingClientRect()
      const size = Math.max(rect.width, rect.height) * 1.8
      const x    = clientX - rect.left - size / 2
      const y    = clientY - rect.top  - size / 2
      const ripple = document.createElement('span')
      ripple.className = 'ripple-effect'
      const isDark = ['#F97316','#EA580C','#10B981','#059669','#6366F1','#8B5CF6','#1E293B']
        .some(c => (target.style?.background ?? '').includes(c))
      ripple.style.cssText = `
        width:${size}px; height:${size}px; left:${x}px; top:${y}px;
        background:${isDark ? 'rgba(255,255,255,0.22)' : 'rgba(249,115,22,0.15)'};
      `
      if (getComputedStyle(target).position === 'static') target.style.position = 'relative'
      target.style.overflow = 'hidden'
      target.appendChild(ripple)
      ripple.addEventListener('animationend', () => ripple.remove(), { once: true })
    }

    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('button, a, [role="button"]') as HTMLElement | null
      if (!target) return
      triggerRipple(e.clientX, e.clientY, target)
    }

    const handleTouch = (e: TouchEvent) => {
      const touch  = e.touches[0]
      if (!touch) return
      const target = (touch.target as HTMLElement).closest('button, a, [role="button"]') as HTMLElement | null
      if (!target) return
      triggerRipple(touch.clientX, touch.clientY, target)
    }

    document.addEventListener('click', handleClick)
    document.addEventListener('touchstart', handleTouch, { passive: true })
    return () => {
      document.removeEventListener('click', handleClick)
      document.removeEventListener('touchstart', handleTouch)
    }
  }, [])

  /* ── Universal touch press feedback ────────────────────── */
  useEffect(() => {
    // Elements that should animate on press
    const SELECTORS = [
      'button',
      'a',
      '[role="button"]',
      '.card-hover',
      '.card-entrance',
      '.stats-grid > div',
      '.grid-3 > div',
      '.grid-2 > div',
      '[style*="cursor: pointer"]',
      '[style*="cursor:pointer"]',
    ].join(', ')

    const pressed = new WeakSet<Element>()

    const onStart = (e: TouchEvent) => {
      const target = (e.target as HTMLElement).closest(SELECTORS) as HTMLElement | null
      if (!target || pressed.has(target)) return
      pressed.add(target)

      // Store original transform
      const orig = target.style.transform || ''
      target.dataset.origTransform = orig
      target.style.transition = 'transform 0.1s cubic-bezier(0.4,0,0.2,1), opacity 0.1s ease'
      target.style.transform  = 'scale(0.94)'
      target.style.opacity    = '0.82'
    }

    const onEnd = (e: TouchEvent | MouseEvent) => {
      const src = 'changedTouches' in e
        ? (e as TouchEvent).changedTouches[0]?.target
        : (e as MouseEvent).target
      const target = (src as HTMLElement)?.closest?.(SELECTORS) as HTMLElement | null
      if (!target) return
      pressed.delete(target)

      const orig = target.dataset.origTransform ?? ''
      target.style.transition = 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s ease'
      target.style.transform  = orig
      target.style.opacity    = '1'
    }

    document.addEventListener('touchstart', onStart, { passive: true })
    document.addEventListener('touchend',   onEnd,   { passive: true })
    document.addEventListener('touchcancel',onEnd,   { passive: true })
    // Also handle mouse for desktop
    document.addEventListener('mousedown', (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest(SELECTORS) as HTMLElement | null
      if (!target) return
      target.dataset.origTransform = target.style.transform || ''
      target.style.transition = 'transform 0.08s ease, opacity 0.08s ease'
      target.style.transform  = 'scale(0.96)'
      target.style.opacity    = '0.88'
    })
    document.addEventListener('mouseup', onEnd)
    document.addEventListener('mouseleave', onEnd, true)

    return () => {
      document.removeEventListener('touchstart',  onStart)
      document.removeEventListener('touchend',    onEnd)
      document.removeEventListener('touchcancel', onEnd)
    }
  }, [])
  useEffect(() => {
    const header = document.querySelector('header')
    if (!header) return
    const onScroll = () => {
      if (window.scrollY > 20) {
        header.classList.add('header-scrolled')
      } else {
        header.classList.remove('header-scrolled')
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [pathname])

  return (
    <>
      {/* ── Scroll progress bar ───────── */}
      <div id="scroll-progress" aria-hidden="true" />

      {/* ── Page loader ───────────────── */}
      <div id="page-loader" role="status" aria-label="Loading">
        <div className="loader-logo-wrap">
          <div style={{
            width: 72, height: 72, borderRadius: 18, background: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 6, boxShadow: '0 8px 32px rgba(249,115,22,0.4)',
          }}>
            <Image
              src="/psbc-logo.svg"
              alt="PSBC"
              width={60}
              height={60}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              priority
            />
          </div>
        </div>
        <div className="loader-ring" />
        <p className="loader-text">PSBC Work Immersion</p>
      </div>
    </>
  )
}
