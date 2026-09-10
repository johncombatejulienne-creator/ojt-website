import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Allow if role is teacher OR if email exists in Teacher table
    let isTeacher = session.user.role === 'teacher'
    if (!isTeacher) {
      const teacherRecord = await prisma.teacher.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      })
      isTeacher = !!teacherRecord
    }

    if (!isTeacher) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teachers = await prisma.teacher.findMany({
      select: {
        id: true, teacherId: true, name: true, email: true,
        profilePicture: true, role: true, accessLevel: true,
        createdAt: true,
        sections: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ teachers })
  } catch (error) {
    console.error('GET teachers error:', error)
    return NextResponse.json({ error: 'Failed to fetch teachers' }, { status: 500 })
  }
}
