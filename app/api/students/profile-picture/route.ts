import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Supported MIME types
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

// Max size: 2 MB
const MAX_SIZE_BYTES = 2 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPG, PNG, WebP, GIF' },
        { status: 400 }
      )
    }

    // Validate size
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 2 MB.' },
        { status: 400 }
      )
    }

    // Convert to base64 data URL for storage
    const buffer = Buffer.from(await file.arrayBuffer())
    const base64 = buffer.toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

    // Update the correct model based on role
    let profilePicture: string

    if (session.user.role === 'teacher') {
      const teacher = await prisma.teacher.update({
        where: { email: session.user.email },
        data: { profilePicture: dataUrl },
        select: { profilePicture: true },
      })
      profilePicture = teacher.profilePicture!
    } else {
      const student = await prisma.student.update({
        where: { email: session.user.email },
        data: { profilePicture: dataUrl },
        select: { profilePicture: true },
      })
      profilePicture = student.profilePicture!
    }

    // Audit log — non-critical
    try {
      const userId =
        session.user.role === 'teacher'
          ? (await prisma.teacher.findUnique({ where: { email: session.user.email }, select: { id: true } }))?.id
          : (await prisma.student.findUnique({ where: { email: session.user.email }, select: { id: true } }))?.id

      if (userId) {
        await prisma.auditLog.create({
          data: {
            userId,
            userType: session.user.role as 'student' | 'teacher',
            action: 'profile_picture_upload',
            description: `${session.user.role} updated profile picture`,
          },
        })
      }
    } catch {
      // Non-critical
    }

    return NextResponse.json({ success: true, profilePicture })
  } catch (error) {
    console.error('Profile picture upload error:', error)
    return NextResponse.json({ error: 'Failed to upload profile picture' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role === 'teacher') {
      await prisma.teacher.update({
        where: { email: session.user.email },
        data: { profilePicture: null },
      })
    } else {
      await prisma.student.update({
        where: { email: session.user.email },
        data: { profilePicture: null },
      })
    }

    return NextResponse.json({ success: true, profilePicture: null })
  } catch (error) {
    console.error('Profile picture delete error:', error)
    return NextResponse.json({ error: 'Failed to remove profile picture' }, { status: 500 })
  }
}
