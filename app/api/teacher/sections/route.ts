import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ── All sections with their students ────────────────────────
    const sections = await prisma.section.findMany({
      where: { isActive: true },
      include: {
        strand: { select: { id: true, name: true } },
        teacher: { select: { id: true, name: true, email: true } },
        students: {
          select: {
            id: true, studentId: true, name: true, email: true,
            profilePicture: true, gradeLevel: true,
            section: { select: { name: true } },
            strand:  { select: { name: true } },
            narratives: {
              select: { id: true, status: true, submittedAt: true },
              orderBy: { submittedAt: 'desc' },
            },
          },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: [{ strand: { name: 'asc' } }, { name: 'asc' }],
    })

    // ── Students with no section assigned (unassigned) ───────────
    const unassignedStudents = await prisma.student.findMany({
      where: { sectionId: null },
      select: {
        id: true, studentId: true, name: true, email: true,
        profilePicture: true, gradeLevel: true,
        section: { select: { name: true } },
        strand:  { select: { name: true } },
        narratives: {
          select: { id: true, status: true, submittedAt: true },
          orderBy: { submittedAt: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    })

    // Add unassigned as a virtual section so the dashboard shows them
    const allSections = [
      ...sections,
      ...(unassignedStudents.length > 0 ? [{
        id:        'unassigned',
        name:      'Unassigned',
        gradeLevel: 0,
        strandId:  null,
        teacherId: null,
        isActive:  true,
        createdAt: new Date(),
        updatedAt: new Date(),
        strand:    { id: 'none', name: 'No Strand' },
        teacher:   null,
        students:  unassignedStudents,
      }] : []),
    ]

    const totalStudents      = await prisma.student.count()
    const pendingNarratives  = await prisma.narrative.count({ where: { status: 'pending' } })

    return NextResponse.json({
      sections: allSections,
      stats: {
        totalStudents,
        totalSections:    sections.length,
        pendingNarratives,
      },
    })
  } catch (error) {
    console.error('Error fetching teacher sections:', error)
    return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 500 })
  }
}
