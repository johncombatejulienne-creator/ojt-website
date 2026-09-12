import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * PATCH /api/checklists/progress
 * Student marks a checklist item as done/undone.
 * Body: { checklistItemId: string, checklistId: string, done: boolean }
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const student = await prisma.student.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    }).catch(() => null)
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

    const { checklistItemId, checklistId, done } = await request.json().catch(() => ({})) as {
      checklistItemId?: string; checklistId?: string; done?: boolean
    }
    if (!checklistItemId || !checklistId) {
      return NextResponse.json({ error: 'checklistItemId and checklistId required' }, { status: 400 })
    }

    const newStatus = done ? 'completed' : 'pending'

    const progress = await prisma.studentChecklistProgress.upsert({
      where: {
        studentId_checklistItemId: {
          studentId:      student.id,
          checklistItemId,
        },
      },
      update: {
        status:      newStatus,
        completedAt: done ? new Date() : null,
        completedCount: done ? 1 : 0,
      },
      create: {
        studentId:      student.id,
        checklistId,
        checklistItemId,
        status:         newStatus,
        completedCount: done ? 1 : 0,
        completedAt:    done ? new Date() : null,
      },
    })

    return NextResponse.json({ success: true, progress })
  } catch (error) {
    console.error('Progress update error:', error)
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 })
  }
}
