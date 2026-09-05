import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

/** 用 Node 内置 scrypt 做密码哈希，存成 `salt:hash`（十六进制）。 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const test = scryptSync(password, salt, 64)
  const ref = Buffer.from(hash, 'hex')
  return test.length === ref.length && timingSafeEqual(test, ref)
}
