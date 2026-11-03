import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

const globalForDb = globalThis as unknown as { websitePool?: Pool }

export const pool = globalForDb.websitePool ?? new Pool({ connectionString: process.env.DATABASE_URL })
if (process.env.NODE_ENV !== 'production') globalForDb.websitePool = pool

export const db = drizzle(pool)
