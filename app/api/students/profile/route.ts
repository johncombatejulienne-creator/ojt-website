import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Upsert student — single atomic query, no race condition
async function upsertStudent(email: string, name?: string | null, image?: string | null) {
  return prisma.student.upsert({
    where:  { email },
    update: {},  // Don't overwrite existing data on GET
    create: {
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

    // Upsert then fetch full record
    await upsertStudent(session.user.email, session.user.name, session.user.image ?? null)

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

    const body = await request.json()
    const {
      name, studentId, strandId, sectionId, sectionName,
      company, course, gradeLevel, profilePicture,
    } = body

    // Ensure student exists
    await upsertStudent(session.user.email, session.user.name, session.user.image ?? null)

    // Resolve section — all section logic in one block to avoid concurrent queries
    let finalSectionId: string | null = sectionId || null
    let supervisorId:   string | null = null

    if (sectionName?.trim() && strandId) {
      // Find or create section by name (upsert pattern)
      const section = await prisma.section.upsert({
        where:  { strandId_name: { strandId, name: sectionName.trim() } },
        update: {},
        create: {
          name:       sectionName.trim(),
          gradeLevel: gradeLevel ? Number(gradeLevel) : 12,
          strandId,
          isActive:   true,
        },
        select: { id: true, teacherId: true },
      })
      finalSectionId = section.id
      supervisorId   = section.teacherId ?? null
    } else if (finalSectionId) {
      // Look up supervisor from existing section
      const sec = await prisma.section.findUnique({
        where:  { id: finalSectionId },
        select: { teacherId: true },
      })
      supervisorId = sec?.teacherId ?? null
    }

    // Build update payload — only include what was explicitly sent
    const updateData: Record<string, unknown> = {}
    if (name           !== undefined) updateData.name           = String(name).trim()
    if (studentId      !== undefined && String(studentId).trim()) {
      updateData.studentId = String(studentId).trim()
    }
    if (strandId       !== undefined) updateData.strandId       = strandId       || null
    if (finalSectionId !== undefined) updateData.sectionId      = finalSectionId || null
    if (company        !== undefined) updateData.company        = company        || null
    if (course         !== undefined) updateData.course         = course         || null
    if (gradeLevel     !== undefined) updateData.gradeLevel     = Number(gradeLevel)
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture || null
    // Only update supervisorId if a section was resolved in THIS request
    if (supervisorId !== null) updateData.supervisorId = supervisorId

    // Single update query
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
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : ''
      if (msg.includes('P2002') || msg.includes('nique') || msg.includes('studentId')) {
        return NextResponse.json({ error: 'That Student ID is already taken.' }, { status: 400 })
      }
      throw e
    }

    return NextResponse.json({ success: true, student })
  } catch (error) {
    console.error('Error updating student profile:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}