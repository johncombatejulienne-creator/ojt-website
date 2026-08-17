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
    const targetType = searchParams.get('targetType')
    const strandId = searchParams.get('strandId')
    const sectionId = searchParams.get('sectionId')

    let where: any = { isActive: true }

    if (targetType) where.targetType = targetType
    if (strandId) where.strandId = strandId
    if (sectionId) where.sectionId = sectionId

    const checklists = await prisma.checklist.findMany({
      where,
      include: {
        strand: true,
        section: true,
        items: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { progress: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ checklists })
  } catch (error) {
    console.error('Error fetching checklists:', error)
    return NextResponse.json(
      { error: 'Failed to fetch checklists' },
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

    const body = await request.json()
    const { name, description, targetType, strandId, sectionId, items } = body

    if (!name || !targetType) {
      return NextResponse.json(
        { error: 'Name and target type are required' },
        { status: 400 }
      )
    }

    const validTargetTypes = ['strand', 'section', 'strand_section']
    if (!validTargetTypes.includes(targetType)) {
      return NextResponse.json(
        { error: 'Invalid target type' },
        { status: 400 }
      )
    }

    const checklist = await prisma.checklist.create({
      data: {
        name,
        description,
        targetType,
        strandId: strandId || null,
        sectionId: sectionId || null,
        items: items ? {
          create: items.map((item: any, index: number) => ({
            title: item.title,
            description: item.description,
            order: item.order || index,
            requirementType: item.requirementType,
            isRequired: item.isRequired !== false,
            targetCount: item.targetCount || null,
          })),
        } : undefined,
      },
      include: {
        items: true,
        strand: true,
        section: true,
      },
    })

    // Auto-assign checklist to existing students in the target strand/section
    const students = await prisma.student.findMany({
      where: {
        ...(targetType === 'strand' && strandId && { strandId }),
        ...(targetType === 'section' && sectionId && { sectionId }),
        ...(targetType === 'strand_section' && strandId && sectionId && {
          strandId,
          sectionId,
        }),
      },
    })

    if (students.length > 0 && checklist.items.length > 0) {
      const progressRecords = students.flatMap(student =>
        checklist.items.map(item => ({
          studentId: student.id,
          checklistId: checklist.id,
          checklistItemId: item.id,
          status: 'pending',
        }))
      )

      await prisma.studentChecklistProgress.createMany({
        data: progressRecords,
        skipDuplicates: true,
      })
    }

    return NextResponse.json({ success: true, checklist })
  } catch (error) {
    console.error('Error creating checklist:', error)
    return NextResponse.json(
      { error: 'Failed to create checklist' },
      { status: 500 }
    )
  }
}
