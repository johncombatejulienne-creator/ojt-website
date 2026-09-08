'use client'

import { useRouter } from 'next/navigation'
import { ShareButton } from '@/components/ui/ShareButton'
import type { ShareOptions } from '@/lib/sharing'

interface PageHeaderProps {
  title: string
  subtitle?: string
  backHref?: string
  backLabel?: string
  /** Optional slot rendered on the right side of the header */
  action?: React.ReactNode
  /** When provided, a share icon button is shown alongside `action` */
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
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-3">

          {/* Left: back + title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => router.push(backHref)}
              className="flex items-center gap-1 text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0 p-1 -ml-1 rounded-lg hover:bg-gray-100"
              aria-label={`Back to ${backLabel}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline text-sm font-medium">{backLabel}</span>
            </button>

            <div className="w-px h-5 bg-gray-200 flex-shrink-0" aria-hidden="true" />

            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate leading-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-gray-400 truncate leading-tight hidden sm:block mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Right: share + action */}
          {(shareOptions || action) && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {shareOptions && (
                <ShareButton
                  shareOptions={shareOptions}
                  variant="ghost"
                  size="sm"
                  showText={false}
                  className="text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  aria-label="Share this page"
                />
              )}
              {action}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
