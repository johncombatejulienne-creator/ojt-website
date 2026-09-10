import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/auth/finalize?intent=teacher|student&next=/teacher/dashboard
 *
 * Called after OAuth completes (via callbackUrl).
 * Creates the Teacher or Student DB record for the signed-in user,
 * then redirects to the intended destination.
 *
 * This avoids all cookie-timing issues — the intent is in the URL,
 * not a cookie that may or may not be readable during the signIn callback.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const intent = searchParams.get('intent') ?? 'student'   // 'teacher' | 'student'
  const next   = searchParams.get('next')   ?? (intent === 'teacher' ? '/teacher/dashboard' : '/dashboard')

  const baseUrl = request.nextUrl.origin
  const redirectTo = (path: string) => NextResponse.redirect(new URL(path, baseUrl))

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return redirectTo('/login')
    }

    const email  = session.user.email
    const name   = session.user.name ?? email.split('@')[0]
    const image  = session.user.image ?? null

    if (intent === 'teacher') {
      // ── Ensure Teacher record exists ──────────────────────
      const existing = await prisma.teacher.findUnique({ where: { email } })
      if (!existing) {
        await prisma.teacher.create({
          data: {
            email,
            name,
            teacherId:      `TCH-${Date.now()}`,
            role:           'teacher',
            accessLevel:    'teacher',
            profilePicture: image,
          },
        })
      } else if (!existing.profilePicture && image) {
        await prisma.teacher.update({
          where: { id: existing.id },
          data:  { profilePicture: image },
        })
      }
    } else {
      // ── Ensure Student record exists ──────────────────────
      const existing = await prisma.student.findUnique({ where: { email } })
      if (!existing) {
        await prisma.student.create({
          data: {
            email,
            name,
            studentId:      `STU-${Date.now()}`,
            profilePicture: image,
          },
        })
      } else if (!existing.profilePicture && image) {
        await prisma.student.update({
          where: { id: existing.id },
          data:  { profilePicture: image },
        })
      }
    }

    return redirectTo(next)
  } catch (error) {
    console.error('finalize error:', error)
    // Even on error, redirect — don't leave user stranded
    return redirectTo(next)
  }
}
