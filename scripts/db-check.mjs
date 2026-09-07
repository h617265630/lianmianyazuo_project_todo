import 'dotenv/config'
import { Client } from 'pg'
const connectionString = process.env.DATABASE_URL ?? 'postgres://localhost:5432/lianmian_dev'
const address = new URL(connectionString)
const client = new Client({ connectionString, connectionTimeoutMillis: 5000 })
try {
  await client.connect()
  const { rows } = await client.query(`SELECT current_database() AS database,
    (SELECT count(*) FROM users) AS users,
    (SELECT count(*) FROM projects) AS projects,
    (SELECT count(*) FROM todos) AS todos,
    (SELECT count(*) FROM resources) AS resources`)
  console.log({ host: address.hostname, port: address.port || '5432', ...rows[0] })
} catch (error) {
  console.error('数据库连接检查失败:', error.code || error.name)
  process.exitCode = 1
} finally {
  await client.end()
}
