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

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Must be teacher role
    if (session.user.role !== 'teacher') {
      return NextResponse.json({ error: 'Only teacher accounts can use this endpoint' }, { status: 403 })
    }

    const email = session.user.email

    const teacher = await prisma.teacher.findUnique({ where: { email } })

    if (!teacher) {
      return NextResponse.json(
        { error: 'No teacher account found. Please sign out and sign back in via the Teacher tab first.' },
        { status: 404 }
      )
    }

    // Unassign students
    await prisma.student.updateMany({
      where: { supervisorId: teacher.id },
      data:  { supervisorId: null },
    })

    // Unassign sections
    await prisma.section.updateMany({
      where: { teacherId: teacher.id },
      data:  { teacherId: null },
    })

    // Audit log (non-critical)
    await prisma.auditLog.create({
      data: {
        userId:      teacher.id,
        userType:    'teacher',
        action:      'account_deleted',
        description: `Teacher ${teacher.name} deleted their own account`,
      },
    }).catch(() => {})

    // Delete teacher record
    await prisma.teacher.delete({ where: { id: teacher.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete teacher account error:', error)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}
