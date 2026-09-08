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
        },
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required")
        }

        // Only teachers can log in with credentials
        // Students must use Google Sign-In
        const teacher = await prisma.teacher.findUnique({
          where: { email: credentials.email },
        })

        if (!teacher) {
          throw new Error("No teacher account found with this email")
        }

        if (!teacher.password) {
          throw new Error("This account requires Google Sign-In")
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          teacher.password
        )

        if (!isPasswordValid) {
          throw new Error("Incorrect password")
        }

        return {
          id: teacher.id,
          email: teacher.email,
          name: teacher.name,
          image: teacher.profilePicture ?? null,
          role: "teacher",
          profilePicture: teacher.profilePicture ?? null,
        }
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          // Check if user exists as teacher first
          const teacher = await prisma.teacher.findUnique({
            where: { email: user.email! },
          })

          if (teacher) {
            // Update teacher profile picture from Google if not set
            if (!teacher.profilePicture && user.image) {
              await prisma.teacher.update({
                where: { id: teacher.id },
                data: { profilePicture: user.image },
              })
            }
            return true
          }

          // Check if student already exists
          const student = await prisma.student.findUnique({
            where: { email: user.email! },
          })

          if (student) {
            // Update student profile picture from Google if not set
            if (!student.profilePicture && user.image) {
              await prisma.student.update({
                where: { id: student.id },
                data: { profilePicture: user.image },
              })
            }
            return true
          }

          // New user — auto-create student account
          await prisma.student.create({
            data: {
              email: user.email!,
              name: user.name || user.email!.split("@")[0],
              studentId: `STU-${Date.now()}`,
              profilePicture: user.image ?? null,
            },
          })

          return true
        } catch (error) {
          console.error("Sign-in error:", error)
          // Allow sign-in even on non-critical errors
          return true
        }
      }

      // Credentials provider — always allowed if authorize() passed
      return true
    },

    async jwt({ token, user, account, trigger, session }) {
      // On initial sign-in, enrich the token with DB data
      if (user || account) {
        try {
          const email = user?.email ?? token.email

          if (!email) return token

          // Check teacher first
          const teacher = await prisma.teacher.findUnique({
            where: { email },
            select: {
              id: true,
              teacherId: true,
              name: true,
              profilePicture: true,
            },
          })

          if (teacher) {
            token.role = "teacher"
            token.userId = teacher.id
            token.teacherId = teacher.teacherId
            token.profilePicture = teacher.profilePicture ?? null
            token.sub = teacher.id
            return token
          }

          // Then check student
          const student = await prisma.student.findUnique({
            where: { email },
            select: {
              id: true,
              studentId: true,
              name: true,
              profilePicture: true,
            },
          })

          if (student) {
            token.role = "student"
            token.userId = student.id
            token.studentId = student.studentId
            token.profilePicture = student.profilePicture ?? null
            token.sub = student.id
            return token
          }

          // Fallback — new unregistered user
          token.role = "student"
        } catch (error) {
          console.error("JWT callback error:", error)
          token.role = "student"
        }
      }

      // Handle session update trigger (e.g. after profile picture change)
      if (trigger === "update" && session?.profilePicture !== undefined) {
        token.profilePicture = session.profilePicture
      }

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.userId as string) ?? token.sub!
        session.user.role = token.role as string
        session.user.studentId = token.studentId as string | undefined
        session.user.teacherId = token.teacherId as string | undefined
        session.user.profilePicture = (token.profilePicture as string | null) ?? null
      }
      return session
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET,
}
