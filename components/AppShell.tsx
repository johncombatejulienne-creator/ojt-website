'use client'

import Header from './Header'
import HelpButton from './HelpButton'
import InstallPrompt from './InstallPrompt'
import { TutorialProvider } from './tutorial/TutorialContext'
import TutorialOverlay from './tutorial/TutorialOverlay'
import { TutorialAutoStart, TutorialHowToUseButton } from './tutorial/TutorialTrigger'

interface AppShellProps {
  children: React.ReactNode
  strandCode?: string
  forceTeacher?: boolean
  className?: string
}

export default function AppShell({ children, strandCode, forceTeacher, className = '' }: AppShellProps) {
  return (
    <TutorialProvider>
      <TutorialAutoStart />
      <TutorialOverlay />
      <div style={{
        minHeight: '100vh',
        background: '#FAFAF7',
        backgroundImage: [
          'radial-gradient(at 10% 10%, rgba(245,166,35,0.07) 0, transparent 48%)',
          'radial-gradient(at 88% 6%,  rgba(232,151,31,0.06) 0, transparent 44%)',
          'radial-gradient(at 50% 96%, rgba(245,166,35,0.05) 0, transparent 48%)',
        ].join(','),
        display: 'flex',
        flexDirection: 'column',
      }}>
        <Header strandCode={strandCode} forceTeacher={forceTeacher} />
        <main style={{ flex: 1, width: '100%', overflowX: 'hidden' }} className={className}>
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
        <TutorialHowToUseButton />
        <HelpButton />
        <InstallPrompt />
      </div>
    </TutorialProvider>
  )
}
