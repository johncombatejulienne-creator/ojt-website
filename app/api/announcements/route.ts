import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Always look up teacher by email — handles stale JWT
async function findTeacher(email: string) {
  return prisma.teacher.findUnique({ where: { email } })
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    // Check if this user is a teacher (by DB, not JWT role)
    const teacher = await findTeacher(session.user.email)
    if (teacher) {
      // Teachers see ALL active announcements
      const where: Record<string, unknown> = { isActive: true }
      if (type) where.type = type

      const announcements = await prisma.announcement.findMany({
        where,
        include: {
          teacher: { select: { name: true, email: true } },
          strand:  { select: { name: true } },
          section: { select: { name: true } },
        },
        orderBy: { publishedAt: 'desc' },
        take: 100,
      })
      return NextResponse.json({ announcements })
    }

    // Student: filter by their strand/section
    const student = await prisma.student.findUnique({
      where: { email: session.user.email },
      select: { strandId: true, sectionId: true },
    })

    if (!student) {
      // Neither teacher nor student found — return empty
      return NextResponse.json({ announcements: [] })
    }

    const announcements = await prisma.announcement.findMany({
      where: {
        isActive: true,
        ...(type ? { type } : {}),
        OR: [
          { targetType: 'all' },
          { targetType: 'strand',         strandId:  student.strandId  },
          { targetType: 'section',        sectionId: student.sectionId },
          { targetType: 'strand_section', strandId:  student.strandId, sectionId: student.sectionId },
        ],
      },
      include: {
        teacher: { select: { name: true, email: true } },
        strand:  { select: { name: true } },
        section: { select: { name: true } },
      },
      orderBy: { publishedAt: 'desc' },
      take: 50,
    })
    return NextResponse.json({ announcements })
  } catch (error) {
    console.error('GET announcements error:', error)
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find teacher by email — works even with stale JWT
    const teacher = await findTeacher(session.user.email)
    if (!teacher) {
      return NextResponse.json({
        error: 'Teacher account not found. Make sure you signed in via the Teacher tab.',
      }, { status: 403 })
    }

    const body = await request.json()
    const { title, content, type = 'reminder', targetType = 'all', strandId, sectionId, expiresAt } = body

    if (!title?.trim())   return NextResponse.json({ error: 'Title is required' },   { status: 400 })
    if (!content?.trim()) return NextResponse.json({ error: 'Content is required' }, { status: 400 })

    const announcement = await prisma.announcement.create({
      data: {
        title:     title.trim(),
        content:   content.trim(),
        type,
        targetType,
        strandId:  strandId  || null,
        sectionId: sectionId || null,
        teacherId: teacher.id,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: {
        teacher: { select: { name: true, email: true } },
        strand:  { select: { name: true } },
        section: { select: { name: true } },
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: teacher.id, userType: 'teacher', action: 'announcement_created',
        description: `Created announcement: ${title}`,
        metadata: JSON.stringify({ announcementId: announcement.id, targetType, type }),
      },
    }).catch(() => {})

    return NextResponse.json({ success: true, announcement })
  } catch (error) {
    console.error('POST announcement error:', error)
    return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teacher = await findTeacher(session.user.email)
    if (!teacher) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    await prisma.announcement.update({ where: { id }, data: { isActive: false } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE announcement error:', error)
    return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 })
  }
}
