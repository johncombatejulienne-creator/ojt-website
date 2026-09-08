'use client'

import React, { useId } from 'react'
import { cn } from '@/lib/utils'

/* ─── Input ──────────────────────────────────────────────────────────────── */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  variant?: 'default' | 'filled'
  inputSize?: 'sm' | 'md' | 'lg'
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      variant = 'default',
      inputSize = 'md',
      id: idProp,
      type = 'text',
      ...props
    },
    ref
  ) => {
    const autoId    = useId()
    const id        = idProp ?? autoId
    const hintId    = `${id}-hint`
    const hasHint   = !!(error || helperText)

    const sizeClasses: Record<string, string> = {
      sm: 'px-3 py-1.5 text-sm min-h-[36px]',
      md: 'px-4 py-2   text-sm min-h-[42px]',
      lg: 'px-4 py-3   text-base min-h-[48px]',
    }

    const baseInput = cn(
      'w-full rounded-xl border transition-all duration-150 outline-none',
      'placeholder:text-gray-400',
      'focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-0 focus:border-blue-500',
      variant === 'filled'
        ? 'border-gray-200 bg-gray-50 focus:bg-white'
        : 'border-gray-300 bg-white',
      sizeClasses[inputSize],
      leftIcon  && 'pl-10',
      rightIcon && 'pr-10',
      error
        ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500'
        : '',
      props.disabled && 'opacity-60 cursor-not-allowed bg-gray-50',
      className
    )

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5 select-none">
            {label}
            {props.required && (
              <span className="text-red-500 ml-1" aria-hidden="true">*</span>
            )}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              {leftIcon}
            </div>
          )}

          <input
            id={id}
            ref={ref}
            type={type}
            aria-invalid={!!error}
            aria-describedby={hasHint ? hintId : undefined}
            className={baseInput}
            {...props}
          />

          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>

        {hasHint && (
          <p
            id={hintId}
            className={cn(
              'mt-1.5 text-xs flex items-center gap-1',
              error ? 'text-red-600' : 'text-gray-500'
            )}
          >
            {error && (
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd" />
              </svg>
            )}
            {error ?? helperText}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

/* ─── TextArea ───────────────────────────────────────────────────────────── */
interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  resize?: 'none' | 'vertical' | 'horizontal' | 'both'
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, label, error, helperText, resize = 'vertical', id: idProp, ...props }, ref) => {
    const autoId  = useId()
    const id      = idProp ?? autoId
    const hintId  = `${id}-hint`
    const hasHint = !!(error || helperText)

    const resizeClass = {
      none: 'resize-none', vertical: 'resize-y',
      horizontal: 'resize-x', both: 'resize',
    }[resize]

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
            {props.required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
          </label>
        )}

        <textarea
          id={id}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={hasHint ? hintId : undefined}
          className={cn(
            'w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white',
            'text-sm transition-all duration-150 outline-none',
            'placeholder:text-gray-400',
            'focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
            error   && 'border-red-400 focus:ring-red-500/20 focus:border-red-500',
            props.disabled && 'opacity-60 cursor-not-allowed bg-gray-50',
            resizeClass,
            className
          )}
          {...props}
        />

        {hasHint && (
          <p id={hintId} className={cn('mt-1.5 text-xs flex items-center gap-1',
            error ? 'text-red-600' : 'text-gray-500')}>
            {error ?? helperText}
          </p>
        )}
      </div>
    )
  }
)
TextArea.displayName = 'TextArea'

/* ─── Select ─────────────────────────────────────────────────────────────── */
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
  placeholder?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, placeholder, children, id: idProp, ...props }, ref) => {
    const autoId  = useId()
    const id      = idProp ?? autoId
    const hintId  = `${id}-hint`
    const hasHint = !!(error || helperText)

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
            {props.required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
          </label>
        )}

        <div className="relative">
          <select
            id={id}
            ref={ref}
            aria-invalid={!!error}
            aria-describedby={hasHint ? hintId : undefined}
            className={cn(
              'w-full pl-4 pr-10 py-2 rounded-xl border border-gray-300 bg-white',
              'text-sm appearance-none transition-all duration-150 outline-none',
              'focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
              error   && 'border-red-400 focus:ring-red-500/20 focus:border-red-500',
              props.disabled && 'opacity-60 cursor-not-allowed bg-gray-50',
              className
            )}
            {...props}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {children}
          </select>

          {/* Chevron */}
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {hasHint && (
          <p id={hintId} className={cn('mt-1.5 text-xs flex items-center gap-1',
            error ? 'text-red-600' : 'text-gray-500')}>
            {error ?? helperText}
          </p>
        )}
      </div>
    )
  }
)
Select.displayName = 'Select'
