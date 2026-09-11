import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { studentId, company, course } = body as {
      studentId?: string; company?: string; course?: string
    }

    if (!studentId?.trim()) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
    }

    // Check if student ID is already taken by someone else
    const existing = await prisma.student.findUnique({ where: { studentId: studentId.trim() } })
    if (existing && existing.email !== session.user.email) {
      return NextResponse.json(
        { error: 'Student ID already registered to another account' },
        { status: 400 }
      )
    }

    const student = await prisma.student.upsert({
      where:  { email: session.user.email },
      update: { studentId: studentId.trim(), name: session.user.name ?? '', company, course },
      create: {
        studentId:      studentId.trim(),
        email:          session.user.email,
        name:           session.user.name ?? session.user.email.split('@')[0],
        company:        company ?? null,
        course:         course  ?? null,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId:      student.id,
        userType:    'student',
        action:      'registration',
        description: `Student registered with ID: ${studentId}`,
      },
    }).catch(() => {})

    return NextResponse.json({ success: true, student })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Failed to register student' }, { status: 500 })
  }
}
