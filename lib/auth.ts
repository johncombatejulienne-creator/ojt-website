import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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
          throw new Error("Invalid credentials")
        }

        // Teacher login
        const teacher = await prisma.teacher.findUnique({
          where: { email: credentials.email },
        })

        if (!teacher || !teacher.password) {
          throw new Error("Invalid credentials")
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          teacher.password
        )

        if (!isPasswordValid) {
          throw new Error("Invalid credentials")
        }

        return {
          id: teacher.id,
          email: teacher.email,
          name: teacher.name,
          role: "teacher",
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        // Check if user is a student or teacher
        const student = await prisma.student.findUnique({
          where: { email: user.email! },
        })

        const teacher = await prisma.teacher.findUnique({
          where: { email: user.email! },
        })

        // For students, they need to be registered first
        // For teachers, allow if they're in the database
        return !!(student || teacher)
      }
      return true
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.studentId = token.studentId as string
        session.user.teacherId = token.teacherId as string
      }
      return session
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        
        // Check if user is a student
        const student = await prisma.student.findUnique({
          where: { email: user.email! },
        })

        if (student) {
          token.role = "student"
          token.studentId = student.studentId
          token.id = student.id
        } else {
          // Check if user is a teacher
          const teacher = await prisma.teacher.findUnique({
            where: { email: user.email! },
          })

          if (teacher) {
            token.role = "teacher"
            token.teacherId = teacher.teacherId
            token.id = teacher.id
          }
        }
      }
      return token
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
}
