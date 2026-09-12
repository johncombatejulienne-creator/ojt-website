import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Always check DB by email — never trust JWT role (can be stale or 'pending')
    const teacher = await prisma.teacher.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher access required' }, { status: 403 })
    }

    const { id } = await params

    const student = await prisma.student.findUnique({
      where: { id },
      select: {
        id: true, studentId: true, name: true, email: true,
        profilePicture: true, company: true, gradeLevel: true,
        section:    { select: { name: true } },
        strand:     { select: { name: true } },
        supervisor: { select: { id: true, name: true, email: true } },        narratives: {
          select: {
            id: true, status: true, date: true,
            submissionDate: true, content: true, isDraft: true,
          },
          orderBy: { date: 'desc' },
        },
      },
    })

    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    return NextResponse.json({ student })
  } catch (error) {
    console.error('student-detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch student' }, { status: 500 })
  }
}
