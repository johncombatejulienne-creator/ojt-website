import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/** Auto-create Student record if missing */
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

    const student = await ensureStudent(
      session.user.email,
      session.user.name,
      session.user.image ?? null,
    )

    const full = await prisma.student.findUnique({
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

    void student
    if (!full) return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    return NextResponse.json({ student: full })
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

    let finalSectionId = sectionId

    // If student typed a custom section name, find-or-create it
    if (sectionName?.trim() && strandId && !sectionId) {
      const existing = await prisma.section.findFirst({
        where: { name: sectionName.trim(), strandId },
      })
      if (existing) {
        finalSectionId = existing.id
      } else {
        const created = await prisma.section.create({
          data: {
            name:       sectionName.trim(),
            gradeLevel: gradeLevel ? Number(gradeLevel) : 12,
            strandId,
            isActive:   true,
          },
        })
        finalSectionId = created.id
      }
    }

    // Resolve supervisor from section
    let supervisorId: string | undefined = undefined
    if (finalSectionId) {
      const section = await prisma.section.findUnique({
        where: { id: finalSectionId },
        select: { teacherId: true },
      })
      supervisorId = section?.teacherId ?? undefined
    }

    const updateData: Record<string, unknown> = {}
    if (name           !== undefined) updateData.name           = name
    // Always update studentId if provided and non-empty
    if (studentId !== undefined && studentId.trim()) {
      updateData.studentId = studentId.trim()
    }
    if (strandId       !== undefined) updateData.strandId       = strandId || null
    // Convert empty string to null for foreign key fields
    if (finalSectionId !== undefined) updateData.sectionId      = finalSectionId || null
    if (company        !== undefined) updateData.company        = company || null
    if (course         !== undefined) updateData.course         = course || null
    if (gradeLevel     !== undefined) updateData.gradeLevel     = Number(gradeLevel)
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture || null
    if (supervisorId   !== undefined) updateData.supervisorId   = supervisorId || null

    let student: { id: string; studentId: string; name: string; email: string; profilePicture: string | null; company: string | null; course: string | null; gradeLevel: number | null; strandId: string | null; sectionId: string | null; supervisorId: string | null; strand: { id: string; name: string } | null; section: { id: string; name: string; gradeLevel: number } | null; supervisor: { id: string; name: string; email: string } | null }
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
      if (msg.includes('Unique') || msg.includes('unique') || msg.includes('studentId')) {
        return NextResponse.json({ error: 'That Student ID is already taken. Please use a different one.' }, { status: 400 })
      }
      throw updateError
    }

    await prisma.auditLog.create({
      data: {
        userId: student.id, userType: 'student', action: 'profile_update',
        description: `Student updated their profile: ${student.name}`,
        metadata: JSON.stringify({ updatedFields: Object.keys(updateData) }),
      },
    }).catch(() => {})

    return NextResponse.json({ success: true, student })
  } catch (error) {
    console.error('Error updating student profile:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ALWAYS look up by email — never trust JWT role (can be stale or 'pending')
    // If they are on the student dashboard they need their student record.
    // Auto-create if missing so first-time students never hit a 404.
    const student = await ensureStudent(
      session.user.email,
      session.user.name,
      session.user.image ?? null,
    )

    const full = await prisma.student.findUnique({
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

    // Suppress unused warning
    void student

    if (!full) return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    return NextResponse.json({ student: full })
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

    // Ensure student record exists (auto-create if needed)
    await ensureStudent(session.user.email, session.user.name, session.user.image ?? null)

    const body = await request.json()
    const { name, studentId, strandId, sectionId, company, course, gradeLevel, profilePicture } = body

    // Resolve supervisor from section if section changed
    let supervisorId: string | undefined = undefined
    if (sectionId) {
      const section = await prisma.section.findUnique({
        where: { id: sectionId },
        select: { teacherId: true },
      })
      supervisorId = section?.teacherId ?? undefined
    }

    const updateData: Record<string, unknown> = {}
    if (name           !== undefined) updateData.name           = name
    // Only update studentId if it's a real value (not the auto-generated STU-timestamp placeholder)
    if (studentId !== undefined && studentId.trim() && !studentId.startsWith('STU-')) {
      updateData.studentId = studentId
    }
    if (strandId       !== undefined) updateData.strandId       = strandId
    if (sectionId      !== undefined) updateData.sectionId      = sectionId
    if (company        !== undefined) updateData.company        = company
    if (course         !== undefined) updateData.course         = course
    if (gradeLevel     !== undefined) updateData.gradeLevel     = Number(gradeLevel)
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture
    if (supervisorId   !== undefined) updateData.supervisorId   = supervisorId

    // eslint-disable-next-line prefer-const
    let student: { id: string; studentId: string; name: string; email: string; profilePicture: string | null; company: string | null; course: string | null; gradeLevel: number | null; strandId: string | null; sectionId: string | null; supervisorId: string | null; strand: { id: string; name: string } | null; section: { id: string; name: string; gradeLevel: number } | null; supervisor: { id: string; name: string; email: string } | null }
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
      // Unique constraint on studentId — someone else already has that ID
      const msg = updateError instanceof Error ? updateError.message : ''
      if (msg.includes('Unique') || msg.includes('unique') || msg.includes('studentId')) {
        return NextResponse.json({ error: 'That Student ID is already taken. Please use a different one.' }, { status: 400 })
      }
      throw updateError
    }

    await prisma.auditLog.create({
      data: {
        userId: student.id, userType: 'student', action: 'profile_update',
        description: `Student updated their profile: ${student.name}`,
        metadata: JSON.stringify({ updatedFields: Object.keys(updateData) }),
      },
    }).catch(() => {})

    return NextResponse.json({ success: true, student })
  } catch (error) {
    console.error('Error updating student profile:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
