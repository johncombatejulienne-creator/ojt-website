import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const strandId = searchParams.get('strandId')

    const where: any = { isActive: true }
    if (strandId) {
      where.strandId = strandId
    }

    const sections = await prisma.section.findMany({
      where,
      include: {
        strand: true,
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: { students: true },
        },
      },
      orderBy: [{ strandId: 'asc' }, { gradeLevel: 'desc' }, { name: 'asc' }],
    })

    return NextResponse.json({ sections })
  } catch (error) {
    console.error('Error fetching sections:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sections' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, gradeLevel, strandId, teacherId } = body

    if (!name || !gradeLevel || !strandId) {
      return NextResponse.json(
        { error: 'Name, grade level, and strand are required' },
        { status: 400 }
      )
    }

    // Check if section already exists
    const existing = await prisma.section.findUnique({
      where: {
        strandId_name: {
          strandId,
          name,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Section already exists for this strand' },
        { status: 400 }
      )
    }

    const section = await prisma.section.create({
      data: {
        name,
        gradeLevel,
        strandId,
        teacherId: teacherId || undefined,
      },
      include: {
        strand: true,
        teacher: true,
      },
    })

    return NextResponse.json({ success: true, section })
  } catch (error) {
    console.error('Error creating section:', error)
    return NextResponse.json(
      { error: 'Failed to create section' },
      { status: 500 }
    )
  }
}
