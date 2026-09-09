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
    const wantsStats = searchParams.get('stats') === 'true'
    const studentIdParam = searchParams.get('studentId')
    const statusParam    = searchParams.get('status')
    const page  = parseInt(searchParams.get('page')  || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip  = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (session.user.role === 'student') {
      const student = await prisma.student.findUnique({
        where: { email: session.user.email! },
        select: { id: true },
      })
      if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })
      where.studentId = student.id
    } else if (studentIdParam) {
      where.studentId = studentIdParam
    }

    if (statusParam) where.status = statusParam

    // ── Stats mode ───────────────────────────────────────────────
    if (wantsStats) {
      const now       = new Date()
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - now.getDay())
      weekStart.setHours(0, 0, 0, 0)

      const [total, thisWeek, pending] = await Promise.all([
        prisma.narrative.count({ where: { ...where, isDraft: false } }),
        prisma.narrative.count({
          where: { ...where, isDraft: false, submissionDate: { gte: weekStart } },
        }),
        prisma.narrative.count({ where: { ...where, isDraft: false, status: 'pending' } }),
      ])

      return NextResponse.json({ stats: { total, thisWeek, pending } })
    }

    // ── List mode ────────────────────────────────────────────────
    const [narratives, total] = await Promise.all([
      prisma.narrative.findMany({
        where,
        include: {
          student: {
            select: { name: true, studentId: true, email: true, company: true },
          },
          photos: true,
          reviews: {
            include: {
              teacher: { select: { name: true, email: true } },
            },
          },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.narrative.count({ where }),
    ])

    return NextResponse.json({
      narratives,
      pagination: {
        page, limit, total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('GET narratives error:', error)
    return NextResponse.json({ error: 'Failed to fetch narratives' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized — students only' }, { status: 401 })
    }

    const student = await prisma.student.findUnique({
      where: { email: session.user.email! },
      select: { id: true, name: true, supervisorId: true },
    })
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

    const body = await request.json()
    const { date, content, isDraft, verificationPhotoUrl } = body

    if (!date)    return NextResponse.json({ error: 'Date is required' }, { status: 400 })
    if (!content) return NextResponse.json({ error: 'Content is required' }, { status: 400 })

    const submissionDate = new Date()
    const narrativeDate  = new Date(date)

    // Determine if on-time
    const sameDay = submissionDate.toDateString() === narrativeDate.toDateString()
    const verificationStatus = sameDay ? 'on_time' : 'late'

    // Device detection
    const ua         = request.headers.get('user-agent') ?? ''
    const deviceUsed = /mobile|android|iphone|ipad/i.test(ua) ? 'Mobile' : 'Desktop'

    // Safe timezone — never throw
    let timezone = 'Asia/Manila'
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (tz) timezone = tz
    } catch {}

    // Safe submissionTime — never throw, never undefined
    let submissionTime = '12:00:00 AM'
    try {
      const h  = submissionDate.getHours()
      const m  = submissionDate.getMinutes()
      const s  = submissionDate.getSeconds()
      const ap = h >= 12 ? 'PM' : 'AM'
      const hh = ((h % 12) || 12).toString().padStart(2, '0')
      const mm = m.toString().padStart(2, '0')
      const ss = s.toString().padStart(2, '0')
      submissionTime = `${hh}:${mm}:${ss} ${ap}`
    } catch {}

    const narrative = await prisma.narrative.create({
      data: {
        studentId:          student.id,
        date:               narrativeDate,
        content,
        isDraft:            isDraft ?? false,
        status:             'pending',
        verificationStatus,
        submissionDate,
        submissionTime,
        timezone,
        deviceUsed,
        // Store verification photo as a Photo record if provided
        ...(verificationPhotoUrl && !isDraft ? {
          photos: {
            create: [{
              url:      verificationPhotoUrl,
              filename: `verification-${Date.now()}.jpg`,
              isVerified: true,
            }],
          },
        } : {}),
      },
      include: { photos: true },
    })

    // Audit log (non-critical)
    await prisma.auditLog.create({
      data: {
        userId:      student.id,
        userType:    'student',
        action:      isDraft ? 'draft_saved' : 'narrative_submitted',
        description: `Narrative ${isDraft ? 'saved as draft' : 'submitted'} for ${date}`,
        metadata:    JSON.stringify({ narrativeId: narrative.id, verificationStatus }),
      },
    }).catch(() => {})

    // Notify supervisor (non-critical)
    if (!isDraft && student.supervisorId) {
      await prisma.notification.create({
        data: {
          userId:    student.supervisorId,
          userType:  'teacher',
          type:      verificationStatus === 'late' ? 'late_submission' : 'new_submission',
          title:     'New Narrative Submitted',
          message:   `${student.name} submitted a narrative for ${narrativeDate.toLocaleDateString()}`,
          link:      `/teacher/narratives/${narrative.id}`,
        },
      }).catch(() => {})
    }

    return NextResponse.json({ success: true, narrative })
  } catch (error) {
    console.error('POST narrative error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to create narrative', detail: msg }, { status: 500 })
  }
}
