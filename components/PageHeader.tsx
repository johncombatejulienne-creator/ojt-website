'use client'

import { useRouter } from 'next/navigation'
import { ShareButton } from '@/components/ui/ShareButton'
import type { ShareOptions } from '@/lib/sharing'

interface PageHeaderProps {
  title: string
  subtitle?: string
  backHref?: string
  backLabel?: string
  action?: React.ReactNode
  shareOptions?: Omit<ShareOptions, 'fallbackMessage'>
}

export default function PageHeader({
  title,
  subtitle,
  backHref = '/dashboard',
  backLabel = 'Back',
  action,
  shareOptions,
}: PageHeaderProps) {
  const router = useRouter()

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Back link */}
      <button
        onClick={() => router.push(backHref)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 13, color: '#6B7280', background: 'none',
          border: 'none', cursor: 'pointer', marginBottom: 8,
          padding: 0, fontFamily: 'inherit',
        }}
      >
        <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {backLabel}
      </button>

      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', lineHeight: 1.2, margin: 0 }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>{subtitle}</p>
          )}
        </div>

        {/* Right side */}
        {(shareOptions || action) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {shareOptions && (
              <ShareButton
                shareOptions={shareOptions}
                variant="ghost"
                size="sm"
                showText={false}
                className="text-gray-400 hover:text-gray-600"
              />
            )}
            {action}
          </div>
        )}
      </div>
    </div>
  )
}
