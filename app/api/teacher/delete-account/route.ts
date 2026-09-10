import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teacher = await prisma.teacher.findUnique({
      where: { email: session.user.email },
    })
    if (!teacher) {
      return NextResponse.json({ error: 'No teacher account found.' }, { status: 404 })
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
    }).catch(() => {})

    // Unassign sections owned by this teacher
    await prisma.section.updateMany({
      where: { teacherId: teacher.id },
      data:  { teacherId: null },
    }).catch(() => {})

    // Soft-delete announcements (set isActive=false) to avoid cascade FK issues
    await tryUpdate(() =>
      prisma.announcement.updateMany({
        where: { teacherId: teacher.id },
        data:  { isActive: false },
      })
    )

    // Delete narrative reviews by this teacher
    await prisma.narrativeReview.deleteMany({
      where: { teacherId: teacher.id },
    }).catch(() => {})

    // Delete notifications for this teacher
    await prisma.notification.deleteMany({
      where: { userId: teacher.id, userType: 'teacher' },
    }).catch(() => {})

    // Finally delete the teacher record
    await prisma.teacher.delete({ where: { id: teacher.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete teacher account error:', error)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}

async function tryUpdate(fn: () => Promise<unknown>) {
  try { await fn() } catch { /* ignore */ }
}
