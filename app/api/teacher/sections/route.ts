import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/** Find or auto-create a Teacher record for this email */
async function ensureTeacher(email: string, name?: string | null, image?: string | null) {
  const existing = await prisma.teacher.findUnique({ where: { email }, select: { id: true } })
  if (existing) return existing
  return prisma.teacher.create({
    data: {
      email,
      name:           name ?? email.split('@')[0],
      teacherId:      `TCH-${Date.now()}`,
      role:           'teacher',
      accessLevel:    'teacher',
      profilePicture: image ?? null,
    },
    select: { id: true },
  })
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Auto-create Teacher record if missing (first-time teacher sign-in)
    await ensureTeacher(session.user.email, session.user.name, session.user.image ?? null)

    // ALL students — flat list regardless of section
    const allStudents = await prisma.student.findMany({
      select: {
        id: true, studentId: true, name: true, email: true,
        profilePicture: true, gradeLevel: true, sectionId: true,
        section: { select: { name: true } },
        strand:  { select: { name: true } },
        narratives: {
          select: { id: true, status: true, submissionDate: true, isDraft: true },
          orderBy: { submissionDate: 'desc' },
          take: 5,
        },
      },
      orderBy: { name: 'asc' },
    })

    // Sections for filter tabs — get all sections (isActive may be NULL for old rows)
    const sections = await prisma.section.findMany({
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
              select: { id: true, status: true, submissionDate: true, isDraft: true },
              orderBy: { submissionDate: 'desc' },
              take: 5,
            },
          },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: [{ strand: { name: 'asc' } }, { name: 'asc' }],
    })

    // Virtual "Unassigned" section for students with no section
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
      pendingNarratives = await prisma.narrative.count({
        where: { status: 'pending', isDraft: false },
      })
    } catch { /* column may not exist */ }

    return NextResponse.json({
      sections:    allSections,
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
