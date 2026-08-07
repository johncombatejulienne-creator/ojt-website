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

    const { studentId, company, course, section } = await request.json()

    // Check if student ID is already registered
    const existingStudent = await prisma.student.findUnique({
      where: { studentId },
    })

    if (existingStudent && existingStudent.email !== session.user.email) {
      return NextResponse.json(
        { error: 'Student ID already registered to another account' },
        { status: 400 }
      )
    }

    // Create or update student record
    const student = await prisma.student.upsert({
      where: { email: session.user.email! },
      update: {
        studentId,
        name: session.user.name || '',
        company,
        course,
        section,
      },
      create: {
        studentId,
        email: session.user.email!,
        name: session.user.name || '',
        company,
        course,
        section,
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: student.id,
        userType: 'student',
        action: 'registration',
        description: `Student registered with ID: ${studentId}`,
        metadata: JSON.stringify({ company, course, section }),
      },
    })

    return NextResponse.json({ success: true, student })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Failed to register student' },
      { status: 500 }
    )
  }
}
