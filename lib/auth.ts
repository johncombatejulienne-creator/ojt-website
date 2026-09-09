import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
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
      if (account?.provider !== "google") return true

      try {
        const email = user.email!

        // Read the intent cookie set by the login page before Google redirect
        const cookieStore = await cookies()
        const intent = cookieStore.get("signin_intent")?.value ?? "student"
        const isTeacher = intent === "teacher"

        // Check existing records
        const existingTeacher = await prisma.teacher.findUnique({ where: { email } })
        const existingStudent = await prisma.student.findUnique({ where: { email } })

        if (isTeacher) {
          // TEACHER TAB: ensure Teacher record exists
          if (!existingTeacher) {
            await prisma.teacher.create({
              data: {
                email,
                name:           existingStudent?.name ?? user.name ?? email.split("@")[0],
                teacherId:      `TCH-${Date.now()}`,
                role:           "teacher",
                accessLevel:    "teacher",
                profilePicture: existingStudent?.profilePicture ?? user.image ?? null,
              },
            })
          } else if (!existingTeacher.profilePicture && user.image) {
            await prisma.teacher.update({
              where: { id: existingTeacher.id },
              data:  { profilePicture: user.image },
            })
          }
        } else {
          // STUDENT TAB: ensure Student record exists (only if not already a teacher)
          if (!existingTeacher && !existingStudent) {
            await prisma.student.create({
              data: {
                email,
                name:           user.name ?? email.split("@")[0],
                studentId:      `STU-${Date.now()}`,
                profilePicture: user.image ?? null,
              },
            })
          } else if (existingStudent && !existingStudent.profilePicture && user.image) {
            await prisma.student.update({
              where: { id: existingStudent.id },
              data:  { profilePicture: user.image },
            })
          } else if (existingTeacher && !existingTeacher.profilePicture && user.image) {
            await prisma.teacher.update({
              where: { id: existingTeacher.id },
              data:  { profilePicture: user.image },
            })
          }
        }

        return true
      } catch (e) {
        console.error("signIn error:", e)
        return true
      }
    },

    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session) {
        if (session.profilePicture !== undefined) token.profilePicture = session.profilePicture
        return token
      }

      const email = (user?.email ?? token.email) as string | undefined
      if (!email) return token

      try {
        // Teacher always takes priority
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
