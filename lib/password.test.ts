import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from './password.ts'

describe('password hashing', () => {
  const stored = hashPassword('hindsight-demo')

  it('stores a salted scrypt hash, never the password', () => {
    expect(stored).toMatch(/^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/)
    expect(stored).not.toContain('hindsight-demo')
    expect(hashPassword('hindsight-demo')).not.toBe(stored)
  })

  it('verifies the right password only', async () => {
    expect(await verifyPassword('hindsight-demo', stored)).toBe(true)
    expect(await verifyPassword('hindsight-dem0', stored)).toBe(false)
  })

  it('rejects a malformed stored value', async () => {
    expect(await verifyPassword('x', 'plain-text')).toBe(false)
    expect(await verifyPassword('x', 'scrypt$zz$zz')).toBe(false)
  })
})
