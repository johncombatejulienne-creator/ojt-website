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

        if (!teacher) throw new Error("No teacher account found with this email")
        if (!teacher.password) throw new Error("This account requires Google Sign-In")

        const valid = await bcrypt.compare(credentials.password, teacher.password)
        if (!valid) throw new Error("Incorrect password")

        return {
          id:             teacher.id,
          email:          teacher.email,
          name:           teacher.name,
          image:          teacher.profilePicture ?? null,
          role:           "teacher",
          profilePicture: teacher.profilePicture ?? null,
          dbId:           teacher.id,
          teacherId:      teacher.teacherId,
        }
      },
    }),
  ],

  callbacks: {
    /**
     * signIn — runs BEFORE jwt.
     * For Google: ensure the user exists in the right table.
     * We also set user.role here so the jwt callback can use it.
     */
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true

      try {
        const email = user.email!

        // 1. Already a teacher?
        const existingTeacher = await prisma.teacher.findUnique({ where: { email } })
        if (existingTeacher) {
          // Sync Google profile picture
          if (!existingTeacher.profilePicture && user.image) {
            await prisma.teacher.update({
              where: { id: existingTeacher.id },
              data: { profilePicture: user.image },
            })
          }
          // Tag the user object so jwt knows the role
          ;(user as unknown as Record<string, unknown>).role           = "teacher"
          ;(user as unknown as Record<string, unknown>).dbId           = existingTeacher.id
          ;(user as unknown as Record<string, unknown>).teacherId      = existingTeacher.teacherId
          ;(user as unknown as Record<string, unknown>).profilePicture = existingTeacher.profilePicture ?? user.image ?? null
          return true
        }

        // 2. Already a student?
        const existingStudent = await prisma.student.findUnique({ where: { email } })
        if (existingStudent) {
          if (!existingStudent.profilePicture && user.image) {
            await prisma.student.update({
              where: { id: existingStudent.id },
              data: { profilePicture: user.image },
            })
          }
          ;(user as unknown as Record<string, unknown>).role           = "student"
          ;(user as unknown as Record<string, unknown>).dbId           = existingStudent.id
          ;(user as unknown as Record<string, unknown>).studentId      = existingStudent.studentId
          ;(user as unknown as Record<string, unknown>).profilePicture = existingStudent.profilePicture ?? user.image ?? null
          return true
        }

        // 3. Brand-new user.
        // Decide role based on the callbackUrl embedded in the OAuth state.
        // When the user clicks "Sign in as Teacher", callbackUrl=/teacher/dashboard.
        const callbackUrl = (account.state as string | undefined) ?? ""
        const isTeacher   = callbackUrl.includes("teacher")

        if (isTeacher) {
          const newTeacher = await prisma.teacher.create({
            data: {
              email,
              name:         user.name || email.split("@")[0],
              teacherId:    `TCH-${Date.now()}`,
              role:         "teacher",
              accessLevel:  "teacher",
              profilePicture: user.image ?? null,
            },
          })
          ;(user as unknown as Record<string, unknown>).role           = "teacher"
          ;(user as unknown as Record<string, unknown>).dbId           = newTeacher.id
          ;(user as unknown as Record<string, unknown>).teacherId      = newTeacher.teacherId
          ;(user as unknown as Record<string, unknown>).profilePicture = user.image ?? null
        } else {
          const newStudent = await prisma.student.create({
            data: {
              email,
              name:         user.name || email.split("@")[0],
              studentId:    `STU-${Date.now()}`,
              profilePicture: user.image ?? null,
            },
          })
          ;(user as unknown as Record<string, unknown>).role           = "student"
          ;(user as unknown as Record<string, unknown>).dbId           = newStudent.id
          ;(user as unknown as Record<string, unknown>).studentId      = newStudent.studentId
          ;(user as unknown as Record<string, unknown>).profilePicture = user.image ?? null
        }

        return true
      } catch (error) {
        console.error("signIn error:", error)
        return true // still allow sign-in even on non-critical errors
      }
    },

    /**
     * jwt — builds the token.
     * On the FIRST call (initial sign-in), user object is present and has
     * the role/dbId/etc we set in signIn above.  Use those directly.
     * On subsequent calls (session refresh), only token is available.
     */
    async jwt({ token, user, account, trigger, session }) {
      // ── First sign-in ───────────────────────────────────────────
      if (user) {
        const u = user as unknown as Record<string, unknown>

        // Role already resolved by signIn callback (or by credentials authorize)
        if (u.role) {
          token.role           = u.role as string
          token.userId         = (u.dbId  ?? u.id) as string
          token.profilePicture = (u.profilePicture ?? null) as string | null
          token.sub            = token.userId

          if (u.role === "teacher") {
            token.teacherId = u.teacherId as string | undefined
          } else {
            token.studentId = u.studentId as string | undefined
          }

          return token
        }

        // Fallback: role wasn't set (shouldn't happen, but safe)
        const email = user.email
        if (email) {
          try {
            const teacher = await prisma.teacher.findUnique({
              where: { email },
              select: { id: true, teacherId: true, profilePicture: true },
            })
            if (teacher) {
              token.role = "teacher"; token.userId = teacher.id
              token.teacherId = teacher.teacherId
              token.profilePicture = teacher.profilePicture ?? null
              token.sub = teacher.id
              return token
            }
            const student = await prisma.student.findUnique({
              where: { email },
              select: { id: true, studentId: true, profilePicture: true },
            })
            if (student) {
              token.role = "student"; token.userId = student.id
              token.studentId = student.studentId
              token.profilePicture = student.profilePicture ?? null
              token.sub = student.id
            }
          } catch (err) {
            console.error("jwt fallback error:", err)
          }
        }

        return token
      }

      // ── Session update (e.g. profile picture changed) ───────────
      if (trigger === "update" && session) {
        if (session.profilePicture !== undefined) token.profilePicture = session.profilePicture
      }

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id             = (token.userId as string) ?? token.sub!
        session.user.role           = (token.role as string) ?? "student"
        session.user.studentId      = token.studentId as string | undefined
        session.user.teacherId      = token.teacherId as string | undefined
        session.user.profilePicture = (token.profilePicture as string | null) ?? null
      }
      return session
    },
  },

  pages:   { signIn: "/login", error: "/login" },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  secret:  process.env.NEXTAUTH_SECRET,
}
