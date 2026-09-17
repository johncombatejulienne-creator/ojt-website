'use client'

import { SessionProvider as NextAuthSessionProvider, useSession } from 'next-auth/react'
import { ProfilePictureProvider, useProfilePicture } from './ProfilePictureContext'
import { useEffect } from 'react'

/** Syncs session.user.profilePicture → context on login */
function ProfilePictureSync() {
  const { data: session } = useSession()
  const { picture, setPicture } = useProfilePicture()

  useEffect(() => {
    const sessionPic = session?.user?.profilePicture
    if (sessionPic && sessionPic !== picture) {
      setPicture(sessionPic)
    }
  }, [session?.user?.profilePicture]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

function InnerProvider({ children }: { children: React.ReactNode }) {
  // Restore from sessionStorage on mount
  const storedPic = typeof window !== 'undefined'
    ? (() => { try { return sessionStorage.getItem('profilePicture') } catch { return null } })()
    : null

  return (
    <ProfilePictureProvider initial={storedPic}>
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
