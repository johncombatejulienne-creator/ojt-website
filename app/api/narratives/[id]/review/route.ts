import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const teacher = await prisma.teacher.findUnique({
      where: { email: session.user.email }, select: { id: true, name: true },
    })
    if (!teacher) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const { action, comment } = await request.json()

    if (!['approved', 'revision_requested'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const narrative = await prisma.narrative.findUnique({
      where: { id },
      include: { student: { select: { id: true, name: true } } },
    })
    if (!narrative) return NextResponse.json({ error: 'Narrative not found' }, { status: 404 })

    // Update narrative status
    await prisma.narrative.update({ where: { id }, data: { status: action } })

    // Create review record
    await prisma.narrativeReview.create({
      data: { narrativeId: id, teacherId: teacher.id, action, comment: comment ?? null },
    }).catch(() => {})

    // ── Notify the student ──────────────────────────────────
    const isApproved = action === 'approved'
    const notifTitle = isApproved
      ? 'Narrative Approved!'
      : 'Revision Requested'
    const activityTitle = narrative.content.match(/\*\*Activity:\*\*\s*(.+)/i)?.[1] ?? 'your narrative'
    const notifMessage = isApproved
      ? `${teacher.name} approved "${activityTitle}". Great work!`
      : `${teacher.name} requested a revision on "${activityTitle}".${comment ? ` Note: ${comment}` : ''}`

    await prisma.notification.create({
      data: {
        userId:   narrative.student.id,
        userType: 'student',
        type:     isApproved ? 'narrative_approved' : 'revision_requested',
        title:    notifTitle,
        message:  notifMessage,
        link:     `/narratives/${id}`,
        isRead:   false,
      },
    }).catch(() => {})

    return NextResponse.json({ success: true, status: action })
  } catch (error) {
    console.error('Review narrative error:', error)
    return NextResponse.json({ error: 'Failed to review narrative' }, { status: 500 })
  }
}
