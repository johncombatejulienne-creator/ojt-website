import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // isActive may be NULL on old rows — get all strands, filter JS-side
    const allStrands = await prisma.strand.findMany({
      select: {
        id: true, name: true, description: true, isActive: true,
        _count: { select: { students: true, sections: true } },
      },
      orderBy: { name: 'asc' },
    }).catch(() =>
      prisma.strand.findMany({
        select: { id: true, name: true, description: true },
        orderBy: { name: 'asc' },
      })
    )
    // Treat isActive=null as active, exclude only explicitly false
    const strands = (allStrands as Array<{ id: string; name: string; description?: string | null; isActive?: boolean | null }>)
      .filter(s => s.isActive !== false)

    return NextResponse.json({ strands })
  } catch (error) {
    console.error('Error fetching strands:', error)
    return NextResponse.json({ strands: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { name, description } = body as { name?: string; description?: string }

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Strand name is required' }, { status: 400 })
    }

    const strand = await prisma.strand.create({
      data: { name: name.trim(), description: description ?? null },
    })

    return NextResponse.json({ success: true, strand })
  } catch (error) {
    console.error('Error creating strand:', error)
    return NextResponse.json({ error: 'Failed to create strand' }, { status: 500 })
  }
}
