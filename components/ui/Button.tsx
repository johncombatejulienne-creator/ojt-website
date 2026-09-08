'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  isLoading?: boolean
  fullWidth?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    isLoading, 
    fullWidth = false,
    leftIcon,
    rightIcon,
    children, 
    disabled, 
    ...props 
  }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden'
    
    const variants = {
      primary: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 focus:ring-blue-500 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0',
      secondary: 'bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:from-gray-700 hover:to-gray-800 focus:ring-gray-500 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0',
      outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 hover:border-blue-700 focus:ring-blue-500 hover:-translate-y-0.5 active:translate-y-0',
      ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-500 hover:-translate-y-0.5 active:translate-y-0',
      danger: 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 focus:ring-red-500 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0',
      success: 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 focus:ring-green-500 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0',
    }
    
    const sizes = {
      xs: 'text-xs px-2 py-1 min-h-[24px]',
      sm: 'text-sm px-3 py-1.5 min-h-[32px]',
      md: 'text-base px-4 py-2 min-h-[40px]',
      lg: 'text-lg px-6 py-3 min-h-[48px]',
      xl: 'text-xl px-8 py-4 min-h-[56px]',
    }

    const iconSizes = {
      xs: 'w-3 h-3',
      sm: 'w-4 h-4',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
      xl: 'w-6 h-6',
    }

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles, 
          variants[variant], 
          sizes[size], 
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {/* Loading spinner */}
        {isLoading && (
          <svg
            className={cn("animate-spin mr-2", iconSizes[size])}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        
        {/* Left icon */}
        {!isLoading && leftIcon && (
          <span className={cn("mr-2", iconSizes[size])}>
            {leftIcon}
          </span>
        )}
        
        {/* Button content */}
        <span className="relative z-10">
          {children}
        </span>
        
        {/* Right icon */}
        {!isLoading && rightIcon && (
          <span className={cn("ml-2", iconSizes[size])}>
            {rightIcon}
          </span>
        )}
        
        {/* Ripple effect overlay */}
        <span className="absolute inset-0 overflow-hidden rounded-lg">
          <span className="absolute inset-0 bg-white opacity-0 transition-opacity duration-300 group-active:opacity-20"></span>
        </span>
      </button>
    )
  }
)

Button.displayName = 'Button'
