// ─── Sharing utilities for Work Immersion Program ────────────────────────────

interface ShareData {
  title?: string
  text?: string
  url?: string
}

export interface ShareOptions {
  title: string
  text?: string
  url?: string
  fallbackMessage?: string
}

export interface ShareResult {
  success: boolean
  method: 'native' | 'clipboard' | 'manual'
  message: string
}

// ── Clipboard ─────────────────────────────────────────────────────────────────

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator === 'undefined') return false

    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }

    // Fallback for http / older browsers
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0'
    document.body.appendChild(ta)
    ta.focus()
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

// ── Native share detection (client-side only) ──────────────────────────────────

export function canNativeShare(): boolean {
  if (typeof navigator === 'undefined') return false
  return 'share' in navigator
}

// ── Core share function ────────────────────────────────────────────────────────

export async function shareContent(options: ShareOptions): Promise<ShareResult> {
  const { title, text, url, fallbackMessage } = options

  const shareUrl =
    url ??
    (typeof window !== 'undefined' ? window.location.href : '')

  const shareData: ShareData = {
    title,
    text: text ?? title,
    url: shareUrl,
  }

  // Try native Web Share API first (works on mobile and some desktops)
  if (canNativeShare()) {
    try {
      await navigator.share(shareData)
      return { success: true, method: 'native', message: 'Shared successfully!' }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { success: false, method: 'native', message: 'Share cancelled' }
      }
      // Fall through to clipboard fallback
    }
  }

  // Clipboard fallback
  const copyText = [title, text, shareUrl].filter(Boolean).join('\n')
  const copied = await copyToClipboard(copyText)

  if (copied) {
    return {
      success: true,
      method: 'clipboard',
      message: fallbackMessage ?? 'Link copied to clipboard!',
    }
  }

  // Last resort — nothing worked
  return {
    success: false,
    method: 'manual',
    message: `Copy this link: ${shareUrl}`,
  }
}

// ── URL generator ──────────────────────────────────────────────────────────────

type PageType = 'home' | 'dashboard' | 'profile' | 'narrative' | 'checklist' | 'announcement'

export function generateShareableUrl(type: PageType, id?: string): string {
  const base =
    typeof window !== 'undefined'
      ? window.location.origin
      : (process.env.NEXTAUTH_URL ?? 'https://ojt-portal-one.vercel.app')

  switch (type) {
    case 'home':         return base
    case 'dashboard':   return `${base}/dashboard`
    case 'profile':     return `${base}/profile${id ? `/${id}` : ''}`
    case 'narrative':   return `${base}/narratives${id ? `/${id}` : ''}`
    case 'checklist':   return `${base}/checklist`
    case 'announcement':return `${base}/announcements${id ? `/${id}` : ''}`
    default:            return `${base}/dashboard`
  }
}

// ── Named share helpers ────────────────────────────────────────────────────────

/** Share the whole website (home/login page) */
export async function shareWebsite(): Promise<ShareResult> {
  return shareContent({
    title: 'Work Immersion Program',
    text: 'Track your work immersion journey — log daily narratives, meet requirements, and stay updated.',
    url: generateShareableUrl('home'),
    fallbackMessage: 'Website link copied!',
  })
}

/** Share the student dashboard */
export async function shareDashboard(): Promise<ShareResult> {
  return shareContent({
    title: 'Work Immersion Program — Dashboard',
    text: 'Track your work immersion progress and activities.',
    url: generateShareableUrl('dashboard'),
    fallbackMessage: 'Dashboard link copied!',
  })
}

export async function shareProfile(name?: string, id?: string): Promise<ShareResult> {
  return shareContent({
    title: `${name ?? 'Student'} — Work Immersion Profile`,
    text: `Check out ${name ?? 'this student'}'s work immersion progress.`,
    url: generateShareableUrl('profile', id),
    fallbackMessage: 'Profile link copied!',
  })
}

export async function shareNarrative(title: string, date: string, id?: string): Promise<ShareResult> {
  return shareContent({
    title: `Work Immersion Narrative: ${title}`,
    text: `Daily narrative from ${date} — Work Immersion Program`,
    url: generateShareableUrl('narrative', id),
    fallbackMessage: 'Narrative link copied!',
  })
}

export async function shareAnnouncement(title: string, id?: string): Promise<ShareResult> {
  return shareContent({
    title: `Announcement: ${title}`,
    text: 'Important update from the Work Immersion Program.',
    url: generateShareableUrl('announcement', id),
    fallbackMessage: 'Announcement link copied!',
  })
}

// ── Copy helpers ───────────────────────────────────────────────────────────────

export async function copyStudentInfo(student: {
  name: string
  studentId: string
  email: string
  section?: string
  strand?: string
}): Promise<boolean> {
  const lines = [
    'Student Information',
    `Name: ${student.name}`,
    `Student ID: ${student.studentId}`,
    `Email: ${student.email}`,
    student.section ? `Section: ${student.section}` : null,
    student.strand  ? `Strand: ${student.strand}`   : null,
  ].filter(Boolean)
  return copyToClipboard(lines.join('\n'))
}

// ── Feedback message constants ─────────────────────────────────────────────────

export const shareMessages = {
  success: {
    native:    '✅ Shared successfully!',
    clipboard: '📋 Link copied to clipboard!',
    copy:      '✅ Copied!',
  },
  error: {
    failed:       '❌ Failed to share. Please try again.',
    notSupported: '❌ Sharing not supported on this device.',
    copyFailed:   '❌ Failed to copy. Please copy manually.',
  },
  info: {
    manual:    '📋 Please copy the link manually',
    cancelled: 'Share cancelled',
  },
} as const
