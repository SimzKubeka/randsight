'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { deleteSession, SESSION_COOKIE } from '@/lib/auth.ts'
import { getDb } from '@/lib/db.ts'

export async function signOut() {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  if (token) deleteSession(getDb(), token)
  jar.delete(SESSION_COOKIE)
  redirect('/sign-in?signed-out=1')
}
