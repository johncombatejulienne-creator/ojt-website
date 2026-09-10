import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Always check DB by email — never trust JWT role
    const teacher = await prisma.teacher.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true },
    })
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher account required.' }, { status: 403 })
    }

    const { id } = await params
    const student = await prisma.student.findUnique({ where: { id } })
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Audit log (non-critical)
    await prisma.auditLog.create({
      data: {
        userId:      teacher.id,
        userType:    'teacher',
        action:      'student_deleted',
        description: `Teacher ${teacher.name} deleted student: ${student.name} (${student.studentId})`,
        metadata:    JSON.stringify({ studentId: student.id, studentEmail: student.email }),
      },
    }).catch(() => {})

    // Delete checklist progress
    await prisma.studentChecklistProgress.deleteMany({ where: { studentId: id } }).catch(() => {})

    // Delete photos attached to this student's narratives
    const narratives = await prisma.narrative.findMany({
      where: { studentId: id },
      select: { id: true },
    })
    const narrativeIds = narratives.map(n => n.id)
    if (narrativeIds.length > 0) {
      await prisma.photoMetadata.deleteMany({
        where: { photo: { narrativeId: { in: narrativeIds } } },
      }).catch(() => {})
      await prisma.photo.deleteMany({
        where: { narrativeId: { in: narrativeIds } },
      }).catch(() => {})
      await prisma.narrativeReview.deleteMany({
        where: { narrativeId: { in: narrativeIds } },
      }).catch(() => {})
      await prisma.narrative.deleteMany({ where: { studentId: id } }).catch(() => {})
    }

    // Delete the student record
    await prisma.student.delete({ where: { id } })

    return NextResponse.json({ success: true, message: `Student ${student.name} deleted.` })
  } catch (error) {
    console.error('Delete student error:', error)
    return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 })
  }
}
