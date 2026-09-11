import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/auth/finalize?intent=teacher|student&next=/...
 *
 * Called after Google OAuth completes.
 * - intent=student: ensures Student record exists, REMOVES Teacher record
 *   (so JWT gives role=student and the student sees the student dashboard)
 * - intent=teacher: ensures Teacher record exists
 *
 * This separation means one Gmail can be either a student OR a teacher,
 * switching roles cleanly by signing in on the correct tab.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const intent = searchParams.get('intent') ?? 'student'
  const next   = searchParams.get('next')   ?? (intent === 'teacher' ? '/teacher/dashboard' : '/dashboard')

  const baseUrl    = request.nextUrl.origin
  const redirectTo = (path: string) => NextResponse.redirect(new URL(path, baseUrl))

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return redirectTo('/login')

    const email = session.user.email
    const name  = session.user.name ?? email.split('@')[0]
    const image = session.user.image ?? null

    if (intent === 'teacher') {
      // ── TEACHER sign-in ───────────────────────────────────
      // Ensure Teacher record exists
      const existing = await prisma.teacher.findUnique({ where: { email } })
      if (!existing) {
        await prisma.teacher.create({
          data: {
            email, name,
            teacherId:      `TCH-${Date.now()}`,
            role:           'teacher',
            accessLevel:    'teacher',
            profilePicture: image,
          },
        })
      } else if (!existing.profilePicture && image) {
        await prisma.teacher.update({ where: { id: existing.id }, data: { profilePicture: image } })
      }
      // Note: keep any Student record — they may have been a student before
    } else {
      // ── STUDENT sign-in ───────────────────────────────────
      // Ensure Student record exists
      const existing = await prisma.student.findUnique({ where: { email } })
      if (!existing) {
        await prisma.student.create({
          data: { email, name, studentId: `STU-${Date.now()}`, profilePicture: image },
        })
      } else if (!existing.profilePicture && image) {
        await prisma.student.update({ where: { id: existing.id }, data: { profilePicture: image } })
      }

      // CRITICAL: Remove Teacher record so the JWT sets role=student
      // Without this, having both records means JWT always picks "teacher"
      const teacherRecord = await prisma.teacher.findUnique({ where: { email } })
      if (teacherRecord) {
        // Safely clean up teacher-related records before deleting
        await prisma.student.updateMany({ where: { supervisorId: teacherRecord.id }, data: { supervisorId: null } }).catch(() => {})
        await prisma.section.updateMany({ where: { teacherId: teacherRecord.id }, data: { teacherId: null } }).catch(() => {})
        await prisma.narrativeReview.deleteMany({ where: { teacherId: teacherRecord.id } }).catch(() => {})
        await prisma.notification.deleteMany({ where: { userId: teacherRecord.id, userType: 'teacher' } }).catch(() => {})
        // Soft-delete announcements
        await prisma.announcement.updateMany({ where: { teacherId: teacherRecord.id }, data: { isActive: false } }).catch(() => {})
        await prisma.teacher.delete({ where: { id: teacherRecord.id } }).catch(() => {})
      }
    }

    return redirectTo(next)
  } catch (error) {
    console.error('finalize error:', error)
    return redirectTo(next)
  }
}
