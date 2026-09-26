import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadImage } from '@/lib/storage'

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
      where: { id }, select: { studentId: true },
    })
    if (!narrative) return NextResponse.json({ error: 'Narrative not found' }, { status: 404 })

    const student = await prisma.student.findUnique({
      where: { email: session.user.email }, select: { id: true },
    })
    if (!student || narrative.studentId !== student.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Convert base64 data URL to buffer
    const matches = photoDataUrl.match(/^data:([^;]+);base64,(.+)$/)
    if (!matches) return NextResponse.json({ error: 'Invalid photo format' }, { status: 400 })
    const mimeType = matches[1]
    const buffer   = Buffer.from(matches[2], 'base64')

    // Upload: Supabase Storage first → Cloudinary fallback → base64 last resort
    const { url: photoUrl, provider } = await uploadImage(
      buffer, mimeType,
      'verification-photos', 'verification-photos',
      { maxWidth: 800, maxHeight: 600 }
    )
    console.log(`Verification photo uploaded via: ${provider}`)

    // Save Photo record
    const photo = await prisma.photo.create({
      data: {
        narrativeId: id,
        url:         photoUrl,
        filename:    `verification-${Date.now()}.jpg`,
        isVerified:  true,
        captureDate: new Date(),
      },
    })

    // Update narrative verificationStatus (valid values: on_time | late)
    await prisma.narrative.update({
      where: { id },
      data:  { verificationStatus: 'on_time' },
    }).catch(() => {})

    return NextResponse.json({ success: true, photoId: photo.id, provider })
  } catch (error) {
    console.error('Verification photo error:', error)
    return NextResponse.json({ error: 'Failed to save verification photo' }, { status: 500 })
  }
}
