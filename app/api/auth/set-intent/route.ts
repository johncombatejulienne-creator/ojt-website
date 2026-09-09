import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/auth/set-intent
 * Sets a cookie to indicate whether the user intends to sign in as teacher or student.
 * Called from the login page BEFORE redirecting to Google OAuth.
 */
export async function POST(request: NextRequest) {
  const { intent } = await request.json()
  const validIntent = intent === 'teacher' ? 'teacher' : 'student'

  const response = NextResponse.json({ ok: true })
  response.cookies.set('signin_intent', validIntent, {
    httpOnly: false,  // needs to be readable server-side in signIn callback
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   300,    // 5 minutes — only needed during OAuth flow
    path:     '/',
  })

  return response
}
