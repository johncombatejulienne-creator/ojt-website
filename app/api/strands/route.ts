import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const strands = await prisma.strand.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { students: true, sections: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ strands })
  } catch (error) {
    console.error('Error fetching strands:', error)
    return NextResponse.json(
      { error: 'Failed to fetch strands' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Strand name is required' },
        { status: 400 }
      )
    }

    const strand = await prisma.strand.create({
      data: {
        name,
        description,
      },
    })

    return NextResponse.json({ success: true, strand })
  } catch (error) {
    console.error('Error creating strand:', error)
    return NextResponse.json(
      { error: 'Failed to create strand' },
      { status: 500 }
    )
  }
}
