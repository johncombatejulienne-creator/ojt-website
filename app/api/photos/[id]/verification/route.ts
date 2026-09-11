import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const photo = await prisma.photo.findUnique({
      where: { id },
      include: {
        metadata: true,
        narrative: {
          select: {
            date:           true,
            submissionDate: true,  // correct field name (not submittedAt)
            student: { select: { name: true, company: true } },
          },
        },
      },
    })

    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }

    return NextResponse.json({
      photo: {
        id:          photo.id,
        filename:    photo.filename,
        captureDate: photo.captureDate,
        uploadedAt:  photo.uploadedAt,
        isVerified:  photo.isVerified,
      },
      metadata: photo.metadata ? {
        captureTimestamp:  photo.metadata.captureTimestamp,
        deviceInfo:        photo.metadata.deviceInfo,
        cameraModel:       photo.metadata.cameraModel,
        gpsLatitude:       photo.metadata.gpsLatitude,
        gpsLongitude:      photo.metadata.gpsLongitude,
        imageHash:         photo.metadata.imageHash,
        verificationNotes: photo.metadata.verificationNotes,
      } : null,
      narrative: {
        date:          photo.narrative.date,
        submittedAt:   photo.narrative.submissionDate,
        student:       photo.narrative.student,
      },
      verification: {
        isVerified:  photo.isVerified,
        hasMetadata: !!photo.metadata,
      },
    })
  } catch (error) {
    console.error('Error fetching photo verification:', error)
    return NextResponse.json({ error: 'Failed to fetch verification data' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check teacher by DB not JWT role
    const teacher = await prisma.teacher.findUnique({
      where: { email: session.user.email }, select: { id: true },
    }).catch(() => null)
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher access required' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const { isVerified, verificationNotes } = body as {
      isVerified?: boolean; verificationNotes?: string
    }

    const photo = await prisma.photo.findUnique({
      where: { id }, include: { metadata: true },
    })
    if (!photo) return NextResponse.json({ error: 'Photo not found' }, { status: 404 })

    await prisma.photo.update({ where: { id }, data: { isVerified: !!isVerified } })

    if (photo.metadata) {
      await prisma.photoMetadata.update({
        where: { id: photo.metadata.id },
        data:  { isVerified: !!isVerified, verificationNotes: verificationNotes ?? null },
      }).catch(() => {})
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating photo verification:', error)
    return NextResponse.json({ error: 'Failed to update verification' }, { status: 500 })
  }
}
