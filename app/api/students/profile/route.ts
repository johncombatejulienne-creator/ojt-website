import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const student = await prisma.student.findUnique({
      where: { email: session.user.email! },
      include: {
        strand: {
          select: {
            id: true,
            name: true,
          },
        },
        section: {
          select: {
            id: true,
            name: true,
            gradeLevel: true,
          },
        },
        supervisor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    return NextResponse.json({ student })
  } catch (error) {
    console.error('Error fetching student profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, studentId, strandId, sectionId, company, course, gradeLevel } = body

    // Find the teacher assigned to the selected section
    let supervisorId = undefined
    if (sectionId) {
      const section = await prisma.section.findUnique({
        where: { id: sectionId },
        select: { teacherId: true },
      })
      supervisorId = section?.teacherId || undefined
    }

    const student = await prisma.student.update({
      where: { email: session.user.email! },
      data: {
        ...(name && { name }),
        ...(studentId && { studentId }),
        ...(strandId && { strandId }),
        ...(sectionId && { sectionId }),
        ...(company !== undefined && { company }),
        ...(course !== undefined && { course }),
        ...(gradeLevel && { gradeLevel }),
        ...(supervisorId && { supervisorId }),
      },
      include: {
        strand: true,
        section: true,
        supervisor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, student })
  } catch (error) {
    console.error('Error updating student profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
