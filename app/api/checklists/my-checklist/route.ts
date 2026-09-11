import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

type ChecklistItem = {
  id: string; title: string; description: string | null; order: number
  requirementType: string | null; isRequired: boolean; targetCount: number | null
  checklistId: string; createdAt: Date; updatedAt: Date
}
type Checklist = {
  id: string; name: string; description: string | null; targetType: string
  strandId: string | null; sectionId: string | null; isActive: boolean
  createdAt: Date; updatedAt: Date; items: ChecklistItem[]
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ checklists: [] })
    }

    const student = await prisma.student.findUnique({
      where: { email: session.user.email },
      select: {
        id: true, strandId: true, sectionId: true,
        strand: true, section: true,
      },
    }).catch(() => null)

    if (!student) return NextResponse.json({ checklists: [] })

    // Fetch all checklists with items — filter JS-side to avoid NULL isActive issue
    const raw = await prisma.checklist.findMany({
      include: { items: { orderBy: { order: 'asc' } } },
    }).catch(() => [] as (Checklist & { items: ChecklistItem[] })[])

    const checklists = (raw as unknown as Checklist[]).filter(c => {
      if (c.isActive === false) return false
      const t = c.targetType ?? 'all'
      if (t === 'all') return true
      if (t === 'strand') return c.strandId === student.strandId
      if (t === 'section') return c.sectionId === student.sectionId
      if (t === 'strand_section') return c.strandId === student.strandId && c.sectionId === student.sectionId
      return true
    })

    if (!checklists.length) return NextResponse.json({ checklists: [] })

    const checklistIds = checklists.map(c => c.id)
    const [progress, narrativeCount] = await Promise.all([
      prisma.studentChecklistProgress.findMany({
        where: { studentId: student.id, checklistId: { in: checklistIds } },
      }).catch(() => []),
      prisma.narrative.count({
        where: { studentId: student.id, isDraft: false },
      }).catch(() => 0),
    ])

    const checklistsWithProgress = checklists.map(checklist => {
      const clProgress = progress.filter(p => p.checklistId === checklist.id)

      const itemsWithProgress = checklist.items.map(item => {
        const ip = clProgress.find(p => p.checklistItemId === item.id)
        let status = ip?.status ?? 'pending'
        let count  = ip?.completedCount ?? 0

        if (item.requirementType === 'narrative' && item.targetCount) {
          count  = Math.min(narrativeCount, item.targetCount)
          status = count >= item.targetCount ? 'completed'
                 : count > 0 ? 'in_progress' : 'pending'
        }
        return {
          ...item,
          progress: { status, completedCount: count, completedAt: ip?.completedAt ?? null, notes: ip?.notes ?? null },
        }
      })

      const total     = checklist.items.length
      const completed = itemsWithProgress.filter(i => i.progress.status === 'completed').length
      const pct       = total > 0 ? Math.round((completed / total) * 100) : 0
      return { ...checklist, items: itemsWithProgress, stats: { totalItems: total, completedItems: completed, progressPercentage: pct } }
    })

    return NextResponse.json({
      student: { name: student.strand?.name, section: student.section?.name },
      checklists: checklistsWithProgress,
    })
  } catch (error) {
    console.error('Error fetching checklist:', error)
    return NextResponse.json({ checklists: [] })
  }
}
