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
      background: '#F8FAFC', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      padding: 24,
    }}>
      <div style={{ maxWidth: 440, width: '100%', textAlign: 'center' }}>
        <div style={{
          width: 72, height: 72, background: '#FEF2F2', borderRadius: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <svg style={{ width: 36, height: 36, color: '#DC2626' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 10px' }}>
          Something went wrong
        </h1>
        <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 28px', lineHeight: 1.6 }}>
          An unexpected error occurred. Your data is safe — try refreshing the page.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={reset} style={{
            padding: '12px 24px', background: '#F97316', color: 'white',
            border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Try Again
          </button>
          <a href="/" style={{
            padding: '12px 24px', background: '#F3F4F6', color: '#374151',
            border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center',
          }}>
            Go Home
          </a>
        </div>
      </div>
    </div>
  )
}
