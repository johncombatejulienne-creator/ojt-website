import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/** GET /api/notifications — returns unread notifications for the current student */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ notifications: [] })

    const student = await prisma.student.findUnique({
      where: { email: session.user.email }, select: { id: true },
    }).catch(() => null)

    if (!student) return NextResponse.json({ notifications: [] })

    const notifications = await prisma.notification.findMany({
      where: { userId: student.id, userType: 'student' },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error('GET notifications error:', error)
    return NextResponse.json({ notifications: [] })
  }
}

/** PATCH /api/notifications — mark all as read */
export async function PATCH() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ success: false })

    const student = await prisma.student.findUnique({
      where: { email: session.user.email }, select: { id: true },
    }).catch(() => null)
    if (!student) return NextResponse.json({ success: false })

    await prisma.notification.updateMany({
      where: { userId: student.id, userType: 'student', isRead: false },
      data:  { isRead: true },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false })
  }
}
