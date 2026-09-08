'use client'

import React, { useState, useEffect, useRef } from 'react'
import { shareContent, copyToClipboard, canNativeShare } from '@/lib/sharing'
import type { ShareOptions, ShareResult } from '@/lib/sharing'
import { cn } from '@/lib/utils'

// â”€â”€ Re-export for consumers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export type { ShareOptions }

// â”€â”€â”€ ShareButton â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface ShareButtonProps {
  shareOptions: Omit<ShareOptions, 'fallbackMessage'>
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  showText?: boolean
  className?: string
  onSuccess?: (method: ShareResult['method']) => void
  onError?: (message: string) => void
  /** Override the button label; defaults to "Share" or "Copy Link" based on device */
  label?: string
}

export function ShareButton({
  shareOptions,
  variant = 'outline',
  size = 'md',
  showIcon = true,
  showText = true,
  className,
  onSuccess,
  onError,
  label,
}: ShareButtonProps) {
  const [busy, setBusy]         = useState(false)
  const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null)
  const [hasNative, setHasNative] = useState(false)
  const timerRef                = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Detect native share capability client-side only (avoids SSR mismatch)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasNative(canNativeShare())
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  const showFeedback = (text: string, ok: boolean) => {
    setFeedback({ text, ok })
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setFeedback(null), 3000)
  }

  const handleShare = async () => {
    if (busy) return
    setBusy(true)
    try {
      const result = await shareContent({
        ...shareOptions,
        fallbackMessage: 'Link copied to clipboard!',
      })
      if (result.success) {
        showFeedback(result.message, true)
        onSuccess?.(result.method)
      } else if (result.method !== 'native') {
        // Only show error for non-cancel situations
        showFeedback(result.message, false)
        onError?.(result.message)
      }
    } catch {
      const msg = 'Failed to share. Please try again.'
      showFeedback(msg, false)
      onError?.(msg)
    } finally {
      setBusy(false)
    }
  }

  // â”€â”€ Style maps â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const variantClasses: Record<string, string> = {
    primary:   'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-sm',
    secondary: 'bg-gray-700 text-white hover:bg-gray-800',
    outline:   'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400',
    ghost:     'text-current bg-transparent hover:bg-white/10',
  }

  const sizeClasses: Record<string, string> = {
    sm:  'text-xs px-2.5 py-1.5 gap-1.5 rounded-lg min-h-[30px]',
    md:  'text-sm px-3.5 py-2   gap-2   rounded-xl min-h-[38px]',
    lg:  'text-base px-5 py-2.5 gap-2   rounded-xl min-h-[46px]',
  }

  const iconSizes: Record<string, string> = { sm: 'w-3.5 h-3.5', md: 'w-4 h-4', lg: 'w-5 h-5' }

  const btnLabel =
    label ??
    (busy
      ? hasNative ? 'Sharing...' : 'Copying...'
      : hasNative ? 'Share'      : 'Copy Link')

  return (
    <div className="relative inline-block">
      <button
        onClick={handleShare}
        disabled={busy}
        aria-label={btnLabel}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-200',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
          'disabled:opacity-60 disabled:cursor-not-allowed',
          variantClasses[variant] ?? variantClasses.outline,
          sizeClasses[size]       ?? sizeClasses.md,
          className,
        )}
      >
        {/* Icon */}
        {showIcon && (
          busy ? (
            <svg className={cn('animate-spin flex-shrink-0', iconSizes[size])} fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : hasNative ? (
            /* Share icon */
            <svg className={cn('flex-shrink-0', iconSizes[size])} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
          ) : (
            /* Copy icon */
            <svg className={cn('flex-shrink-0', iconSizes[size])} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )
        )}

        {/* Label */}
        {showText && <span>{btnLabel}</span>}
      </button>

      {/* Feedback tooltip */}
      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            'absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg shadow-lg',
            'text-white text-xs font-medium whitespace-nowrap z-50 animate-fade-in pointer-events-none',
            feedback.ok ? 'bg-gray-900' : 'bg-red-600',
          )}
        >
          {feedback.text}
          {/* Arrow */}
          <span
            className={cn(
              'absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent',
              feedback.ok ? 'border-t-gray-900' : 'border-t-red-600',
            )}
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  )
}

// â”€â”€â”€ CopyButton â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface CopyButtonProps {
  text: string
  label?: string
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onSuccess?: () => void
  onError?: () => void
}

export function CopyButton({
  text,
  label = 'Copy',
  variant = 'ghost',
  className,
  onSuccess,
  onError,
}: CopyButtonProps) {
  const [busy, setBusy]         = useState(false)
  const [copied, setCopied]     = useState(false)
  const timerRef                = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const handleCopy = async () => {
    if (busy) return
    setBusy(true)
    const ok = await copyToClipboard(text)
    setBusy(false)
    if (ok) {
      setCopied(true)
      onSuccess?.()
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setCopied(false), 2000)
    } else {
      onError?.()
    }
  }

  return (
    <button
      onClick={handleCopy}
      disabled={busy}
      aria-label={copied ? 'Copied!' : label}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        copied
          ? 'bg-green-100 text-green-700'
          : variant === 'ghost'
          ? 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
          : 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50',
        className,
      )}
    >
      {copied ? (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
      {copied ? 'Copied!' : label}
    </button>
  )
}

// â”€â”€â”€ CopyableField â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface CopyableFieldProps {
  label: string
  value: string
  className?: string
  showFullValue?: boolean
}

export function CopyableField({
  label,
  value,
  className,
  showFullValue = true,
}: CopyableFieldProps) {
  const display = showFullValue
    ? value
    : value.length > 24 ? `${value.slice(0, 24)}...` : value

  return (
    <div className={cn('flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200', className)}>
      <div className="flex-1 min-w-0 mr-3">
        <p className="text-xs font-medium text-gray-500 mb-0.5">{label}</p>
        <p className="text-sm text-gray-900 font-mono truncate" title={value}>{display}</p>
      </div>
      <CopyButton text={value} size="sm" />
    </div>
  )
}

// â”€â”€â”€ ShareCard (standalone prominent share UI) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface ShareCardProps {
  title?: string
  description?: string
  shareOptions: Omit<ShareOptions, 'fallbackMessage'>
  className?: string
}

export function ShareCard({
  title = 'Share this website',
  description = 'Invite others to join the Work Immersion Program.',
  shareOptions,
  className,
}: ShareCardProps) {
  const url =
    shareOptions.url ??
    (typeof window !== 'undefined' ? window.location.origin : '')

  return (
    <div className={cn('bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-5', className)}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 w-11 h-11 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
          </svg>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm">{title}</p>
          <p className="text-xs text-gray-500 mt-0.5 mb-3">{description}</p>

          {/* URL display + copy */}
          {url && (
            <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-3 py-2 mb-3">
              <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span className="text-xs text-gray-600 font-mono truncate flex-1">{url}</span>
              <CopyButton text={url} label="Copy" size="sm" />
            </div>
          )}

          {/* Share button */}
          <ShareButton
            shareOptions={shareOptions}
            variant="primary"
            size="md"
            className="w-full justify-center"
          />
        </div>
      </div>
    </div>
  )
}

