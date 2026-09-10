'use client'

import Header from './Header'

interface AppShellProps {
  children: React.ReactNode
  strandCode?: string
  forceTeacher?: boolean
  className?: string
}

export default function AppShell({ children, strandCode, forceTeacher, className = '' }: AppShellProps) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
      <Header strandCode={strandCode} forceTeacher={forceTeacher} />
      <main style={{ flex: 1, width: '100%', overflowX: 'hidden' }} className={className}>
        {/* 
          Using inline style for the container so padding is guaranteed 
          regardless of Tailwind CSS generation on Vercel.
        */}
        <div
          className="dashboard-container"
          style={{
            maxWidth: '1280px',
            marginLeft: 'auto',
            marginRight: 'auto',
            paddingLeft: '16px',
            paddingRight: '16px',
            paddingTop: '24px',
            paddingBottom: '32px',
            boxSizing: 'border-box',
            width: '100%',
          }}
        >
          {children}
        </div>
      </main>
    </div>
  )
}
