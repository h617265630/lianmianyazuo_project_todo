import 'dotenv/config'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

const connectionString =
  process.env.DATABASE_URL ?? 'postgres://localhost:5432/lianmian_dev'

const pool = new Pool({
  connectionString,
  application_name: 'lianmian-yazuo',
  connectionTimeoutMillis: 5000,
  // Supabase 的远程连接需要 TLS；本地 PostgreSQL 继续使用普通连接。
  ssl: process.env.DATABASE_SSL === 'true'
    ? { rejectUnauthorized: false }
    : undefined,
})

export const db = drizzle(pool, { schema })
export { schema }
