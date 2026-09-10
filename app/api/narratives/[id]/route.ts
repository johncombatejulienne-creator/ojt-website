import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/** GET /api/narratives/[id] — full narrative with photos */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const narrative = await prisma.narrative.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true, name: true, studentId: true, email: true,
            company: true, gradeLevel: true,
            strand:  { select: { name: true } },
            section: { select: { name: true } },
            supervisor: { select: { name: true } },
          },
        },
        photos:  true,
        reviews: { include: { teacher: { select: { name: true } } } },
      },
    })
    if (!narrative) return NextResponse.json({ error: 'Narrative not found' }, { status: 404 })

    // Students can only read their own
    const student = await prisma.student.findUnique({
      where: { email: session.user.email }, select: { id: true },
    }).catch(() => null)

    if (student && narrative.studentId !== student.id) {
      // Check if requester is a teacher (can see all)
      const teacher = await prisma.teacher.findUnique({
        where: { email: session.user.email }, select: { id: true },
      }).catch(() => null)
      if (!teacher) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ narrative })
  } catch (error) {
    console.error('GET narrative error:', error)
    return NextResponse.json({ error: 'Failed to fetch narrative' }, { status: 500 })
  }
}

/**
 * DELETE /api/narratives/[id]
 * Only the student who owns the narrative can delete it.
 * Cascade deletes all photos and reviews via Prisma onDelete: Cascade.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    // Find the narrative
    const narrative = await prisma.narrative.findUnique({
      where: { id },
      select: { studentId: true },
    })
    if (!narrative) return NextResponse.json({ error: 'Narrative not found' }, { status: 404 })

    // Only the owning student can delete — find student by email regardless of JWT role
    const student = await prisma.student.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })
    if (!student) {
      return NextResponse.json({
        error: 'No student account found for this email. Make sure you are signed in as a student.',
      }, { status: 403 })
    }
    if (narrative.studentId !== student.id) {
      return NextResponse.json({ error: 'Forbidden — you can only delete your own narratives' }, { status: 403 })
    }

    // Cascade delete — schema has onDelete: Cascade for Photo and NarrativeReview
    // but we manually clean up PhotoMetadata first (no cascade from Photo → PhotoMetadata yet)
    await prisma.photoMetadata.deleteMany({
      where: { photo: { narrativeId: id } },
    }).catch(() => {})

    await prisma.narrative.delete({ where: { id } })

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId:      student.id,
        userType:    'student',
        action:      'narrative_deleted',
        description: `Student deleted narrative ${id}`,
      },
    }).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE narrative error:', error)
    return NextResponse.json({ error: 'Failed to delete narrative' }, { status: 500 })
  }
}
