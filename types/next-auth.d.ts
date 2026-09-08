import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      studentId?: string
      teacherId?: string
      profilePicture?: string | null
    } & DefaultSession["user"]
  }

  interface User {
    role?: string
    studentId?: string
    teacherId?: string
    profilePicture?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string
    studentId?: string
    teacherId?: string
    profilePicture?: string | null
    userId?: string
  }
}
