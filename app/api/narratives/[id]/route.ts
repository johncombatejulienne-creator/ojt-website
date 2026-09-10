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
            strand:     { select: { name: true } },
            section:    { select: { name: true } },
            supervisor: { select: { name: true } },
          },
        },
        photos:  true,
        reviews: { include: { teacher: { select: { name: true } } } },
      },
    })
    if (!narrative) return NextResponse.json({ error: 'Narrative not found' }, { status: 404 })

    // Auth: teacher can see all; student can only see their own
    const teacher = await prisma.teacher.findUnique({
      where: { email: session.user.email }, select: { id: true },
    }).catch(() => null)

    if (!teacher) {
      const student = await prisma.student.findUnique({
        where: { email: session.user.email }, select: { id: true },
      }).catch(() => null)
      if (!student || narrative.studentId !== student.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    return NextResponse.json({ narrative })
  } catch (error) {
    console.error('GET narrative error:', error)
    return NextResponse.json({ error: 'Failed to fetch narrative' }, { status: 500 })
  }
}

/** DELETE /api/narratives/[id] — student deletes own narrative; teacher can also delete */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    const narrative = await prisma.narrative.findUnique({
      where: { id },
      select: { studentId: true },
    })
    if (!narrative) return NextResponse.json({ error: 'Narrative not found' }, { status: 404 })

    // Teachers can delete any narrative
    const teacher = await prisma.teacher.findUnique({
      where: { email: session.user.email }, select: { id: true },
    }).catch(() => null)

    if (!teacher) {
      // Must be the owning student
      const student = await prisma.student.findUnique({
        where: { email: session.user.email }, select: { id: true },
      }).catch(() => null)

      if (!student) {
        return NextResponse.json({ error: 'Account not found. Please sign in again.' }, { status: 403 })
      }
      if (narrative.studentId !== student.id) {
        return NextResponse.json({ error: 'Forbidden — you can only delete your own narratives.' }, { status: 403 })
      }
    }

    // Clean up PhotoMetadata first (no Prisma cascade for this)
    await prisma.photoMetadata.deleteMany({
      where: { photo: { narrativeId: id } },
    }).catch(() => {})

    // Delete narrative (cascades to Photo, NarrativeReview via schema)
    await prisma.narrative.delete({ where: { id } })

    await prisma.auditLog.create({
      data: {
        userId:      (teacher?.id ?? narrative.studentId),
        userType:    teacher ? 'teacher' : 'student',
        action:      'narrative_deleted',
        description: `Narrative ${id} deleted`,
      },
    }).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE narrative error:', error)
    return NextResponse.json({ error: 'Failed to delete narrative' }, { status: 500 })
  }
}
