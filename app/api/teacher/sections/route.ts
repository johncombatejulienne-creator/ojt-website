import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Allow if role is teacher OR if email exists in Teacher table
    // This handles stale JWT tokens where role hasn't refreshed yet
    let isTeacher = session.user.role === 'teacher'
    if (!isTeacher) {
      const teacherRecord = await prisma.teacher.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      })
      isTeacher = !!teacherRecord
    }

    if (!isTeacher) {
      return NextResponse.json({ error: 'Unauthorized — teacher access only' }, { status: 401 })
    }

    // ALL students flat list
    const allStudents = await prisma.student.findMany({
      select: {
        id: true, studentId: true, name: true, email: true,
        profilePicture: true, gradeLevel: true, sectionId: true,
        section: { select: { name: true } },
        strand:  { select: { name: true } },
        narratives: {
          select: { id: true, status: true, submissionDate: true },
          orderBy: { submissionDate: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    })

    // Sections for filter tabs
    const sections = await prisma.section.findMany({
      where: { isActive: true },
      include: {
        strand:  { select: { id: true, name: true } },
        teacher: { select: { id: true, name: true, email: true } },
        students: {
          select: {
            id: true, studentId: true, name: true, email: true,
            profilePicture: true, gradeLevel: true, sectionId: true,
            section: { select: { name: true } },
            strand:  { select: { name: true } },
            narratives: {
              select: { id: true, status: true, submissionDate: true },
              orderBy: { submissionDate: 'desc' },
            },
          },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: [{ strand: { name: 'asc' } }, { name: 'asc' }],
    })

    const unassigned = allStudents.filter(s => !s.sectionId)
    const allSections = [
      ...sections,
      ...(unassigned.length > 0 ? [{
        id: 'unassigned', name: 'Unassigned', gradeLevel: 0,
        strandId: null, teacherId: null, isActive: true,
        createdAt: new Date(), updatedAt: new Date(),
        strand: { id: 'none', name: 'No Strand' },
        teacher: null,
        students: unassigned,
      }] : []),
    ]

    let pendingNarratives = 0
    try {
      pendingNarratives = await prisma.narrative.count({ where: { status: 'pending', isDraft: false } })
    } catch { /* status column may not exist */ }

    return NextResponse.json({
      sections: allSections,
      allStudents,
      stats: {
        totalStudents:    allStudents.length,
        totalSections:    sections.length,
        pendingNarratives,
      },
    })
  } catch (error) {
    console.error('Error fetching teacher sections:', error)
    return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 500 })
  }
}
