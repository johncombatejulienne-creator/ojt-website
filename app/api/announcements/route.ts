import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    // Teachers see ALL active announcements (all their own + others)
    if (session.user.role === 'teacher') {
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

    // Students see announcements targeted at their strand/section/all
    if (session.user.role === 'student') {
      const student = await prisma.student.findUnique({
        where:  { email: session.user.email! },
        select: { strandId: true, sectionId: true },
      })
      if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

      const announcements = await prisma.announcement.findMany({
        where: {
          isActive: true,
          ...(type ? { type } : {}),
          OR: [
            { targetType: 'all' },
            { targetType: 'strand',  strandId:  student.strandId  },
            { targetType: 'section', sectionId: student.sectionId },
            { targetType: 'strand_section',
              strandId:  student.strandId,
              sectionId: student.sectionId },
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
    }

    return NextResponse.json({ announcements: [] })
  } catch (error) {
    console.error('GET announcements error:', error)
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teacher = await prisma.teacher.findUnique({ where: { email: session.user.email! } })
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })

    const body = await request.json()
    const { title, content, type = 'reminder', targetType = 'all', strandId, sectionId, expiresAt } = body

    if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 })
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
        userId:      teacher.id,
        userType:    'teacher',
        action:      'announcement_created',
        description: `Created announcement: ${title}`,
        metadata:    JSON.stringify({ announcementId: announcement.id, targetType, type }),
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
    if (!session?.user || session.user.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    await prisma.announcement.update({
      where: { id },
      data:  { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE announcement error:', error)
    return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 })
  }
}
