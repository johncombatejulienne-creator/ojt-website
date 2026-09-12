import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * PUT /api/teacher/students/[id]/supervisor
 * Body: { supervisorId: string | null }
 * Assigns or removes a teacher supervisor for a student.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Requester must be a teacher
    const requester = await prisma.teacher.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })
    if (!requester) {
      return NextResponse.json({ error: 'Teacher access required' }, { status: 403 })
    }

    const { id } = await params
    const { supervisorId } = await request.json().catch(() => ({})) as { supervisorId?: string | null }

    // Validate the supervisor ID if provided
    if (supervisorId) {
      const teacher = await prisma.teacher.findUnique({
        where: { id: supervisorId },
        select: { id: true },
      })
      if (!teacher) {
        return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
      }
    }

    const student = await prisma.student.update({
      where: { id },
      data:  { supervisorId: supervisorId || null },
      select: {
        id: true, name: true,
        supervisor: { select: { id: true, name: true, email: true } },
      },
    })

    await prisma.auditLog.create({
      data: {
        userId:      requester.id,
        userType:    'teacher',
        action:      'supervisor_assigned',
        description: supervisorId
          ? `Assigned supervisor to student ${student.name}`
          : `Removed supervisor from student ${student.name}`,
      },
    }).catch(() => {})

    return NextResponse.json({ success: true, supervisor: student.supervisor })
  } catch (error) {
    console.error('Assign supervisor error:', error)
    return NextResponse.json({ error: 'Failed to assign supervisor' }, { status: 500 })
  }
}
