'use client'

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'

/* ─── Types ──────────────────────────────────────────────── */
export interface TutorialStep {
  id: string
  target?: string          // data-tutorial="xxx" selector
  title: string
  description: string
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  route?: string           // navigate to this route before showing step
}

interface TutorialState {
  active: boolean
  currentStep: number
  role: 'student' | 'teacher' | null
  completed: boolean
  skipped: boolean
  version: number
}

interface TutorialContextType {
  state: TutorialState
  steps: TutorialStep[]
  startTutorial: (role: 'student' | 'teacher') => void
  nextStep: () => void
  prevStep: () => void
  skipTutorial: () => void
  finishTutorial: () => void
  shouldShowOnboarding: (role: 'student' | 'teacher') => boolean
}

/* ─── Default state ──────────────────────────────────────── */
const DEFAULT_STATE: TutorialState = {
  active: false,
  currentStep: 0,
  role: null,
  completed: false,
  skipped: false,
  version: 1,
}

const STORAGE_KEY = 'psbc_tutorial_v1'
const CURRENT_VERSION = 1

/* ─── Context ─────────────────────────────────────────────── */
const TutorialContext = createContext<TutorialContextType>({
  state: DEFAULT_STATE,
  steps: [],
  startTutorial: () => {},
  nextStep: () => {},
  prevStep: () => {},
  skipTutorial: () => {},
  finishTutorial: () => {},
  shouldShowOnboarding: () => false,
})

/* ─── Student steps ──────────────────────────────────────── */
export const STUDENT_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to the Work Immersion Portal!',
    description: 'This quick tour will show you how to use the portal — from submitting your daily narrative to tracking your progress. It only takes 1 minute!',
    placement: 'center',
  },
  {
    id: 'dashboard-banner',
    target: 'dashboard-banner',
    title: 'Your Dashboard',
    description: 'This is your personal dashboard. It shows your Work Immersion progress, how many narratives you\'ve submitted, and your requirements status.',
    placement: 'bottom',
  },
  {
    id: 'stat-cards',
    target: 'stat-cards',
    title: 'Your Progress Stats',
    description: 'These cards show your total narratives submitted, this week\'s entries, pending reviews, and requirements completion percentage.',
    placement: 'bottom',
  },
  {
    id: 'new-narrative',
    target: 'new-narrative',
    title: 'Submit a Narrative',
    description: 'Tap here every day to document your Work Immersion experience. Fill in your activities, learnings, challenges, and reflection.',
    placement: 'bottom',
  },
  {
    id: 'narratives-list',
    target: 'narratives-list',
    title: 'My Narratives',
    description: 'View all your submitted and draft narratives here. You can see their status: Draft, Pending Review, Approved, or Revision Needed.',
    placement: 'bottom',
  },
  {
    id: 'verification-photo',
    target: 'verification-photo',
    title: 'Verification Photo',
    description: 'After writing your narrative, you\'ll take a selfie as proof of submission. Your name, date, and time are automatically stamped on the photo.',
    placement: 'bottom',
  },
  {
    id: 'download-narrative',
    target: 'download-narrative',
    title: 'Download Your Narrative',
    description: 'After submitting, always download a copy of your narrative for your records and to give your teacher a printed copy.',
    placement: 'top',
  },
  {
    id: 'checklist',
    target: 'checklist',
    title: 'Requirements Checklist',
    description: 'Track all your Work Immersion requirements here. Check off items as you complete them — your teacher can see your progress.',
    placement: 'bottom',
  },
  {
    id: 'announcements',
    target: 'announcements',
    title: 'Announcements',
    description: 'Your teacher\'s announcements appear here. Check regularly for deadlines, reminders, and important updates.',
    placement: 'bottom',
  },
  {
    id: 'notifications',
    target: 'notifications',
    title: 'Notifications',
    description: 'The bell icon shows notifications when your teacher approves your narrative, requests revisions, or posts new requirements.',
    placement: 'bottom',
  },
  {
    id: 'profile',
    target: 'profile-menu',
    title: 'Your Profile',
    description: 'Access your profile to update your photo, student ID, company, and section. Keep your information up to date.',
    placement: 'bottom',
  },
  {
    id: 'finish',
    title: 'You\'re All Set!',
    description: 'You now know how to use the Work Immersion Portal. Start by tapping "New Narrative" to document your first day. Good luck with your Work Immersion!',
    placement: 'center',
  },
]

