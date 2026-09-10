import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/** GET /api/narratives/[id] — get full narrative detail */
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
          },
        },
        photos: true,
        reviews: {
          include: { teacher: { select: { name: true } } },
        },
      },
    })

    if (!narrative) return NextResponse.json({ error: 'Narrative not found' }, { status: 404 })

    // Students can only see their own; teachers can see all
    if (session.user.role === 'student') {
      const student = await prisma.student.findUnique({
        where: { email: session.user.email }, select: { id: true },
      })
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
