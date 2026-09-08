'use client'

import React from 'react'
import { cn } from '@/lib/utils'

// Main container component with responsive behavior
interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  center?: boolean
}

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size = '7xl', padding = 'md', center = true, ...props }, ref) => {
    const sizeClasses = {
      sm: 'max-w-sm',
      md: 'max-w-md', 
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      '2xl': 'max-w-2xl',
      '3xl': 'max-w-3xl',
      '4xl': 'max-w-4xl',
      '5xl': 'max-w-5xl',
      '6xl': 'max-w-6xl',
      '7xl': 'max-w-7xl',
      full: 'w-full',
    }

    const paddingClasses = {
      none: '',
      sm: 'px-4',
      md: 'px-4 sm:px-6',
      lg: 'px-4 sm:px-6 lg:px-8',
      xl: 'px-4 sm:px-6 lg:px-8 xl:px-12',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'w-full',
          sizeClasses[size],
          paddingClasses[padding],
          center && 'mx-auto',
          className
        )}
        {...props}
      />
    )
  }
)

Container.displayName = 'Container'

// Responsive grid component
interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 12
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  responsive?: 'sm' | 'md' | 'lg' | 'xl' | 'auto'
}

export const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ className, cols = 1, gap = 'md', responsive = 'auto', ...props }, ref) => {
    const gapClasses = {
      none: 'gap-0',
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8',
      '2xl': 'gap-12',
    }

    const getResponsiveClasses = () => {
      if (responsive === 'auto') {
        // Auto-responsive based on cols
        if (cols === 1) return 'grid-cols-1'
        if (cols === 2) return 'grid-cols-1 sm:grid-cols-2'
        if (cols === 3) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        if (cols === 4) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        if (cols === 5) return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
        if (cols === 6) return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'
        return `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-${cols}`
      }
      
      // Manual responsive breakpoint
      return `grid-cols-1 ${responsive}:grid-cols-${cols}`
    }

    return (
      <div
        ref={ref}
        className={cn(
          'grid',
          getResponsiveClasses(),
          gapClasses[gap],
          className
        )}
        {...props}
      />
    )
  }
)

Grid.displayName = 'Grid'

// Flex component for flexible layouts
interface FlexProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'row' | 'col' | 'row-reverse' | 'col-reverse'
  wrap?: boolean
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

export const Flex = React.forwardRef<HTMLDivElement, FlexProps>(
  ({ 
    className, 
    direction = 'row', 
    wrap = false, 
    align = 'start', 
    justify = 'start', 
    gap = 'none', 
    ...props 
  }, ref) => {
    const directionClasses = {
      row: 'flex-row',
      col: 'flex-col',
      'row-reverse': 'flex-row-reverse',
      'col-reverse': 'flex-col-reverse',
    }

    const alignClasses = {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
      baseline: 'items-baseline',
    }

    const justifyClasses = {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
      around: 'justify-around',
      evenly: 'justify-evenly',
    }

    const gapClasses = {
      none: 'gap-0',
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8',
      '2xl': 'gap-12',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'flex',
          directionClasses[direction],
          wrap && 'flex-wrap',
          alignClasses[align],
          justifyClasses[justify],
          gapClasses[gap],
          className
        )}
        {...props}
      />
    )
  }
)

Flex.displayName = 'Flex'

// Stack component for vertical spacing
interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  align?: 'start' | 'center' | 'end' | 'stretch'
  divider?: boolean
}

export const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ className, spacing = 'md', align = 'stretch', divider = false, children, ...props }, ref) => {
    const spacingClasses = {
      none: 'space-y-0',
      xs: 'space-y-1',
      sm: 'space-y-2',
      md: 'space-y-4',
      lg: 'space-y-6',
      xl: 'space-y-8',
      '2xl': 'space-y-12',
      '3xl': 'space-y-16',
    }

    const alignClasses = {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
    }

    if (divider) {
      return (
        <div
          ref={ref}
          className={cn('flex flex-col', alignClasses[align], className)}
          {...props}
        >
          {React.Children.map(children, (child, index) => (
            <React.Fragment key={index}>
              {index > 0 && <hr className="border-gray-200 my-4" />}
              {child}
            </React.Fragment>
          ))}
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col',
          spacingClasses[spacing],
          alignClasses[align],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Stack.displayName = 'Stack'

// Section component for page sections
interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  background?: 'none' | 'gray' | 'gradient' | 'pattern'
}

export const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({ className, padding = 'lg', background = 'none', ...props }, ref) => {
    const paddingClasses = {
      none: '',
      sm: 'py-4',
      md: 'py-8',
      lg: 'py-12',
      xl: 'py-20',
    }

    const backgroundClasses = {
      none: '',
      gray: 'bg-gray-50',
      gradient: 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50',
      pattern: 'bg-gray-50 bg-opacity-50 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] bg-[length:20px_20px]',
    }

    return (
      <section
        ref={ref}
        className={cn(
          paddingClasses[padding],
          backgroundClasses[background],
          className
        )}
        {...props}
      />
    )
  }
)

Section.displayName = 'Section'

// Spacer component for flexible spacing
interface SpacerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl'
}

export const Spacer: React.FC<SpacerProps> = ({ size = 'md' }) => {
  const sizeClasses = {
    xs: 'h-2',
    sm: 'h-4',
    md: 'h-8',
    lg: 'h-12',
    xl: 'h-16',
    '2xl': 'h-20',
    '3xl': 'h-24',
    '4xl': 'h-32',
    '5xl': 'h-40',
  }

  return <div className={sizeClasses[size]} />
}

// Responsive show/hide utilities
interface ResponsiveProps extends React.HTMLAttributes<HTMLDivElement> {
  show?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  hide?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

export const Responsive = React.forwardRef<HTMLDivElement, ResponsiveProps>(
  ({ className, show, hide, ...props }, ref) => {
    const showClasses = {
      sm: 'hidden sm:block',
      md: 'hidden md:block',
      lg: 'hidden lg:block',
      xl: 'hidden xl:block',
      '2xl': 'hidden 2xl:block',
    }

    const hideClasses = {
      sm: 'sm:hidden',
      md: 'md:hidden',
      lg: 'lg:hidden',
      xl: 'xl:hidden',
      '2xl': '2xl:hidden',
    }

    return (
      <div
        ref={ref}
        className={cn(
          show && showClasses[show],
          hide && hideClasses[hide],
          className
        )}
        {...props}
      />
    )
  }
)

Responsive.displayName = 'Responsive'