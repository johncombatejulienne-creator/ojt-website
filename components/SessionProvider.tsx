'use client'

import { SessionProvider as NextAuthSessionProvider, useSession } from 'next-auth/react'
import { ProfilePictureProvider, useProfilePicture } from './ProfilePictureContext'
import { useEffect } from 'react'

/** Syncs session.user.profilePicture → context on login, scoped by email */
function ProfilePictureSync() {
  const { data: session } = useSession()
  const { picture, setPicture } = useProfilePicture()
  const email = session?.user?.email

  useEffect(() => {
    if (!email) return
    const sessionPic = session?.user?.profilePicture
    if (sessionPic && sessionPic !== picture) {
      setPicture(sessionPic, email)
    }
  }, [session?.user?.profilePicture, email]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

function InnerProvider({ children }: { children: React.ReactNode }) {
  // On mount, read picture from sessionStorage — but only after we know the email
  // We start with null; ProfilePictureSync will fill it from session
  return (
    <ProfilePictureProvider initial={null}>
      <ProfilePictureSync />
      {children}
    </ProfilePictureProvider>
  )
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider>
      <InnerProvider>
        {children}
      </InnerProvider>
    </NextAuthSessionProvider>
  )
}
