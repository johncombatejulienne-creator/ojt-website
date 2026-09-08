import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let prisma: PrismaClient // reassigned below based on globalThis cache

// Always use adapter in Prisma 7, even for build time
const connectionString = process.env.DATABASE_URL || 'postgresql://dummy:dummy@localhost:5432/dummy'
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

prisma = globalForPrisma.prisma ?? new PrismaClient({  // eslint-disable-line prefer-const
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query'] : []
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export { prisma }
