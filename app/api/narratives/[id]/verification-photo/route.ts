import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/narratives/[id]/verification-photo
 * Saves a verification photo (base64 data URL) to the narrative's photos.
 * The photo is stored directly in the DB as a base64 string.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { photoDataUrl } = body

    if (!photoDataUrl || !photoDataUrl.startsWith('data:image/')) {
      return NextResponse.json({ error: 'Invalid photo data' }, { status: 400 })
    }

    // Verify the narrative belongs to this student
    const narrative = await prisma.narrative.findUnique({
      where: { id },
      select: { studentId: true },
    })
    if (!narrative) return NextResponse.json({ error: 'Narrative not found' }, { status: 404 })

    const student = await prisma.student.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })
    if (!student || narrative.studentId !== student.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Save as a Photo record (isVerified = true = it's a verification photo)
    const photo = await prisma.photo.create({
      data: {
        narrativeId: id,
        url:         photoDataUrl,
        filename:    `verification-${Date.now()}.jpg`,
        isVerified:  true,
        captureDate: new Date(),
      },
    })

    // Update narrative status to indicate photo was submitted
    await prisma.narrative.update({
      where: { id },
      data:  { verificationStatus: 'photo_submitted' },
    }).catch(() => {}) // field may not exist yet

    return NextResponse.json({ success: true, photoId: photo.id })
  } catch (error) {
    console.error('Verification photo error:', error)
    return NextResponse.json({ error: 'Failed to save verification photo' }, { status: 500 })
  }
}
