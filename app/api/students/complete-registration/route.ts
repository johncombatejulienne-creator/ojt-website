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

    const { studentId, gradeLevel, strandId, sectionId, sectionName, company, course } = await request.json()

    if (!studentId || !gradeLevel || !strandId) {
      return NextResponse.json(
        { error: 'Student ID, grade level, and strand are required' },
        { status: 400 }
      )
    }

    if (!sectionId && !sectionName) {
      return NextResponse.json(
        { error: 'Please select a section or enter a custom section name' },
        { status: 400 }
      )
    }

    let finalSectionId = sectionId
    let teacherId = null

    // If custom section name is provided, create or find the section
    if (sectionName && !sectionId) {
      // Check if section with this name already exists for this strand
      let section = await prisma.section.findFirst({
        where: {
          name: sectionName.trim(),
          strandId: strandId,
        },
      })

      // If section doesn't exist, create it
      if (!section) {
        section = await prisma.section.create({
          data: {
            name: sectionName.trim(),
            gradeLevel: gradeLevel,
            strandId: strandId,
            isActive: true,
          },
        })
      }

      finalSectionId = section.id
      teacherId = section.teacherId
    } else if (sectionId) {
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

      teacherId = section.teacherId
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
        sectionId: finalSectionId,
        supervisorId: teacherId, // Auto-assign teacher if available
        company,
        course,
      },
      create: {
        studentId,
        email: session.user.email!,
        name: session.user.name || '',
        gradeLevel,
        strandId,
        sectionId: finalSectionId,
        supervisorId: teacherId, // Auto-assign teacher if available
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
          sectionId: finalSectionId,
          gradeLevel,
          assignedTeacher: student.supervisor?.name || 'None',
          customSection: sectionName ? true : false,
        }),
      },
    })

    const message = teacherId 
      ? `Successfully registered! You've been assigned to ${student.supervisor?.name}.`
      : `Successfully registered to ${student.section?.name}! A teacher will be assigned soon.`

    return NextResponse.json({
      success: true,
      student,
      message,
    })
  } catch (error) {
    console.error('Complete registration error:', error)
    return NextResponse.json(
      { error: 'Failed to complete registration' },
      { status: 500 }
    )
  }
}
