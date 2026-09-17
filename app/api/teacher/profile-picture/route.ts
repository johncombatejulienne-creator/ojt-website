import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadToCloudinary, deleteFromCloudinary, isCloudinaryConfigured } from '@/lib/cloudinary'

const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 5 * 1024 * 1024  // 5MB

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teacher = await prisma.teacher.findUnique({
      where: { email: session.user.email }, select: { id: true, profilePicture: true },
    })
    if (!teacher) return NextResponse.json({ error: 'Teacher record not found' }, { status: 404 })

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Use JPG, PNG, WebP or GIF.' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large. Max 5 MB.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    let imageUrl: string

    if (isCloudinaryConfigured()) {
      // Delete old image first
      if (teacher.profilePicture) await deleteFromCloudinary(teacher.profilePicture)
      const base64 = `data:${file.type};base64,${buffer.toString('base64')}`
      imageUrl = await uploadToCloudinary(base64, 'profile-pictures', {
        maxWidth: 400, maxHeight: 400, quality: 85,
      })
    } else {
      imageUrl = `data:${file.type};base64,${buffer.toString('base64')}`
    }

    const updated = await prisma.teacher.update({
      where: { email: session.user.email },
      data:  { profilePicture: imageUrl },
      select: { profilePicture: true },
    })

    return NextResponse.json({ success: true, profilePicture: updated.profilePicture })
  } catch (error) {
    console.error('Teacher profile picture upload error:', error)
    return NextResponse.json({ error: 'Failed to upload' }, { status: 500 })
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
    })
    if (!teacher) return NextResponse.json({ error: 'Teacher record not found' }, { status: 404 })

    if (teacher.profilePicture && isCloudinaryConfigured()) {
      await deleteFromCloudinary(teacher.profilePicture)
    }

    await prisma.teacher.update({
      where: { email: session.user.email }, data: { profilePicture: null },
    })

    return NextResponse.json({ success: true, profilePicture: null })
  } catch (error) {
    console.error('Teacher profile picture delete error:', error)
    return NextResponse.json({ error: 'Failed to remove' }, { status: 500 })
  }
}
