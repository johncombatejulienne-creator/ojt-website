import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * DELETE /api/checklists/[id]
 * Teacher deletes a checklist and all associated student progress.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check teacher by DB
    const teacher = await prisma.teacher.findUnique({
      where: { email: session.user.email }, select: { id: true },
    }).catch(() => null)
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher access required' }, { status: 403 })
    }

    const { id } = await params

    const checklist = await prisma.checklist.findUnique({ where: { id } })
    if (!checklist) {
      return NextResponse.json({ error: 'Checklist not found' }, { status: 404 })
    }

    // Delete student progress records first (FK constraint)
    await prisma.studentChecklistProgress.deleteMany({
      where: { checklistId: id },
    }).catch(() => {})

    // Delete checklist items
    await prisma.checklistItem.deleteMany({
      where: { checklistId: id },
    }).catch(() => {})

    // Delete the checklist
    await prisma.checklist.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete checklist error:', error)
    return NextResponse.json({ error: 'Failed to delete checklist' }, { status: 500 })
  }
}

/**
 * GET /api/checklists/[id]
 * Get a single checklist with items.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const checklist = await prisma.checklist.findUnique({
      where: { id },
      include: {
        items:   { orderBy: { order: 'asc' } },
        strand:  { select: { name: true } },
        section: { select: { name: true } },
        _count:  { select: { progress: true } },
      },
    })

    if (!checklist) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ checklist })
  } catch (error) {
    console.error('GET checklist error:', error)
    return NextResponse.json({ error: 'Failed to fetch checklist' }, { status: 500 })
  }
}
