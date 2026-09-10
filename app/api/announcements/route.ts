import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

async function findTeacher(email: string) {
  return prisma.teacher.findUnique({ where: { email } })
}

/* ─── Helpers ──────────────────────────────────────────────
   We guard every query that touches optional columns
   (isActive, publishedAt, expiresAt, updatedAt) so the API
   works even if the Supabase table hasn't been migrated yet.
──────────────────────────────────────────────────────────── */

/** Try a Prisma call; on error return null so callers can fall back */
async function tryQuery<T>(fn: () => Promise<T>): Promise<T | null> {
  try { return await fn() } catch { return null }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    const teacher = await findTeacher(session.user.email)

    if (teacher) {
      // ── Teacher: try with isActive filter, fall back without it ──
      const whereWithActive: Record<string, unknown> = { isActive: true }
      if (type) whereWithActive.type = type

      const whereBasic: Record<string, unknown> = {}
      if (type) whereBasic.type = type

      let announcements = await tryQuery(() =>
        prisma.announcement.findMany({
          where: whereWithActive,
          include: {
            teacher: { select: { name: true, email: true } },
            strand:  { select: { name: true } },
            section: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 100,
        })
      )

      // Fallback: no isActive / publishedAt columns yet
      if (!announcements) {
        announcements = await tryQuery(() =>
          prisma.announcement.findMany({
            where: whereBasic,
            include: {
              teacher: { select: { name: true, email: true } },
              strand:  { select: { name: true } },
              section: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
          })
        )
      }

      return NextResponse.json({ announcements: announcements ?? [] })
    }

    // ── Student ──────────────────────────────────────────────
    const student = await prisma.student.findUnique({
      where: { email: session.user.email },
      select: { strandId: true, sectionId: true },
    })

    if (!student) return NextResponse.json({ announcements: [] })

    const studentWhere = {
      OR: [
        { targetType: 'all' },
        { targetType: 'strand',         strandId:  student.strandId  },
        { targetType: 'section',        sectionId: student.sectionId },
        { targetType: 'strand_section', strandId:  student.strandId, sectionId: student.sectionId },
      ],
      ...(type ? { type } : {}),
    }

    let announcements = await tryQuery(() =>
      prisma.announcement.findMany({
        where: { isActive: true, ...studentWhere },
        include: {
          teacher: { select: { name: true, email: true } },
          strand:  { select: { name: true } },
          section: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
    )

    // Fallback without isActive
    if (!announcements) {
      announcements = await tryQuery(() =>
        prisma.announcement.findMany({
          where: studentWhere,
          include: {
            teacher: { select: { name: true, email: true } },
            strand:  { select: { name: true } },
            section: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        })
      )
    }

    return NextResponse.json({ announcements: announcements ?? [] })
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

    const teacher = await findTeacher(session.user.email)
    if (!teacher) {
      return NextResponse.json({
        error: 'Teacher account not found. Sign in via the Teacher tab.',
      }, { status: 403 })
    }

    const body = await request.json()
    const { title, content, type = 'reminder', targetType = 'all', strandId, sectionId, expiresAt } = body

    if (!title?.trim())   return NextResponse.json({ error: 'Title is required' },   { status: 400 })
    if (!content?.trim()) return NextResponse.json({ error: 'Content is required' }, { status: 400 })

    // ── Attempt 1: full create with all optional columns ──
    let announcement = await tryQuery(() =>
      prisma.announcement.create({
        data: {
          title:     title.trim(),
          content:   content.trim(),
          type,
          targetType,
          strandId:  strandId  || null,
          sectionId: sectionId || null,
          teacherId: teacher.id,
          isActive:  true,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        },
        include: {
          teacher: { select: { name: true, email: true } },
          strand:  { select: { name: true } },
          section: { select: { name: true } },
        },
      })
    )

    // ── Attempt 2: minimal create (no optional columns) ──
    if (!announcement) {
      console.warn('Full announcement create failed — trying minimal create')
      announcement = await tryQuery(() =>
        prisma.announcement.create({
          data: {
            title:     title.trim(),
            content:   content.trim(),
            type,
            targetType,
            teacherId: teacher.id,
          },
          include: {
            teacher: { select: { name: true, email: true } },
            strand:  { select: { name: true } },
            section: { select: { name: true } },
          },
        })
      )
    }

    if (!announcement) {
      return NextResponse.json({ error: 'Failed to create announcement. Please run the Supabase SQL migration first.' }, { status: 500 })
    }

    // Audit log — non-critical
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
    const detail = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to create announcement', detail }, { status: 500 })
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

    // ── Try soft-delete first (isActive = false) ──
    const softDeleted = await tryQuery(() =>
      prisma.announcement.update({ where: { id }, data: { isActive: false } })
    )

    // ── Fall back to hard delete if isActive column doesn't exist ──
    if (!softDeleted) {
      await prisma.announcement.delete({ where: { id } })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE announcement error:', error)
    return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 })
  }
}
