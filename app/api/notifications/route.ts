import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ notifications: [] })

    const student = await prisma.student.findUnique({
      where: { email: session.user.email }, select: { id: true },
    }).catch(() => null)

    if (!student) return NextResponse.json({ notifications: [] })

    // Guard against missing columns — return empty if table not migrated yet
    const notifications = await prisma.notification.findMany({
      where: { userId: student.id, userType: 'student' },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }).catch(() => [])

    return NextResponse.json({ notifications })
  } catch {
    // Never crash — just return empty
    return NextResponse.json({ notifications: [] })
  }
}

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
    }).catch(() => {})

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false })
  }
}
