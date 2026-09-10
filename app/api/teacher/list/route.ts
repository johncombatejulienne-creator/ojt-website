import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/** Find or auto-create a Teacher record for this email */
async function ensureTeacher(email: string, name?: string | null, image?: string | null) {
  const existing = await prisma.teacher.findUnique({ where: { email } })
  if (existing) return existing
  return prisma.teacher.create({
    data: {
      email,
      name:           name ?? email.split('@')[0],
      teacherId:      `TCH-${Date.now()}`,
      role:           'teacher',
      accessLevel:    'teacher',
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

    // Auto-create Teacher record if missing (handles first-time teacher sign-in)
    const teacher = await ensureTeacher(
      session.user.email,
      session.user.name,
      session.user.image ?? null,
    )

    const teachers = await prisma.teacher.findMany({
      select: {
        id: true, teacherId: true, name: true, email: true,
        profilePicture: true, role: true, accessLevel: true,
        createdAt: true,
        sections: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    })

    // Suppress unused variable warning
    void teacher

    return NextResponse.json({ teachers })
  } catch (error) {
    console.error('GET teachers error:', error)
    return NextResponse.json({ error: 'Failed to fetch teachers' }, { status: 500 })
  }
}
