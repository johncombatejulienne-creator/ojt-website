import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
        },
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email:    { label: "Email",    type: "email" },
        password: { label: "Password", type: "password" },
        role:     { label: "Role",     type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required")
        }
        const teacher = await prisma.teacher.findUnique({
          where: { email: credentials.email },
        })
        if (!teacher)          throw new Error("No teacher account found with this email")
        if (!teacher.password) throw new Error("This account requires Google Sign-In")
        const valid = await bcrypt.compare(credentials.password, teacher.password)
        if (!valid)            throw new Error("Incorrect password")
        return {
          id: teacher.id, email: teacher.email, name: teacher.name,
          image: teacher.profilePicture ?? null,
          role: "teacher", profilePicture: teacher.profilePicture ?? null,
          dbId: teacher.id, teacherId: teacher.teacherId,
        }
      },
    }),
  ],

  callbacks: {
    /* ── signIn ─────────────────────────────────────────────────────
       Runs BEFORE jwt on initial Google sign-in.
       Ensures the user exists in the correct table.
    ──────────────────────────────────────────────────────────────── */
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true
      try {
        const email = user.email!

        // Already a teacher?
        const existingTeacher = await prisma.teacher.findUnique({ where: { email } })
        if (existingTeacher) {
          if (!existingTeacher.profilePicture && user.image) {
            await prisma.teacher.update({ where: { id: existingTeacher.id }, data: { profilePicture: user.image } })
          }
          return true
        }

        // Check if this is a teacher sign-in based on state
        const state     = (account.state as string | undefined) ?? ""
        const isTeacher = state.includes("teacher")

        // Already a student?
        const existingStudent = await prisma.student.findUnique({ where: { email } })
        if (existingStudent) {
          if (!existingStudent.profilePicture && user.image) {
            await prisma.student.update({ where: { id: existingStudent.id }, data: { profilePicture: user.image } })
          }

          // If signing in via Teacher tab, ALSO create a Teacher record for this email
          // This promotes the user to teacher without deleting their student account
          if (isTeacher) {
            await prisma.teacher.create({
              data: {
                email,
                name:           existingStudent.name || user.name || email.split("@")[0],
                teacherId:      `TCH-${Date.now()}`,
                role:           "teacher",
                accessLevel:    "teacher",
                profilePicture: existingStudent.profilePicture ?? user.image ?? null,
              },
            })
          }
          return true
        }

        // Brand-new user — create based on intent
        if (isTeacher) {
          await prisma.teacher.create({
            data: {
              email, name: user.name || email.split("@")[0],
              teacherId: `TCH-${Date.now()}`, role: "teacher",
              accessLevel: "teacher", profilePicture: user.image ?? null,
            },
          })
        } else {
          await prisma.student.create({
            data: {
              email, name: user.name || email.split("@")[0],
              studentId: `STU-${Date.now()}`, profilePicture: user.image ?? null,
            },
          })
        }
        return true
      } catch (error) {
        console.error("signIn error:", error)
        return true
      }
    },

    /* ── jwt ────────────────────────────────────────────────────────
       Re-queries the DB on EVERY call so the role is always fresh.
       This fixes the "Student" role showing for teacher accounts
       whose token was minted before they were added to the Teacher table.
    ──────────────────────────────────────────────────────────────── */
    async jwt({ token, user, trigger, session }) {
      // Handle session update (e.g. profile picture change)
      if (trigger === "update" && session) {
        if (session.profilePicture !== undefined) {
          token.profilePicture = session.profilePicture
        }
        return token
      }

      // Always resolve the role from DB using the email in the token
      // This guarantees stale tokens are corrected on next request
      const email = (user?.email ?? token.email) as string | undefined
      if (!email) return token

      try {
        // Teacher takes priority — check first
        const teacher = await prisma.teacher.findUnique({
          where:  { email },
          select: { id: true, teacherId: true, name: true, profilePicture: true },
        })

        if (teacher) {
          token.role           = "teacher"
          token.userId         = teacher.id
          token.teacherId      = teacher.teacherId
          token.studentId      = undefined
          token.profilePicture = teacher.profilePicture ?? (token.picture as string ?? null)
          token.sub            = teacher.id
          token.name           = teacher.name
          return token
        }

        // Then student
        const student = await prisma.student.findUnique({
          where:  { email },
          select: { id: true, studentId: true, name: true, profilePicture: true },
        })

        if (student) {
          token.role           = "student"
          token.userId         = student.id
          token.studentId      = student.studentId
          token.teacherId      = undefined
          token.profilePicture = student.profilePicture ?? (token.picture as string ?? null)
          token.sub            = student.id
          token.name           = student.name
          return token
        }

        // Email not found in either table (should not happen after signIn)
        token.role = "student"
      } catch (err) {
        console.error("jwt DB query error:", err)
      }

      return token
    },

    /* ── session ─────────────────────────────────────────────────── */
    async session({ session, token }) {
      if (session.user) {
        session.user.id             = (token.userId as string) ?? token.sub!
        session.user.role           = (token.role   as string) ?? "student"
        session.user.studentId      = token.studentId  as string | undefined
        session.user.teacherId      = token.teacherId  as string | undefined
        session.user.profilePicture = (token.profilePicture as string | null) ?? null
      }
      return session
    },
  },

  pages:   { signIn: "/login", error: "/login" },
  session: { strategy: "jwt", maxAge: 24 * 60 * 60 }, // 1 day — so role changes apply quickly
  secret:  process.env.NEXTAUTH_SECRET,
}
