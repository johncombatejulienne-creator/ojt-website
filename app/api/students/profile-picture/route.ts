import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE_BYTES = 2 * 1024 * 1024

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
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'File too large. Max 2 MB.' }, { status: 400 })
    }

    const buffer  = Buffer.from(await file.arrayBuffer())
    const base64  = buffer.toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

    // Always look up by email — never trust JWT role (can be stale)
    const teacher = await prisma.teacher.findUnique({
      where: { email: session.user.email }, select: { id: true },
    }).catch(() => null)

    let profilePicture: string

    if (teacher) {
      const updated = await prisma.teacher.update({
        where: { email: session.user.email },
        data:  { profilePicture: dataUrl },
        select: { profilePicture: true },
      })
      profilePicture = updated.profilePicture!
    } else {
      // Ensure student record exists
      const student = await prisma.student.findUnique({
        where: { email: session.user.email },
      }).catch(() => null)

      if (!student) {
        // Auto-create if missing
        await prisma.student.create({
          data: {
            email:     session.user.email,
            name:      session.user.name ?? session.user.email.split('@')[0],
            studentId: `STU-${Date.now()}`,
            profilePicture: dataUrl,
          },
        }).catch(() => {})
        return NextResponse.json({ success: true, profilePicture: dataUrl })
      }

      const updated = await prisma.student.update({
        where: { email: session.user.email },
        data:  { profilePicture: dataUrl },
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
      where: { email: session.user.email }, select: { id: true },
    }).catch(() => null)

    if (teacher) {
      await prisma.teacher.update({
        where: { email: session.user.email },
        data:  { profilePicture: null },
      })
    } else {
      await prisma.student.update({
        where: { email: session.user.email },
        data:  { profilePicture: null },
      }).catch(() => {})
    }

    return NextResponse.json({ success: true, profilePicture: null })
  } catch (error) {
    console.error('Profile picture delete error:', error)
    return NextResponse.json({ error: 'Failed to remove profile picture' }, { status: 500 })
  }
}
