import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * DELETE /api/teacher/delete-account
 * Deletes the currently signed-in teacher's own account.
 */
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email || session.user.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teacher = await prisma.teacher.findUnique({
      where: { email: session.user.email },
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    // Audit log before deletion
    await prisma.auditLog.create({
      data: {
        userId:      teacher.id,
        userType:    'teacher',
        action:      'account_deleted',
        description: `Teacher ${teacher.name} deleted their own account`,
      },
    }).catch(() => {/* non-critical */})

    // Unassign students from this teacher (don't delete students)
    await prisma.student.updateMany({
      where: { supervisorId: teacher.id },
      data:  { supervisorId: null },
    })

    // Remove sections assigned to this teacher
    await prisma.section.updateMany({
      where: { teacherId: teacher.id },
      data:  { teacherId: null },
    })

    // Delete teacher (cascade deletes announcements, reviews, notifications)
    await prisma.teacher.delete({ where: { id: teacher.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete teacher account error:', error)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}
