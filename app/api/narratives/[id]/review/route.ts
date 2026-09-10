import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/** POST /api/narratives/[id]/review — teacher approves or requests revision */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check teacher by DB
    const teacher = await prisma.teacher.findUnique({
      where: { email: session.user.email }, select: { id: true, name: true },
    })
    if (!teacher) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const body = await request.json()
    const { action, comment } = body

    if (!['approved', 'revision_requested'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const narrative = await prisma.narrative.findUnique({ where: { id } })
    if (!narrative) return NextResponse.json({ error: 'Narrative not found' }, { status: 404 })

    // Update narrative status
    await prisma.narrative.update({
      where: { id },
      data:  { status: action },
    })

    // Create review record
    await prisma.narrativeReview.create({
      data: {
        narrativeId: id,
        teacherId:   teacher.id,
        action,
        comment:     comment ?? null,
      },
    }).catch(() => {})

    return NextResponse.json({ success: true, status: action })
  } catch (error) {
    console.error('Review narrative error:', error)
    return NextResponse.json({ error: 'Failed to review narrative' }, { status: 500 })
  }
}
