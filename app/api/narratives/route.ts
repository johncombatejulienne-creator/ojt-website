import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getVerificationStatus } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    let where: any = {}

    // Students can only see their own narratives
    if (session.user.role === 'student') {
      const student = await prisma.student.findUnique({
        where: { email: session.user.email! },
      })
      
      if (!student) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 })
      }
      
      where.studentId = student.id
    } else if (studentId) {
      where.studentId = studentId
    }

    if (status) {
      where.status = status
    }

    const [narratives, total] = await Promise.all([
      prisma.narrative.findMany({
        where,
        include: {
          student: {
            select: {
              name: true,
              studentId: true,
              email: true,
              company: true,
            },
          },
          photos: true,
          reviews: {
            include: {
              teacher: {
                select: {
                  name: true,
                  email: true,
                },
              },
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
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching narratives:', error)
    return NextResponse.json(
      { error: 'Failed to fetch narratives' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const student = await prisma.student.findUnique({
      where: { email: session.user.email! },
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      date,
      timeIn,
      timeOut,
      hoursRendered,
      content,
      isDraft,
      photos,
    } = body

    const submissionDate = new Date()
    const narrativeDate = new Date(date)
    const verification = getVerificationStatus(submissionDate, narrativeDate)

    // Get device info
    const userAgent = request.headers.get('user-agent') || 'Unknown'
    const deviceUsed = userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'

    const narrative = await prisma.narrative.create({
      data: {
        studentId: student.id,
        date: narrativeDate,
        timeIn,
        timeOut,
        hoursRendered: parseFloat(hoursRendered || 0),
        content,
        isDraft: isDraft || false,
        status: isDraft ? 'pending' : 'pending',
        verificationStatus: verification.status,
        submissionDate,
        submissionTime: submissionDate.toLocaleTimeString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        deviceUsed,
        photos: photos?.length > 0 ? {
          create: photos.map((photo: any) => ({
            url: photo.url,
            filename: photo.filename,
          })),
        } : undefined,
      },
      include: {
        photos: true,
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: student.id,
        userType: 'student',
        action: isDraft ? 'draft_saved' : 'narrative_submitted',
        description: `Narrative ${isDraft ? 'draft saved' : 'submitted'} for ${date}`,
        metadata: JSON.stringify({
          narrativeId: narrative.id,
          verificationStatus: verification.status,
        }),
      },
    })

    // Create notification for supervisor if not draft
    if (!isDraft && student.supervisorId) {
      await prisma.notification.create({
        data: {
          userId: student.supervisorId,
          userType: 'teacher',
          type: verification.status === 'late' ? 'late_submission' : 'new_submission',
          title: 'New Narrative Submitted',
          message: `${student.name} submitted a narrative for ${date}`,
          link: `/teacher/narratives/${narrative.id}`,
        },
      })
    }

    return NextResponse.json({ success: true, narrative })
  } catch (error) {
    console.error('Error creating narrative:', error)
    return NextResponse.json(
      { error: 'Failed to create narrative' },
      { status: 500 }
    )
  }
}
