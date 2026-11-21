'use server'

import { revalidatePath } from 'next/cache'
import { requireSession } from '@/lib/auth.ts'
import { applySamplePayment, resetSimulation } from '@/lib/data.ts'
import { getDb } from '@/lib/db.ts'

const PATH = '/dashboard/live-track'

// Both act on the caller's own session only; the session id never comes from the form.

export async function applySample() {
  const { sessionId } = await requireSession(PATH)
  applySamplePayment(getDb(), sessionId)
  revalidatePath(PATH)
}

export async function resetSample() {
  const { sessionId } = await requireSession(PATH)
  resetSimulation(getDb(), sessionId)
  revalidatePath(PATH)
}
