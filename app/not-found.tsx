import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#F8FAFC',
      fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      padding: 24,
    }}>
      <style>{`
        @keyframes floatY { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Decorative top bar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 4,
        background: 'linear-gradient(90deg,#F97316,#FBBF24,#10B981,#6366F1)' }} />

      <div style={{ maxWidth: 460, width: '100%', textAlign: 'center',
        animation: 'fadeSlideUp 0.5s cubic-bezier(0.16,1,0.3,1) both' }}>

        {/* Floating 404 */}
        <div style={{ position: 'relative', marginBottom: 24 }}>
          <div style={{ fontSize: 96, fontWeight: 900, lineHeight: 1,
            background: 'linear-gradient(135deg,#F97316,#FBBF24)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'floatY 4s ease-in-out infinite' }}>
            404
          </div>
          {/* Subtle glow behind number */}
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(249,115,22,0.12) 0%, transparent 70%)',
            pointerEvents: 'none', zIndex: -1 }} />
        </div>

        {/* Icon */}
        <div style={{ width: 64, height: 64, borderRadius: 18, margin: '0 auto 20px',
          background: 'linear-gradient(135deg,#FFF7ED,#FFEDD5)',
          border: '2px solid #FED7AA',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
          🗺️
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#111827', margin: '0 0 10px' }}>
          Page Not Found
        </h1>
        <p style={{ fontSize: 15, color: '#6B7280', margin: '0 0 32px', lineHeight: 1.7 }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Let&apos;s get you back on track.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/dashboard"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '13px 28px', background: 'linear-gradient(135deg,#F97316,#EA580C)',
              color: 'white', borderRadius: 14, fontSize: 14, fontWeight: 700,
              textDecoration: 'none', boxShadow: '0 6px 18px rgba(249,115,22,0.4)',
              transition: 'all 0.2s ease' }}>
            <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
            Go to Dashboard
          </Link>
          <Link href="/narratives"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '13px 24px', background: 'white',
              color: '#374151', borderRadius: 14, fontSize: 14, fontWeight: 700,
              textDecoration: 'none', border: '1.5px solid #E5E7EB',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)', transition: 'all 0.2s ease' }}>
            My Narratives
          </Link>
        </div>

        <p style={{ fontSize: 12, color: '#D1D5DB', marginTop: 32 }}>
          PSBC Work Immersion Portal
        </p>
      </div>
    </div>
  )
}
