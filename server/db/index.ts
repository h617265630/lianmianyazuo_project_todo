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
})

export const db = drizzle(pool, { schema })
export { schema }
