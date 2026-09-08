import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * DELETE /api/teacher/students/[id]
 * Teacher deletes a student account permanently.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email || session.user.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const student = await prisma.student.findUnique({ where: { id } })
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Audit before deletion
    const teacher = await prisma.teacher.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true },
    })

    await prisma.auditLog.create({
      data: {
        userId:      teacher?.id ?? 'unknown',
        userType:    'teacher',
        action:      'student_deleted',
        description: `Teacher ${teacher?.name} deleted student: ${student.name} (${student.studentId})`,
        metadata:    JSON.stringify({ studentId: student.id, studentEmail: student.email }),
      },
    }).catch(() => {/* non-critical */})

    // Delete student (cascade deletes narratives, photos, checklist progress)
    await prisma.student.delete({ where: { id } })

    return NextResponse.json({ success: true, message: `Student ${student.name} has been deleted.` })
  } catch (error) {
    console.error('Delete student error:', error)
    return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 })
  }
}
