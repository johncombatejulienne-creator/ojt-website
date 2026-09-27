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
      <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#FEF3C7 0%,#FFEDD5 35%,#FFF7ED 65%,#FEF9EE 100%)', backgroundAttachment: 'fixed', display: 'flex', flexDirection: 'column' }}>
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
