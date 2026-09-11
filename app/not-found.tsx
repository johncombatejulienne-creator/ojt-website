import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#F8FAFC', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      padding: 24,
    }}>
      <div style={{ maxWidth: 440, width: '100%', textAlign: 'center' }}>
        <div style={{
          fontSize: 72, fontWeight: 900, color: '#F97316',
          lineHeight: 1, marginBottom: 16,
        }}>404</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 10px' }}>
          Page Not Found
        </h1>
        <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 28px', lineHeight: 1.6 }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '12px 28px', background: '#F97316', color: 'white',
          borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: 'none',
        }}>
          Back to Home
        </Link>
      </div>
    </div>
  )
}
