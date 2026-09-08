import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Allow both students and teachers to fetch their own profile via this route
    if (session.user.role !== 'student') {
      return NextResponse.json({ error: 'Student access only' }, { status: 403 })
    }

    const student = await prisma.student.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        studentId: true,
        name: true,
        email: true,
        profilePicture: true,
        company: true,
        course: true,
        gradeLevel: true,
        strandId: true,
        sectionId: true,
        supervisorId: true,
        createdAt: true,
        updatedAt: true,
        strand: {
          select: { id: true, name: true },
        },
        section: {
          select: { id: true, name: true, gradeLevel: true },
        },
        supervisor: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

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

    if (session.user.role !== 'student') {
      return NextResponse.json({ error: 'Student access only' }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      studentId,
      strandId,
      sectionId,
      company,
      course,
      gradeLevel,
      profilePicture,
    } = body

    // Resolve supervisor from section if section changed
    let supervisorId: string | undefined = undefined
    if (sectionId) {
      const section = await prisma.section.findUnique({
        where: { id: sectionId },
        select: { teacherId: true },
      })
      supervisorId = section?.teacherId ?? undefined
    }

    // Build update payload — only include defined values
    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (studentId !== undefined) updateData.studentId = studentId
    if (strandId !== undefined) updateData.strandId = strandId
    if (sectionId !== undefined) updateData.sectionId = sectionId
    if (company !== undefined) updateData.company = company
    if (course !== undefined) updateData.course = course
    if (gradeLevel !== undefined) updateData.gradeLevel = Number(gradeLevel)
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture
    if (supervisorId !== undefined) updateData.supervisorId = supervisorId

    const student = await prisma.student.update({
      where: { email: session.user.email },
      data: updateData,
      select: {
        id: true,
        studentId: true,
        name: true,
        email: true,
        profilePicture: true,
        company: true,
        course: true,
        gradeLevel: true,
        strandId: true,
        sectionId: true,
        supervisorId: true,
        strand: { select: { id: true, name: true } },
        section: { select: { id: true, name: true, gradeLevel: true } },
        supervisor: { select: { id: true, name: true, email: true } },
      },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: student.id,
        userType: 'student',
        action: 'profile_update',
        description: `Student updated their profile: ${student.name}`,
        metadata: JSON.stringify({ updatedFields: Object.keys(updateData) }),
      },
    }).catch(() => {
      // Non-critical — don't fail the whole request
    })

    return NextResponse.json({ success: true, student })
  } catch (error) {
    console.error('Error updating student profile:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
