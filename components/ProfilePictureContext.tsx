'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface ProfilePictureContextType {
  picture: string | null
  setPicture: (url: string | null) => void
}

const ProfilePictureContext = createContext<ProfilePictureContextType>({
  picture: null,
  setPicture: () => {},
})

export function ProfilePictureProvider({ children, initial }: {
  children: ReactNode
  initial?: string | null
}) {
  const [picture, setPictureState] = useState<string | null>(initial ?? null)

  const setPicture = useCallback((url: string | null) => {
    setPictureState(url)
    // Also persist in sessionStorage so it survives navigation
    try {
      if (url) sessionStorage.setItem('profilePicture', url)
      else sessionStorage.removeItem('profilePicture')
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
