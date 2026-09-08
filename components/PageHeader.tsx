'use client'

import { useRouter } from 'next/navigation'
import type { ShareOptions } from '@/lib/sharing'
import { ShareButton } from '@/components/ui/ShareButton'

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
    <div className="mb-6 sm:mb-8">
      {/* Back breadcrumb */}
      <button
        onClick={() => router.push(backHref)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800
          transition-colors mb-3 group"
        aria-label={`Back to ${backLabel}`}
      >
        <svg
          className="w-4 h-4 transition-transform group-hover:-translate-x-0.5"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {backLabel}
      </button>

      {/* Title row */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {shareOptions && (
            <ShareButton
              shareOptions={shareOptions}
              variant="ghost"
              size="sm"
              showText={false}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2"
            />
          )}
          {action}
        </div>
      </div>
    </div>
  )
}
