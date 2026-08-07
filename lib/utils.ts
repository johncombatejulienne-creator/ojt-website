import { type ClassValue, clsx } from "clsx"
import { format, isToday, isBefore, startOfDay, endOfDay, parseISO } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, 'MMM dd, yyyy')
}

export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, 'MMM dd, yyyy hh:mm a')
}

export function formatTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, 'hh:mm a')
}

export function isSubmissionOnTime(submissionDate: Date, narrativeDate: Date): boolean {
  const submissionDay = startOfDay(submissionDate)
  const narrativeDay = startOfDay(narrativeDate)
  const narrativeEndDay = endOfDay(narrativeDate)
  
  // Check if submission was made on the same day or before 11:59 PM of the narrative date
  return submissionDate >= narrativeDay && submissionDate <= narrativeEndDay
}

export function getVerificationStatus(submissionDate: Date, narrativeDate: Date): {
  status: 'on_time' | 'late'
  message: string
} {
  const onTime = isSubmissionOnTime(submissionDate, narrativeDate)
  
  if (onTime) {
    return {
      status: 'on_time',
      message: '✅ Submitted on the correct day'
    }
  } else {
    const daysDiff = Math.floor(
      (startOfDay(submissionDate).getTime() - startOfDay(narrativeDate).getTime()) / 
      (1000 * 60 * 60 * 24)
    )
    return {
      status: 'late',
      message: `❌ Submitted ${daysDiff} day${daysDiff > 1 ? 's' : ''} late`
    }
  }
}

export function calculateHoursRendered(timeIn: string, timeOut: string): number {
  try {
    const [inHours, inMinutes] = timeIn.split(':').map(Number)
    const [outHours, outMinutes] = timeOut.split(':').map(Number)
    
    const inTotalMinutes = inHours * 60 + inMinutes
    const outTotalMinutes = outHours * 60 + outMinutes
    
    const diffMinutes = outTotalMinutes - inTotalMinutes
    return Math.max(0, diffMinutes / 60)
  } catch {
    return 0
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-800 border-green-300'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    case 'revision_requested':
      return 'bg-orange-100 text-orange-800 border-orange-300'
    case 'late':
      return 'bg-red-100 text-red-800 border-red-300'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300'
  }
}

export function getStatusText(status: string): string {
  switch (status) {
    case 'approved':
      return 'Approved'
    case 'pending':
      return 'Pending'
    case 'revision_requested':
      return 'Revision Requested'
    case 'late':
      return 'Late'
    default:
      return status
  }
}

export async function createAuditLog(data: {
  userId: string
  userType: 'student' | 'teacher'
  action: string
  description: string
  metadata?: any
  ipAddress?: string
  userAgent?: string
}) {
  // This will be implemented in the API route
  return fetch('/api/audit-log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}
