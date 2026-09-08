import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    // Provider for STUDENT Google sign-in
    GoogleProvider({
      id:           "google",
      name:         "Google",
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: { params: { prompt: "select_account" } },
    }),

    // Provider for TEACHER Google sign-in — same credentials, different id
    GoogleProvider({
      id:           "google-teacher",
      name:         "Google Teacher",
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: { params: { prompt: "select_account" } },
    }),

    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email:    { label: "Email",    type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required")
        }
        const teacher = await prisma.teacher.findUnique({ where: { email: credentials.email } })
        if (!teacher)          throw new Error("No teacher account found with this email")
        if (!teacher.password) throw new Error("This account requires Google Sign-In")
        const valid = await bcrypt.compare(credentials.password, teacher.password)
        if (!valid) throw new Error("Incorrect password")
        return {
          id: teacher.id, email: teacher.email, name: teacher.name,
          image: teacher.profilePicture ?? null,
        }
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (!account) return true
      const email = user.email!

      // ── Teacher providers (google-teacher or credentials) ───────
      if (account.provider === "google-teacher" || account.provider === "credentials") {
        try {
          // Check if Teacher record exists
          let teacher = await prisma.teacher.findUnique({ where: { email } })

          if (!teacher) {
            // Look up name from student record if it exists
            const student = await prisma.student.findUnique({ where: { email } })
            teacher = await prisma.teacher.create({
              data: {
                email,
                name:           student?.name || user.name || email.split("@")[0],
                teacherId:      `TCH-${Date.now()}`,
                role:           "teacher",
                accessLevel:    "teacher",
                profilePicture: student?.profilePicture ?? user.image ?? null,
              },
            })
          } else if (!teacher.profilePicture && user.image) {
            await prisma.teacher.update({
              where: { id: teacher.id },
              data:  { profilePicture: user.image },
            })
          }
        } catch (e) {
          console.error("Teacher signIn error:", e)
        }
        return true
      }

      // ── Student provider (google) ───────────────────────────────
      if (account.provider === "google") {
        try {
          // If they're already a teacher, allow but they'll get teacher role
          const teacher = await prisma.teacher.findUnique({ where: { email } })
          if (teacher) {
            if (!teacher.profilePicture && user.image) {
              await prisma.teacher.update({ where: { id: teacher.id }, data: { profilePicture: user.image } })
            }
            return true
          }

          // Existing student
          const student = await prisma.student.findUnique({ where: { email } })
          if (student) {
            if (!student.profilePicture && user.image) {
              await prisma.student.update({ where: { id: student.id }, data: { profilePicture: user.image } })
            }
            return true
          }

          // New user — create student
          await prisma.student.create({
            data: {
              email,
              name:           user.name || email.split("@")[0],
              studentId:      `STU-${Date.now()}`,
              profilePicture: user.image ?? null,
            },
          })
        } catch (e) {
          console.error("Student signIn error:", e)
        }
        return true
      }

      return true
    },

    async jwt({ token, user, account, trigger, session }) {
      // Handle session update (profile picture etc.)
      if (trigger === "update" && session) {
        if (session.profilePicture !== undefined) token.profilePicture = session.profilePicture
        return token
      }

      // Re-query DB on every call — guarantees role is always current
      const email = (user?.email ?? token.email) as string | undefined
      if (!email) return token

      try {
        // Teacher takes priority
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

        token.role = "student"
      } catch (err) {
        console.error("jwt error:", err)
      }

      return token
    },

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
  session: { strategy: "jwt", maxAge: 24 * 60 * 60 },
  secret:  process.env.NEXTAUTH_SECRET,
}
