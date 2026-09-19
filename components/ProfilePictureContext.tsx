'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface ProfilePictureContextType {
  picture: string | null
  setPicture: (url: string | null, email?: string) => void
}

const ProfilePictureContext = createContext<ProfilePictureContextType>({
  picture: null,
  setPicture: () => {},
})

export function ProfilePictureProvider({ children, initial, email }: {
  children: ReactNode
  initial?: string | null
  email?: string | null
}) {
  const [picture, setPictureState] = useState<string | null>(initial ?? null)

  const setPicture = useCallback((url: string | null, accountEmail?: string) => {
    setPictureState(url)
    // Scope storage key by email to prevent cross-account bleed
    const key = accountEmail ? `profilePicture_${accountEmail}` : 'profilePicture'
    try {
      if (url) sessionStorage.setItem(key, url)
      else {
        sessionStorage.removeItem(key)
        // Also clear unscoped key (legacy cleanup)
        sessionStorage.removeItem('profilePicture')
      }
    } catch { /* private browsing */ }
  }, [])

  return (
    <ProfilePictureContext.Provider value={{ picture, setPicture }}>
      {children}
    </ProfilePictureContext.Provider>
  )
}

export function useProfilePicture() {
  return useContext(ProfilePictureContext)
}
