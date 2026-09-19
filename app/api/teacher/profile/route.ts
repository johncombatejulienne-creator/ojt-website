import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function upsertTeacher(email: string, name?: string | null, image?: string | null) {
  return prisma.teacher.upsert({
    where:  { email },
    update: {},
    create: {
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

    await upsertTeacher(session.user.email, session.user.name, session.user.image ?? null)

    const teacher = await prisma.teacher.findUnique({
      where: { email: session.user.email },
      select: {
        id: true, teacherId: true, name: true, email: true,
        profilePicture: true, role: true, accessLevel: true,
        createdAt: true,
        sections: { select: { id: true, name: true } },
      },
    })

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

    const body = await request.json()
    const { name, teacherId } = body
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = { name: name.trim() }
    if (teacherId?.trim()) updateData.teacherId = teacherId.trim()

    // Single update query
    const updated = await prisma.teacher.update({
      where: { email: session.user.email },
      data:  updateData,
      select: { id: true, teacherId: true, name: true, email: true, profilePicture: true },
    }).catch(async () => {
      await upsertTeacher(session.user.email!, session.user.name, session.user.image ?? null)
      return prisma.teacher.update({
        where: { email: session.user.email! },
        data:  updateData,
        select: { id: true, teacherId: true, name: true, email: true, profilePicture: true },
      })
    })

    return NextResponse.json({ success: true, teacher: updated })
  } catch (error) {
    console.error('PUT teacher profile error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
