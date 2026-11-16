import { scrypt as _scrypt, randomBytes, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(_scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>
const KEYLEN = 64
const N = 16384

/** scrypt hash, self-describing: scrypt$N$salt$hash */
export async function hashPassword(pw: string): Promise<string> {
  const salt = randomBytes(16)
  const hash = await scrypt(pw.normalize('NFKC'), salt, KEYLEN)
  return `scrypt$${N}$${salt.toString('base64')}$${hash.toString('base64')}`
}

export async function verifyPassword(pw: string, stored: string): Promise<boolean> {
  const parts = stored.split('$')
  if (parts.length !== 4 || parts[0] !== 'scrypt') return false
  const salt = Buffer.from(parts[2], 'base64')
  const expected = Buffer.from(parts[3], 'base64')
  const actual = await scrypt(pw.normalize('NFKC'), salt, expected.length)
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
