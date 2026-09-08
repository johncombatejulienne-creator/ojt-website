'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  interactive?: boolean
  elevated?: boolean
  gradient?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ 
    className, 
    hover = false, 
    interactive = false, 
    elevated = false, 
    gradient = false,
    padding = 'md',
    children, 
    ...props 
  }, ref) => {
    const paddingClasses = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
      xl: 'p-8',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'bg-white rounded-lg border border-gray-200',
          elevated && 'shadow-lg',
          !elevated && 'shadow-sm',
          hover && 'transition-all duration-300 hover:shadow-md',
          interactive && 'cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 active:translate-y-0',
          gradient && 'bg-gradient-to-br from-white to-gray-50',
          paddingClasses[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { 
    divider?: boolean
    padding?: 'none' | 'sm' | 'md' | 'lg'
  }
>(({ className, divider = false, padding = 'md', children, ...props }, ref) => {
  const paddingClasses = {
    none: '',
    sm: 'pb-2',
    md: 'pb-4',
    lg: 'pb-6',
  }

  return (
    <div
      ref={ref}
      className={cn(
        paddingClasses[padding],
        divider && 'border-b border-gray-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})

CardHeader.displayName = 'CardHeader'

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement> & {
    level?: 1 | 2 | 3 | 4 | 5 | 6
    gradient?: boolean
  }
>(({ className, level = 3, gradient = false, children, ...props }, ref) => {
  const Component = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

  return React.createElement(
    Component,
    {
      ref,
      className: cn(
        'font-semibold text-gray-900',
        level === 1 && 'text-3xl',
        level === 2 && 'text-2xl',
        level === 3 && 'text-xl',
        level === 4 && 'text-lg',
        level === 5 && 'text-base',
        level === 6 && 'text-sm',
        gradient && 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent',
        className
      ),
      ...props
    },
    children
  )
})

CardTitle.displayName = 'CardTitle'

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-gray-600 mt-1', className)}
    {...props}
  />
))

CardDescription.displayName = 'CardDescription'

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    padding?: 'none' | 'sm' | 'md' | 'lg'
  }
>(({ className, padding = 'none', ...props }, ref) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  }

  return (
    <div 
      ref={ref} 
      className={cn(paddingClasses[padding], className)} 
      {...props} 
    />
  )
})

CardContent.displayName = 'CardContent'

export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    divider?: boolean
    padding?: 'none' | 'sm' | 'md' | 'lg'
  }
>(({ className, divider = false, padding = 'md', ...props }, ref) => {
  const paddingClasses = {
    none: '',
    sm: 'pt-2',
    md: 'pt-4',
    lg: 'pt-6',
  }

  return (
    <div
      ref={ref}
      className={cn(
        paddingClasses[padding],
        divider && 'border-t border-gray-200',
        className
      )}
      {...props}
    />
  )
})

CardFooter.displayName = 'CardFooter'
