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
        // Check if user exists as student or teacher
        const student = await prisma.student.findUnique({
          where: { email: user.email! },
        })

        const teacher = await prisma.teacher.findUnique({
          where: { email: user.email! },
        })

        // If not found, automatically create a new student account
        if (!student && !teacher) {
          await prisma.student.create({
            data: {
              email: user.email!,
              name: user.name || user.email!.split('@')[0],
              studentId: `STU-${Date.now()}`, // Temporary ID, will be replaced on profile completion
            },
          })
        }

        // Allow sign-in for everyone
        return true
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
