import { requireSession } from '@/lib/auth.ts'
import { getCustomerName } from '@/lib/data.ts'
import { getDb } from '@/lib/db.ts'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function DashboardPage({ searchParams }: Props) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(await searchParams)) if (typeof value === 'string') params.set(key, value)
  const query = params.toString()
  const { customerId } = await requireSession(`/dashboard${query ? `?${query}` : ''}`)

  return (
    <main className="container">
      <h1>Hello, {getCustomerName(getDb(), customerId)}</h1>
      <p>Your spending insights arrive in the next build step.</p>
    </main>
  )
}
