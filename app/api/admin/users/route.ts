import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/users
 * Returns all registered students and teachers.
 * Only accessible by teachers.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify requester is a teacher
    const teacher = await prisma.teacher.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher access required' }, { status: 403 })
    }

    // Fetch all students
    const students = await prisma.student.findMany({
      select: {
        id: true,
        studentId: true,
        name: true,
        email: true,
        profilePicture: true,
        createdAt: true,
        strand:    { select: { name: true } },
        section:   { select: { name: true } },
        supervisor:{ select: { name: true } },
        _count:    { select: { narratives: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Fetch all teachers
    const teachers = await prisma.teacher.findMany({
      select: {
        id: true,
        teacherId: true,
        name: true,
        email: true,
        profilePicture: true,
        role: true,
        accessLevel: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      students: students.map(s => ({
        ...s,
        role: 'student',
        narrativeCount: s._count.narratives,
        strandName:   s.strand?.name ?? null,
        sectionName:  s.section?.name ?? null,
        supervisorName: s.supervisor?.name ?? null,
      })),
      teachers: teachers.map(t => ({ ...t, role: 'teacher' })),
      total: { students: students.length, teachers: teachers.length },
    })
  } catch (error) {
    console.error('GET /api/admin/users error:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
