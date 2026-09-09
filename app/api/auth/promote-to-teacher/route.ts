import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/auth/promote-to-teacher
 * Creates a Teacher record for the currently signed-in user if one doesn't exist.
 * Called automatically when landing on /teacher/dashboard.
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

    // Get name/picture from student record if it exists
    const student = await prisma.student.findUnique({ where: { email } })

    const teacher = await prisma.teacher.create({
      data: {
        email,
        name:           student?.name ?? session.user.name ?? email.split('@')[0],
        teacherId:      `TCH-${Date.now()}`,
        role:           'teacher',
        accessLevel:    'teacher',
        profilePicture: student?.profilePicture ?? session.user.image ?? null,
      },
    })

    return NextResponse.json({ success: true, promoted: true, teacherId: teacher.id })
  } catch (error) {
    console.error('Promote to teacher error:', error)
    return NextResponse.json({ error: 'Failed to promote to teacher' }, { status: 500 })
  }
}
