import { randomBytes, scrypt, scryptSync, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(scrypt) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>

/** Sync because only the seed hashes passwords; stored as scrypt$<salt>$<hash>. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16)
  return `scrypt$${salt.toString('hex')}$${scryptSync(password, salt, 64).toString('hex')}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, salt, hash] = stored.split('$')
  if (scheme !== 'scrypt' || !salt || !hash || !/^[0-9a-f]+$/.test(salt + hash)) return false
  const expected = Buffer.from(hash, 'hex')
  return timingSafeEqual(await scryptAsync(password, Buffer.from(salt, 'hex'), expected.length), expected)
}
