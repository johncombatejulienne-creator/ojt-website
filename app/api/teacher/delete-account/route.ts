import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * DELETE /api/teacher/delete-account
 * Deletes the currently signed-in teacher's own account.
 * Checks Teacher table directly — works even with stale JWT.
 */
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find by email — works even if JWT still says "student"
    const teacher = await prisma.teacher.findUnique({
      where: { email: session.user.email },
    })
    if (!teacher) {
      return NextResponse.json({
        error: 'No teacher account found for this email. Make sure you are signed in via the Teacher tab.',
      }, { status: 404 })
    }

    // Audit log (non-critical)
    await prisma.auditLog.create({
      data: {
        userId:      teacher.id,
        userType:    'teacher',
        action:      'account_deleted',
        description: `Teacher ${teacher.name} (${teacher.email}) deleted their account`,
      },
    }).catch(() => {})

    // Unassign students supervised by this teacher
    await prisma.student.updateMany({
      where: { supervisorId: teacher.id },
      data:  { supervisorId: null },
    })

    // Unassign sections owned by this teacher
    await prisma.section.updateMany({
      where: { teacherId: teacher.id },
      data:  { teacherId: null },
    })

    // Delete the teacher record (cascade deletes announcements, reviews, notifications)
    await prisma.teacher.delete({ where: { id: teacher.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete teacher account error:', error)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}
