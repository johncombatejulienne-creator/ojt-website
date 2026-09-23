'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#F8FAFC',
      fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      padding: 24,
    }}>
      <style>{`
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }
      `}</style>

      {/* Decorative top bar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 4,
        background: 'linear-gradient(90deg,#EF4444,#F97316,#FBBF24)' }} />

      <div style={{ maxWidth: 460, width: '100%', textAlign: 'center',
        animation: 'fadeSlideUp 0.5s cubic-bezier(0.16,1,0.3,1) both' }}>

        {/* Error icon */}
        <div style={{ width: 80, height: 80, borderRadius: 22, margin: '0 auto 24px',
          background: 'linear-gradient(135deg,#FEE2E2,#FECACA)',
          border: '2px solid #FECACA',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'shake 0.5s ease 0.3s both' }}>
          <svg style={{ width: 40, height: 40, color: '#DC2626' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          </svg>
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#111827', margin: '0 0 10px' }}>
          Something Went Wrong
        </h1>
        <p style={{ fontSize: 15, color: '#6B7280', margin: '0 0 8px', lineHeight: 1.7 }}>
          An unexpected error occurred. Your data is safe — this is usually a temporary issue.
        </p>

        {/* Error digest (for debugging, subtle) */}
        {error.digest && (
          <p style={{ fontSize: 11, color: '#D1D5DB', margin: '0 0 28px',
            fontFamily: 'monospace', background: '#F9FAFB', padding: '6px 12px',
            borderRadius: 8, display: 'inline-block' }}>
            Error ID: {error.digest}
          </p>
        )}
        {!error.digest && <div style={{ marginBottom: 28 }} />}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={reset}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '13px 28px', background: 'linear-gradient(135deg,#F97316,#EA580C)',
              color: 'white', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 6px 18px rgba(249,115,22,0.4)' }}>
            <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Try Again
          </button>
          <a href="/dashboard"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '13px 24px', background: 'white',
              color: '#374151', borderRadius: 14, fontSize: 14, fontWeight: 700,
              textDecoration: 'none', border: '1.5px solid #E5E7EB',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
            Go Home
          </a>
        </div>

        <p style={{ fontSize: 12, color: '#D1D5DB', marginTop: 32 }}>
          PSBC Work Immersion Portal
        </p>
      </div>
    </div>
  )
}
