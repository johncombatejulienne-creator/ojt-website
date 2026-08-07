import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let prisma: PrismaClient

if (process.env.DATABASE_URL) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter, log: ['query'] })
} else {
  // Fallback for build time
  prisma = globalForPrisma.prisma ?? new PrismaClient({ log: ['query'] })
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export { prisma }
