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

    // Find by email — works even if JWT still says "student"
    const teacher = await prisma.teacher.findUnique({
      where: { email: session.user.email },
      select: {
        id: true, teacherId: true, name: true, email: true,
        profilePicture: true, role: true, accessLevel: true,
        createdAt: true,
        sections: { select: { id: true, name: true } },
      },
    })

    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    return NextResponse.json({ teacher })
  } catch (error) {
    console.error('GET teacher profile error:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find by email — works even if JWT still says "student"
    const teacher = await prisma.teacher.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher record not found. Please sign in via the Teacher tab.' }, { status: 404 })
    }

    const body = await request.json()
    const { name } = body
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const updated = await prisma.teacher.update({
      where: { email: session.user.email },
      data:  { name: name.trim() },
      select: { id: true, teacherId: true, name: true, email: true, profilePicture: true },
    })

    await prisma.auditLog.create({
      data: {
        userId:      updated.id,
        userType:    'teacher',
        action:      'profile_update',
        description: `Teacher updated profile: ${updated.name}`,
      },
    }).catch(() => {})

    return NextResponse.json({ success: true, teacher: updated })
  } catch (error) {
    console.error('PUT teacher profile error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
