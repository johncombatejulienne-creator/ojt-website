import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function ensureStudent(email: string, name?: string | null, image?: string | null) {
  const existing = await prisma.student.findUnique({ where: { email } })
  if (existing) return existing
  return prisma.student.create({
    data: {
      email,
      name:           name ?? email.split('@')[0],
      studentId:      `STU-${Date.now()}`,
      profilePicture: image ?? null,
    },
  })
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await ensureStudent(session.user.email, session.user.name, session.user.image ?? null)

    const student = await prisma.student.findUnique({
      where: { email: session.user.email },
      select: {
        id: true, studentId: true, name: true, email: true,
        profilePicture: true, company: true, course: true,
        gradeLevel: true, strandId: true, sectionId: true,
        supervisorId: true, createdAt: true, updatedAt: true,
        strand:    { select: { id: true, name: true } },
        section:   { select: { id: true, name: true, gradeLevel: true } },
        supervisor:{ select: { id: true, name: true, email: true } },
      },
    })

    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    return NextResponse.json({ student })
  } catch (error) {
    console.error('Error fetching student profile:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await ensureStudent(session.user.email, session.user.name, session.user.image ?? null)

    const body = await request.json()
    const { name, studentId, strandId, sectionId, sectionName, company, course, gradeLevel, profilePicture } = body

    // Resolve final section — custom name takes priority
    let finalSectionId: string | null = sectionId || null

    if (sectionName?.trim() && strandId) {
      // Find or create section by name
      const existing = await prisma.section.findFirst({
        where: { name: sectionName.trim(), strandId },
      })
      if (existing) {
        finalSectionId = existing.id
      } else {
        const created = await prisma.section.create({
          data: {
            name:      sectionName.trim(),
            gradeLevel: gradeLevel ? Number(gradeLevel) : 12,
            strandId,
            isActive:  true,
          },
        })
        finalSectionId = created.id
      }
    }

    // Resolve supervisor from section
    let supervisorId: string | null = null
    if (finalSectionId) {
      const sec = await prisma.section.findUnique({
        where: { id: finalSectionId },
        select: { teacherId: true },
      })
      supervisorId = sec?.teacherId ?? null
    }

    const updateData: Record<string, unknown> = {}
    if (name           !== undefined) updateData.name           = name
    if (studentId      !== undefined && String(studentId).trim()) updateData.studentId = String(studentId).trim()
    if (strandId       !== undefined) updateData.strandId       = strandId       || null
    if (finalSectionId !== undefined) updateData.sectionId      = finalSectionId || null
    if (company        !== undefined) updateData.company        = company        || null
    if (course         !== undefined) updateData.course         = course         || null
    if (gradeLevel     !== undefined) updateData.gradeLevel     = Number(gradeLevel)
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture || null
    if (supervisorId   !== undefined) updateData.supervisorId   = supervisorId   || null

    let student
    try {
      student = await prisma.student.update({
        where: { email: session.user.email },
        data:  updateData,
        select: {
          id: true, studentId: true, name: true, email: true,
          profilePicture: true, company: true, course: true,
          gradeLevel: true, strandId: true, sectionId: true, supervisorId: true,
          strand:    { select: { id: true, name: true } },
          section:   { select: { id: true, name: true, gradeLevel: true } },
          supervisor:{ select: { id: true, name: true, email: true } },
        },
      })
    } catch (updateError: unknown) {
      const msg = updateError instanceof Error ? updateError.message : ''
      if (msg.includes('nique') || msg.includes('studentId') || msg.includes('P2002')) {
        return NextResponse.json({ error: 'That Student ID is already taken. Please use a different one.' }, { status: 400 })
      }
      throw updateError
    }

    await prisma.auditLog.create({
      data: {
        userId: student.id, userType: 'student', action: 'profile_update',
        description: `Student updated profile: ${student.name}`,
      },
    }).catch(() => {})

    return NextResponse.json({ success: true, student })
  } catch (error) {
    console.error('Error updating student profile:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
