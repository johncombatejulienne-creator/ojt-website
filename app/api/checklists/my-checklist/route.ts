import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const student = await prisma.student.findUnique({
      where: { email: session.user.email! },
      select: {
        id: true,
        strandId: true,
        sectionId: true,
        strand: true,
        section: true,
      },
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Find checklists applicable to this student
    const checklists = await prisma.checklist.findMany({
      where: {
        isActive: true,
        OR: [
          { targetType: 'strand', strandId: student.strandId },
          { targetType: 'section', sectionId: student.sectionId },
          {
            targetType: 'strand_section',
            strandId: student.strandId,
            sectionId: student.sectionId,
          },
        ],
      },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
    })

    // Get student's progress for these checklists
    const checklistIds = checklists.map(c => c.id)
    const progress = await prisma.studentChecklistProgress.findMany({
      where: {
        studentId: student.id,
        checklistId: { in: checklistIds },
      },
    })

    // Calculate overall progress stats
    const narrativeCount = await prisma.narrative.count({
      where: {
        studentId: student.id,
        isDraft: false,
      },
    })

    // Combine checklist data with progress
    const checklistsWithProgress = checklists.map(checklist => {
      const checklistProgress = progress.filter(p => p.checklistId === checklist.id)
      
      const itemsWithProgress = checklist.items.map(item => {
        const itemProgress = checklistProgress.find(p => p.checklistItemId === item.id)
        
        // Auto-calculate progress for narrative-type items
        let autoStatus = itemProgress?.status || 'pending'
        let autoCount = itemProgress?.completedCount || 0
        
        if (item.requirementType === 'narrative' && item.targetCount) {
          autoCount = Math.min(narrativeCount, item.targetCount)
          autoStatus = autoCount >= item.targetCount ? 'completed' : 
                      autoCount > 0 ? 'in_progress' : 'pending'
        }

        return {
          ...item,
          progress: {
            status: autoStatus,
            completedCount: autoCount,
            completedAt: itemProgress?.completedAt,
            notes: itemProgress?.notes,
          },
        }
      })

      const totalItems = checklist.items.length
      const completedItems = itemsWithProgress.filter(
        i => i.progress.status === 'completed'
      ).length
      const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0

      return {
        ...checklist,
        items: itemsWithProgress,
        stats: {
          totalItems,
          completedItems,
          progressPercentage: Math.round(progressPercentage),
        },
      }
    })

    return NextResponse.json({
      student: {
        name: student.strand?.name,
        section: student.section?.name,
      },
      checklists: checklistsWithProgress,
    })
  } catch (error) {
    console.error('Error fetching student checklist:', error)
    return NextResponse.json(
      { error: 'Failed to fetch checklist' },
      { status: 500 }
    )
  }
}