/* ─── Teacher steps ──────────────────────────────────────── */
export const TEACHER_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to the Teacher Portal!',
    description: 'This tour will show you how to monitor students, review narratives, post announcements, and manage your Work Immersion class.',
    placement: 'center',
  },
  {
    id: 'teacher-banner',
    target: 'teacher-banner',
    title: 'Teacher Dashboard',
    description: 'Your dashboard shows an overview of all students, pending narrative reviews, and teacher accounts in the system.',
    placement: 'bottom',
  },
  {
    id: 'teacher-stats',
    target: 'teacher-stats',
    title: 'Overview Statistics',
    description: 'These cards show total students enrolled, number of teachers, and how many narratives are waiting for your review.',
    placement: 'bottom',
  },
  {
    id: 'students-tab',
    target: 'students-tab',
    title: 'Students Tab',
    description: 'View all enrolled students here. You can search by name, filter by section, view their profile, and assign supervisors.',
    placement: 'bottom',
  },
  {
    id: 'narratives-tab',
    target: 'narratives-tab',
    title: 'Review Narratives',
    description: 'All pending student narratives appear here. Tap "Review" to open a narrative, read it, and either Approve it or Request Revisions.',
    placement: 'bottom',
  },
  {
    id: 'requirements-tab',
    target: 'requirements-tab',
    title: 'Create Requirements',
    description: 'Create checklist requirements for your students here. Students will be notified and can track their completion progress.',
    placement: 'bottom',
  },
  {
    id: 'announcements-tab',
    target: 'announcements-tab',
    title: 'Post Announcements',
    description: 'Send announcements to all students, a specific strand, or a specific section. Use this for deadlines, reminders, and instructions.',
    placement: 'bottom',
  },
  {
    id: 'all-users-tab',
    target: 'all-users-tab',
    title: 'All Registered Accounts',
    description: 'See every Gmail account that has signed into the portal, their role (Student or Teacher), section, and number of narratives.',
    placement: 'bottom',
  },
  {
    id: 'teacher-profile',
    target: 'profile-menu',
    title: 'Your Teacher Profile',
    description: 'Update your profile photo and Teacher ID here. Your name and email come from your Google account.',
    placement: 'bottom',
  },
  {
    id: 'finish',
    title: 'You\'re Ready to Teach!',
    description: 'You now know how to use the Teacher Portal. Start by checking the Narratives tab for any pending reviews from your students.',
    placement: 'center',
  },
]

/* ─── Provider ───────────────────────────────────────────── */
export function TutorialProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TutorialState>(DEFAULT_STATE)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<TutorialState>
        // Only restore completion state, not active state
        setState(prev => ({
          ...prev,
          completed: parsed.completed ?? false,
          skipped: parsed.skipped ?? false,
          version: parsed.version ?? 1,
        }))
      }
    } catch { /* ignore */ }
  }, [])

  const saveToStorage = useCallback((newState: Partial<TutorialState>) => {
    try {
      const current = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...newState }))
    } catch { /* ignore */ }
  }, [])

  const steps = state.role === 'teacher' ? TEACHER_STEPS : STUDENT_STEPS

  const startTutorial = useCallback((role: 'student' | 'teacher') => {
    setState(prev => ({
      ...prev,
      active: true,
      currentStep: 0,
      role,
      completed: false,
      skipped: false,
    }))
  }, [])

  const nextStep = useCallback(() => {
    setState(prev => {
      const nextIdx = prev.currentStep + 1
      const currentSteps = prev.role === 'teacher' ? TEACHER_STEPS : STUDENT_STEPS
      if (nextIdx >= currentSteps.length) {
        // Auto-finish at last step
        saveToStorage({ completed: true, skipped: false, version: CURRENT_VERSION })
        return { ...prev, active: false, completed: true, currentStep: 0 }
      }
      return { ...prev, currentStep: nextIdx }
    })
  }, [saveToStorage])

  const prevStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(0, prev.currentStep - 1),
    }))
  }, [])

  const skipTutorial = useCallback(() => {
    setState(prev => ({ ...prev, active: false, skipped: true, currentStep: 0 }))
    saveToStorage({ skipped: true, completed: false, version: CURRENT_VERSION })
  }, [saveToStorage])

  const finishTutorial = useCallback(() => {
    setState(prev => ({ ...prev, active: false, completed: true, currentStep: 0 }))
    saveToStorage({ completed: true, skipped: false, version: CURRENT_VERSION })
  }, [saveToStorage])

  const shouldShowOnboarding = useCallback((role: 'student' | 'teacher') => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) return true  // First time ever
      const parsed = JSON.parse(saved) as Partial<TutorialState>
      // Show if not completed and not skipped, OR if version changed
      if (parsed.version !== CURRENT_VERSION) return true
      return !parsed.completed && !parsed.skipped
    } catch { return true }
  }, [])

  return (
    <TutorialContext.Provider value={{
      state, steps,
      startTutorial, nextStep, prevStep,
      skipTutorial, finishTutorial, shouldShowOnboarding,
    }}>
      {children}
    </TutorialContext.Provider>
  )
}

export function useTutorial() {
  return useContext(TutorialContext)
}
