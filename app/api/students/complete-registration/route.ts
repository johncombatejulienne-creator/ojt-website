import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { studentId, gradeLevel, strandId, sectionId, company, course } = await request.json()

    if (!studentId || !gradeLevel || !strandId || !sectionId) {
      return NextResponse.json(
        { error: 'Student ID, grade level, strand, and section are required' },
        { status: 400 }
      )
    }

    // Verify section belongs to strand
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: { teacher: true },
    })

    if (!section || section.strandId !== strandId) {
      return NextResponse.json(
        { error: 'Invalid strand/section combination' },
        { status: 400 }
      )
    }

    // Check if student ID is already taken
    const existingStudent = await prisma.student.findUnique({
      where: { studentId },
    })

    if (existingStudent && existingStudent.email !== session.user.email) {
      return NextResponse.json(
        { error: 'Student ID already registered to another account' },
        { status: 400 }
      )
    }

    // Create or update student with strand/section
    const student = await prisma.student.upsert({
      where: { email: session.user.email! },
      update: {
        studentId,
        name: session.user.name || '',
        gradeLevel,
        strandId,
        sectionId,
        supervisorId: section.teacherId, // Auto-assign teacher
        company,
        course,
      },
      create: {
        studentId,
        email: session.user.email!,
        name: session.user.name || '',
        gradeLevel,
        strandId,
        sectionId,
        supervisorId: section.teacherId, // Auto-assign teacher
        company,
        course,
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

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: student.id,
        userType: 'student',
        action: 'complete_registration',
        description: `Student completed registration: ${student.name} (${student.studentId}) - ${student.strand?.name} ${student.section?.name}`,
        metadata: JSON.stringify({
          strandId,
          sectionId,
          gradeLevel,
          assignedTeacher: section.teacher?.name,
        }),
      },
    })

    // TODO: Initialize checklist progress for this student's strand/section

    return NextResponse.json({
      success: true,
      student,
      message: `Successfully registered! You've been assigned to ${section.teacher?.name || 'a supervisor'}.`,
    })
  } catch (error) {
    console.error('Complete registration error:', error)
    return NextResponse.json(
      { error: 'Failed to complete registration' },
      { status: 500 }
    )
  }
}
