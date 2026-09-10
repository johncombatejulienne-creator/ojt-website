import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

/**
 * POST /api/auth/promote-to-teacher
 * Called from teacher dashboard on load.
 * Creates a Teacher record for the current user if:
 *   - Their session says role === 'teacher'  OR
 *   - The signin_intent cookie says 'teacher' (signed in via teacher tab)
 *
 * This handles the race where JWT resolves as 'student' on first load
 * because the Teacher record didn't exist yet when the token was minted.
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const email = session.user.email

    // Allow if: already a teacher in session, OR has teacher intent cookie
    const cookieStore = await cookies()
    const intent = cookieStore.get('signin_intent')?.value
    const isTeacherIntent = session.user.role === 'teacher' || intent === 'teacher'

    if (!isTeacherIntent) {
      return NextResponse.json({ error: 'Not a teacher session' }, { status: 403 })
    }

    // Already has a Teacher record?
    const existing = await prisma.teacher.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ success: true, already: true, teacherId: existing.id })
    }

    // Create Teacher record — reuse name/picture from Student if exists
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
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
