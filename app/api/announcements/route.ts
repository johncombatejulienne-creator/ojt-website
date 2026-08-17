import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    let where: any = { isActive: true }

    // Students see announcements for their strand/section
    if (session.user.role === 'student') {
      const student = await prisma.student.findUnique({
        where: { email: session.user.email! },
        select: { strandId: true, sectionId: true },
      })

      if (!student) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 })
      }

      where.OR = [
        { targetType: 'all' },
        { targetType: 'strand', strandId: student.strandId },
        { targetType: 'section', sectionId: student.sectionId },
        { 
          targetType: 'strand_section',
          strandId: student.strandId,
          sectionId: student.sectionId,
        },
      ]
    } 
    // Teachers see their own announcements
    else if (session.user.role === 'teacher') {
      const teacher = await prisma.teacher.findUnique({
        where: { email: session.user.email! },
      })

      if (!teacher) {
        return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
      }

      where.teacherId = teacher.id
    }

    if (type) {
      where.type = type
    }

    // Filter by expiration date
    where.OR = where.OR || []
    where.OR.push({ expiresAt: null })
    where.OR.push({ expiresAt: { gt: new Date() } })

    const announcements = await prisma.announcement.findMany({
      where,
      include: {
        teacher: {
          select: {
            name: true,
            email: true,
          },
        },
        strand: {
          select: {
            name: true,
          },
        },
        section: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { publishedAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ announcements })
  } catch (error) {
    console.error('Error fetching announcements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch announcements' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user || session.user.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teacher = await prisma.teacher.findUnique({
      where: { email: session.user.email! },
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      title,
      content,
      type,
      targetType,
      strandId,
      sectionId,
      expiresAt,
    } = body

    if (!title || !content || !type || !targetType) {
      return NextResponse.json(
        { error: 'Title, content, type, and target type are required' },
        { status: 400 }
      )
    }

    // Validate target type
    const validTargetTypes = ['all', 'strand', 'section', 'strand_section']
    if (!validTargetTypes.includes(targetType)) {
      return NextResponse.json(
        { error: 'Invalid target type' },
        { status: 400 }
      )
    }

    // Validate required fields based on target type
    if (targetType === 'strand' && !strandId) {
      return NextResponse.json(
        { error: 'Strand ID required for strand targeting' },
        { status: 400 }
      )
    }

    if (targetType === 'section' && !sectionId) {
      return NextResponse.json(
        { error: 'Section ID required for section targeting' },
        { status: 400 }
      )
    }

    if (targetType === 'strand_section' && (!strandId || !sectionId)) {
      return NextResponse.json(
        { error: 'Strand ID and Section ID required for strand_section targeting' },
        { status: 400 }
      )
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        type,
        targetType,
        strandId: strandId || null,
        sectionId: sectionId || null,
        teacherId: teacher.id,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: {
        strand: true,
        section: true,
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: teacher.id,
        userType: 'teacher',
        action: 'announcement_created',
        description: `Created announcement: ${title}`,
        metadata: JSON.stringify({
          announcementId: announcement.id,
          targetType,
          type,
        }),
      },
    })

    return NextResponse.json({ success: true, announcement })
  } catch (error) {
    console.error('Error creating announcement:', error)
    return NextResponse.json(
      { error: 'Failed to create announcement' },
      { status: 500 }
    )
  }
}
