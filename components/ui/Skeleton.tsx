import React from 'react'
import { cn } from '@/lib/utils'

/* ─── Skeleton base ──────────────────────────────────────────────────────── */
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  height?: string | number
  width?: string | number
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

export function Skeleton({
  className,
  height,
  width,
  rounded = 'md',
  style,
  ...props
}: SkeletonProps) {
  const roundedClass = {
    sm:   'rounded',
    md:   'rounded-lg',
    lg:   'rounded-xl',
    xl:   'rounded-2xl',
    full: 'rounded-full',
  }[rounded]

  return (
    <div
      className={cn('skeleton', roundedClass, className)}
      style={{ height, width, ...style }}
      aria-hidden="true"
      {...props}
    />
  )
}

/* ─── Pre-built skeletons ────────────────────────────────────────────────── */

/** Single line of text skeleton */
export function SkeletonText({ lines = 1, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={16}
          width={i === lines - 1 && lines > 1 ? '70%' : '100%'}
        />
      ))}
    </div>
  )
}

/** Card-shaped skeleton */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4', className)} aria-hidden="true">
      {/* Header row */}
      <div className="flex items-center gap-3">
        <Skeleton height={44} width={44} rounded="full" />
        <div className="flex-1 space-y-2">
          <Skeleton height={14} width="55%" />
          <Skeleton height={12} width="35%" />
        </div>
      </div>
      {/* Body lines */}
      <SkeletonText lines={3} />
      {/* Footer row */}
      <div className="flex gap-3 pt-1">
        <Skeleton height={34} className="flex-1" rounded="lg" />
        <Skeleton height={34} width={80} rounded="lg" />
      </div>
    </div>
  )
}

/** Stats row skeleton (3 cards) */
export function SkeletonStats({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('grid gap-4', count === 4 ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm" aria-hidden="true">
          <Skeleton height={12} width="50%" className="mb-2" />
          <Skeleton height={36} width="40%" />
        </div>
      ))}
    </div>
  )
}

/** Full page loading overlay */
export function PageLoader({ message = 'Loading…' }: { message?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
        <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
      </div>
      <p className="text-gray-400 text-sm">{message}</p>
    </div>
  )
}
