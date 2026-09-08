'use client'

import Header from './Header'

interface AppShellProps {
  children: React.ReactNode
  /** The student's strand code — drives header gradient and theme accent */
  strandCode?: string
  /** Extra class on the <main> content area */
  className?: string
}

/**
 * AppShell wraps every authenticated page.
 *
 * Structure:
 *   <Header />           — sticky top bar
 *   <main>               — scrollable content area
 *     {children}
 *   </main>
 */
export default function AppShell({ children, strandCode, className = '' }: AppShellProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header strandCode={strandCode} />
      <main className={`flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 ${className}`}>
        {children}
      </main>
    </div>
  )
}
