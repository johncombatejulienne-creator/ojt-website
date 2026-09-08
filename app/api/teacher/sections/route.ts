import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user || session.user.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all sections with their students, sorted by strand and section name
    const sections = await prisma.section.findMany({
      where: {
        isActive: true,
      },
      include: {
        strand: {
          select: {
            id: true,
            name: true,
          },
        },
        students: {
          select: {
            id: true,
            studentId: true,
            name: true,
            email: true,
            profilePicture: true,
            gradeLevel: true,
            section: {
              select: {
                name: true,
              },
            },
            strand: {
              select: {
                name: true,
              },
            },
            narratives: {
              select: {
                id: true,
                status: true,
                submittedAt: true,
              },
              orderBy: {
                submittedAt: 'desc',
              },
            },
          },
          orderBy: {
            name: 'asc', // Alphabetical order
          },
        },
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        {
          strand: {
            name: 'asc',
          },
        },
        {
          name: 'asc',
        },
      ],
    })

    // Get stats
    const totalStudents = await prisma.student.count()
    const pendingNarratives = await prisma.narrative.count({
      where: {
        status: 'pending',
      },
    })

    return NextResponse.json({
      sections,
      stats: {
        totalStudents,
        totalSections: sections.length,
        pendingNarratives,
      },
    })
  } catch (error) {
    console.error('Error fetching teacher sections:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sections' },
      { status: 500 }
    )
  }
}
