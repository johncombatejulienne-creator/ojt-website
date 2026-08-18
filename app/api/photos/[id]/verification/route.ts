import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { verifyPhotoTimestamp, verifyGPSLocation } from '@/lib/photoVerification'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const photo = await prisma.photo.findUnique({
      where: { id: id },
      include: {
        metadata: true,
        narrative: {
          select: {
            date: true,
            submittedAt: true,
            student: {
              select: {
                name: true,
                company: true,
              },
            },
          },
        },
      },
    })

    if (!photo) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      )
    }

    let verification: {
      isVerified: boolean;
      hasMetadata: boolean;
      timestamp: {
        isValid: boolean;
        warning?: string;
        reason?: string;
      };
      gps: {
        isValid: boolean;
      };
    } = {
      isVerified: photo.isVerified,
      hasMetadata: !!photo.metadata,
      timestamp: {
        isValid: false,
        warning: 'No metadata available',
      },
      gps: {
        isValid: true,
      },
    }

    if (photo.metadata) {
      // Verify timestamp
      const timestampVerification = verifyPhotoTimestamp(
        photo.metadata.captureTimestamp,
        photo.narrative.submittedAt,
        photo.narrative.date
      )

      verification.timestamp = {
        isValid: timestampVerification.isValid,
        ...(timestampVerification.warning && { warning: timestampVerification.warning }),
        ...(timestampVerification.reason && { reason: timestampVerification.reason }),
      }

      // Verify GPS if available
      if (photo.metadata.gpsLatitude && photo.metadata.gpsLongitude) {
        // TODO: Get expected workplace coordinates from company database
        const gpsVerification = verifyGPSLocation(
          photo.metadata.gpsLatitude,
          photo.metadata.gpsLongitude
        )
        verification.gps = gpsVerification
      }
    }

    return NextResponse.json({
      photo: {
        id: photo.id,
        filename: photo.filename,
        captureDate: photo.captureDate,
        uploadedAt: photo.uploadedAt,
        isVerified: photo.isVerified,
      },
      metadata: photo.metadata ? {
        captureTimestamp: photo.metadata.captureTimestamp,
        deviceInfo: photo.metadata.deviceInfo,
        cameraModel: photo.metadata.cameraModel,
        gpsLatitude: photo.metadata.gpsLatitude,
        gpsLongitude: photo.metadata.gpsLongitude,
        imageHash: photo.metadata.imageHash,
        verificationNotes: photo.metadata.verificationNotes,
      } : null,
      narrative: {
        date: photo.narrative.date,
        submittedAt: photo.narrative.submittedAt,
        student: photo.narrative.student,
      },
      verification,
    })
  } catch (error) {
    console.error('Error fetching photo verification:', error)
    return NextResponse.json(
      { error: 'Failed to fetch verification data' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user || session.user.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { isVerified, verificationNotes } = body

    const photo = await prisma.photo.findUnique({
      where: { id: id },
      include: { metadata: true },
    })

    if (!photo) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      )
    }

    // Update photo verification status
    await prisma.photo.update({
      where: { id: id },
      data: { isVerified },
    })

    // Update metadata verification notes
    if (photo.metadata) {
      await prisma.photoMetadata.update({
        where: { id: photo.metadata.id },
        data: {
          isVerified,
          verificationNotes,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating photo verification:', error)
    return NextResponse.json(
      { error: 'Failed to update verification' },
      { status: 500 }
    )
  }
}
