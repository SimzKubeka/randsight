'use server'

import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { checkThrottle, clearFailures, createSession, recordFailure, safeNext, SESSION_COOKIE } from '@/lib/auth.ts'
import { getDb } from '@/lib/db.ts'
import { hashPassword, verifyPassword } from '@/lib/password.ts'

export type SignInState = {
  email?: string
  errors?: { email?: string; password?: string }
  formError?: string
}

// Unknown emails still pay for one scrypt check, so timing doesn't reveal which accounts exist.
let dummyHash: string | undefined

export async function signIn(_: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get('email') ?? '').trim().slice(0, 254)
  const password = String(formData.get('password') ?? '').slice(0, 200)
  const next = safeNext(formData.get('next'))

  const errors: SignInState['errors'] = {}
  if (!email) errors.email = 'Enter your email address'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter an email address like name@example.com'
  if (!password) errors.password = 'Enter your password'
  if (errors.email || errors.password) return { email, errors }

  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'direct'
  const key = `${email.toLowerCase()}|${ip}`
  if (!checkThrottle(key)) return { email, formError: 'Too many attempts. Wait 15 minutes, then try again.' }

  const db = getDb()
  const customer = db.prepare('SELECT id, password_hash FROM customers WHERE email = ?').get(email) as
    | { id: number; password_hash: string }
    | undefined
  const valid = await verifyPassword(password, customer?.password_hash ?? (dummyHash ??= hashPassword('unused')))
  if (!customer || !valid) {
    recordFailure(key)
    return { email, formError: 'Email or password is incorrect.' }
  }

  clearFailures(key)
  const { token, expiresAt } = createSession(db, customer.id)
  ;(await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.SITE_URL?.startsWith('https://') ?? false,
    path: '/',
    expires: expiresAt,
  })
  redirect(next)
}
