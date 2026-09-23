'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Don't show if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }
    // Don't show if user dismissed recently
    const lastDismissed = localStorage.getItem('pwa-install-dismissed')
    if (lastDismissed) {
      const daysSince = (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24)
      if (daysSince < 7) return // Don't show again for 7 days
    }

    // iOS detection
    const ua = navigator.userAgent
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream
    if (isIOSDevice) {
      setIsIOS(true)
      setShowBanner(true)
      return
    }

    // Android/Chrome — listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowBanner(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') setShowBanner(false)
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setShowBanner(false)
    setDismissed(true)
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  if (isInstalled || !showBanner || dismissed) return null

  return (
    <>
      <style>{`@keyframes slideUpIn{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
        padding: '12px 16px 16px',
        background: 'white',
        borderTop: '1px solid #E5E7EB',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.12)',
        animation: 'slideUpIn 0.35s cubic-bezier(0.34,1.2,0.64,1) both',
        fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            {/* App icon */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon-72.png" alt="App icon"
              style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 800, fontSize: 14, color: '#111827', margin: '0 0 2px' }}>
                Install Work Immersion Portal
              </p>
              <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>
                {isIOS
                  ? 'Add to Home Screen for the best experience'
                  : 'Install for fast, offline-ready access'}
              </p>
            </div>
            <button onClick={handleDismiss}
              style={{ width: 28, height: 28, borderRadius: '50%', background: '#F3F4F6',
                border: 'none', cursor: 'pointer', fontSize: 16, color: '#6B7280',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              ×
            </button>
          </div>

          {isIOS ? (
            /* iOS instructions */
            <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 12,
              padding: '12px 14px', fontSize: 13, color: '#92400E', lineHeight: 1.6 }}>
              <p style={{ margin: '0 0 6px', fontWeight: 700 }}>To install on iOS:</p>
              <ol style={{ margin: 0, paddingLeft: 18 }}>
                <li>Tap the <strong>Share</strong> button <span style={{ fontSize: 15 }}>⬆</span> in Safari</li>
                <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                <li>Tap <strong>"Add"</strong> to confirm</li>
              </ol>
            </div>
          ) : (
            /* Android/Chrome install button */
            <button onClick={handleInstall}
              style={{ width: '100%', padding: '13px',
                background: 'linear-gradient(135deg,#F97316,#EA580C)',
                color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 14px rgba(249,115,22,0.4)',
                fontFamily: 'inherit' }}>
              <svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              Install App
            </button>
          )}
        </div>
      </div>
    </>
  )
}
