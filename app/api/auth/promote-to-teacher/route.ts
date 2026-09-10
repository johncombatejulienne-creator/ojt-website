import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/auth/promote-to-teacher
 * Called from teacher dashboard on every load.
 * Ensures a Teacher record exists for this email.
 * Safe to call multiple times.
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const email = session.user.email

    // Already a teacher?
    const existing = await prisma.teacher.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ success: true, already: true, teacherId: existing.id })
    }

    // Only create if this looks like a teacher intent
    // (called from teacher dashboard, so we trust it)
    const student = await prisma.student.findUnique({ where: { email } })
    const newTeacher = await prisma.teacher.create({
      data: {
        email,
        name:           student?.name ?? session.user.name ?? email.split('@')[0],
        teacherId:      `TCH-${Date.now()}`,
        role:           'teacher',
        accessLevel:    'teacher',
        profilePicture: student?.profilePicture ?? session.user.image ?? null,
      },
    })

    return NextResponse.json({ success: true, promoted: true, teacherId: newTeacher.id })
  } catch (error) {
    console.error('Promote to teacher error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
