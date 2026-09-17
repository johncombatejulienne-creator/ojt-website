import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadToCloudinary, deleteFromCloudinary, isCloudinaryConfigured } from '@/lib/cloudinary'

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 5 * 1024 * 1024  // 5MB (Cloudinary compresses it)

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Use JPG, PNG, WebP or GIF.' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large. Max 5 MB.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    let imageUrl: string

    if (isCloudinaryConfigured()) {
      // Upload to Cloudinary — saves database storage
      const base64 = `data:${file.type};base64,${buffer.toString('base64')}`
      imageUrl = await uploadToCloudinary(base64, 'profile-pictures', {
        maxWidth: 400, maxHeight: 400, quality: 85,
      })
    } else {
      // Fallback: base64 in DB (works but uses storage)
      imageUrl = `data:${file.type};base64,${buffer.toString('base64')}`
    }

    // Check if teacher or student
    const teacher = await prisma.teacher.findUnique({
      where: { email: session.user.email }, select: { id: true, profilePicture: true },
    }).catch(() => null)

    let profilePicture: string

    if (teacher) {
      // Delete old Cloudinary image if exists
      if (teacher.profilePicture && isCloudinaryConfigured()) {
        await deleteFromCloudinary(teacher.profilePicture)
      }
      const updated = await prisma.teacher.update({
        where: { email: session.user.email },
        data:  { profilePicture: imageUrl },
        select: { profilePicture: true },
      })
      profilePicture = updated.profilePicture!
    } else {
      const student = await prisma.student.findUnique({
        where: { email: session.user.email }, select: { profilePicture: true },
      }).catch(() => null)
      // Delete old Cloudinary image if exists
      if (student?.profilePicture && isCloudinaryConfigured()) {
        await deleteFromCloudinary(student.profilePicture)
      }
      const updated = await prisma.student.upsert({
        where:  { email: session.user.email },
        update: { profilePicture: imageUrl },
        create: {
          email:          session.user.email,
          name:           session.user.name ?? session.user.email.split('@')[0],
          studentId:      `STU-${Date.now()}`,
          profilePicture: imageUrl,
        },
        select: { profilePicture: true },
      })
      profilePicture = updated.profilePicture!
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

    const teacher = await prisma.teacher.findUnique({
      where: { email: session.user.email }, select: { id: true, profilePicture: true },
    }).catch(() => null)

    if (teacher) {
      if (teacher.profilePicture && isCloudinaryConfigured()) {
        await deleteFromCloudinary(teacher.profilePicture)
      }
      await prisma.teacher.update({
        where: { email: session.user.email }, data: { profilePicture: null },
      })
    } else {
      const student = await prisma.student.findUnique({
        where: { email: session.user.email }, select: { profilePicture: true },
      }).catch(() => null)
      if (student?.profilePicture && isCloudinaryConfigured()) {
        await deleteFromCloudinary(student.profilePicture)
      }
      await prisma.student.update({
        where: { email: session.user.email }, data: { profilePicture: null },
      }).catch(() => {})
    }

    return NextResponse.json({ success: true, profilePicture: null })
  } catch (error) {
    console.error('Profile picture delete error:', error)
    return NextResponse.json({ error: 'Failed to remove profile picture' }, { status: 500 })
  }
}
