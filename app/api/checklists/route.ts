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
    const targetType = searchParams.get('targetType')
    const strandId   = searchParams.get('strandId')
    const sectionId  = searchParams.get('sectionId')

    // Fetch all, then filter JS-side to handle isActive NULL on old rows
    const all = await prisma.checklist.findMany({
      include: {
        strand:  true,
        section: true,
        items:   { orderBy: { order: 'asc' } },
        _count:  { select: { progress: true } },
      },
      orderBy: { createdAt: 'desc' },
    }).catch(() => [])

    const checklists = all.filter((c: { isActive?: boolean | null; targetType?: string | null; strandId?: string | null; sectionId?: string | null }) => {
      if (c.isActive === false) return false
      if (targetType && c.targetType !== targetType) return false
      if (strandId  && c.strandId  !== strandId)  return false
      if (sectionId && c.sectionId !== sectionId) return false
      return true
    })

    return NextResponse.json({ checklists })
  } catch (error) {
    console.error('Error fetching checklists:', error)
    return NextResponse.json({ checklists: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check teacher by DB — never trust JWT role
    const teacher = await prisma.teacher.findUnique({
      where: { email: session.user.email }, select: { id: true },
    }).catch(() => null)
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher access required' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const { name, description, targetType, strandId, sectionId, items } = body as {
      name?: string; description?: string; targetType?: string
      strandId?: string; sectionId?: string
      items?: { title: string; description?: string; order?: number; requirementType?: string; isRequired?: boolean; targetCount?: number }[]
    }

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Allow 'all' as a valid targetType (global checklists)
    const validTargetTypes = ['all', 'strand', 'section', 'strand_section']
    const finalTargetType = targetType ?? 'all'
    if (!validTargetTypes.includes(finalTargetType)) {
      return NextResponse.json({ error: `Invalid target type. Use: ${validTargetTypes.join(', ')}` }, { status: 400 })
    }

    const checklist = await prisma.checklist.create({
      data: {
        name:       name.trim(),
        description: description ?? null,
        targetType:  finalTargetType,
        strandId:    strandId  || null,
        sectionId:   sectionId || null,
        isActive:    true,
        items: items?.length ? {
          create: items.map((item, idx) => ({
            title:           item.title,
            description:     item.description ?? null,
            order:           item.order ?? idx,
            requirementType: item.requirementType ?? 'general',
            isRequired:      item.isRequired !== false,
            targetCount:     item.targetCount ?? null,
          })),
        } : undefined,
      },
      include: { items: true, strand: true, section: true },
    })

    // Auto-assign to matching existing students
    const studentWhere: Record<string, string> = {}
    if ((finalTargetType === 'strand' || finalTargetType === 'strand_section') && strandId) {
      studentWhere.strandId = strandId
    }
    if ((finalTargetType === 'section' || finalTargetType === 'strand_section') && sectionId) {
      studentWhere.sectionId = sectionId
    }

    const students = await prisma.student.findMany({
      where: Object.keys(studentWhere).length ? studentWhere : {},
      select: { id: true },
    }).catch(() => [])

    if (students.length > 0 && checklist.items.length > 0) {
      await prisma.studentChecklistProgress.createMany({
        data: students.flatMap(s =>
          checklist.items.map(item => ({
            studentId:      s.id,
            checklistId:    checklist.id,
            checklistItemId: item.id,
            status:          'pending',
          }))
        ),
        skipDuplicates: true,
      }).catch(() => {})

      // Notify all affected students
      await prisma.notification.createMany({
        data: students.map(s => ({
          userId:   s.id,
          userType: 'student',
          type:     'new_requirement',
          title:    'New Requirement Added',
          message:  `Your teacher added a new checklist: "${checklist.name}". Check your requirements tab.`,
          link:     '/checklist',
          isRead:   false,
        })),
        skipDuplicates: true,
      }).catch(() => {})
    }

    return NextResponse.json({ success: true, checklist })
  } catch (error) {
    console.error('Error creating checklist:', error)
    return NextResponse.json({ error: 'Failed to create checklist' }, { status: 500 })
  }
}
