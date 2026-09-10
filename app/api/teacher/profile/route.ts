import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/** Find or auto-create Teacher record */
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

    const teacher = await ensureTeacher(session.user.email, session.user.name, session.user.image ?? null)

    const full = await prisma.teacher.findUnique({
      where: { id: teacher.id },
      select: {
        id: true, teacherId: true, name: true, email: true,
        profilePicture: true, role: true, accessLevel: true,
        createdAt: true,
        sections: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ teacher: full })
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

    const teacher = await ensureTeacher(session.user.email, session.user.name, session.user.image ?? null)

    const body = await request.json()
    const { name } = body
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const updated = await prisma.teacher.update({
      where: { id: teacher.id },
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
