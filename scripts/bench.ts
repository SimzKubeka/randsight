// Scale benchmark for the 50,000-payment customer: query timings in-process, then concurrent HTTP reads
// through the production server, one session per connection.
// Usage: npm run build && npm run bench   (results in bench/out/results.json)
import autocannon from 'autocannon'
import { spawn } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import { resolve } from 'node:path'
import { getTotals, getTransactions, PAGE_SIZE } from '../lib/data.ts'
import { openDb } from '../lib/db.ts'
import { seed, seedLarge } from '../lib/seed.ts'
import { createSession } from '../lib/sessions.ts'

const ITERATIONS = 500
const CONNECTIONS = 20
const DURATION_S = 20
const PORT = 3300
const out = resolve('bench/out')
const dbPath = resolve(out, 'bench.db')

const percentile = (values: number[], p: number) => {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)]!
}
const round = (ms: number) => Math.round(ms * 100) / 100

// ---------- dataset ----------
mkdirSync(out, { recursive: true })
for (const suffix of ['', '-wal', '-shm']) rmSync(dbPath + suffix, { force: true })
const db = openDb(dbPath)
seed(db)
seedLarge(db)
const { id: customerId } = db.prepare("SELECT id FROM customers WHERE email = 'load@randsight.example'").get() as { id: number }
const { total } = db.prepare('SELECT count(*) AS total FROM transactions WHERE customer_id = ?').get(customerId) as { total: number }
const month = '2026-10'
const category = 'groceries'
const { count } = getTransactions(db, customerId, month, category, 1)
const lastPage = Math.ceil(count / PAGE_SIZE)

// ---------- queries, as the dashboard runs them ----------
function time(run: () => unknown) {
  const samples: number[] = []
  for (let i = 0; i < ITERATIONS; i++) {
    const started = performance.now()
    run()
    samples.push(performance.now() - started)
  }
  return { medianMs: round(percentile(samples, 50)), p95Ms: round(percentile(samples, 95)) }
}

const queries = {
  'Six-month summary (review page)': time(() => getTotals(db, customerId, '2026-05', month)),
  [`${category} filter, page 1`]: time(() => getTransactions(db, customerId, month, category, 1)),
  [`${category} filter, last page (${lastPage})`]: time(() => getTransactions(db, customerId, month, category, lastPage)),
}

// ---------- concurrent reads over HTTP ----------
const tokens = Array.from({ length: CONNECTIONS }, () => createSession(db, customerId).token)
db.close()

const server = spawn(process.execPath, ['.next/standalone/server.js'], {
  env: { ...process.env, PORT: String(PORT), DATABASE_PATH: dbPath, NODE_ENV: 'production' },
  stdio: 'ignore',
})
const base = `http://localhost:${PORT}`
const paths = [`/dashboard?month=${month}`, `/dashboard?month=${month}&category=${category}&page=${lastPage}`]

async function load(duration: number) {
  let next = 0
  const latencies: number[] = []
  const result = await new Promise<autocannon.Result>((done, fail) => {
    const instance = autocannon(
      {
        url: base,
        connections: CONNECTIONS,
        duration,
        // Each connection is a different signed-in session, alternating the review and a deep category page.
        // The cookie goes on every request: setHeaders() would only reach the first one in the list.
        setupClient: (client) => {
          const headers = { cookie: `rs_session=${tokens[next++ % tokens.length]}` }
          client.setRequests(paths.map((path) => ({ path, headers })))
        },
      },
      (error, res) => (error ? fail(error) : done(res)),
    )
    instance.on('response', (_client, _status, _bytes, ms) => latencies.push(ms))
  })
  return { result, latencies }
}

try {
  for (let i = 0; ; i++) {
    if (i === 100) throw new Error('Server did not start; run npm run build first')
    if (await fetch(`${base}/sign-in`).then((r) => r.ok, () => false)) break
    await new Promise((r) => setTimeout(r, 200))
  }
  await load(3) // warm-up: JIT and first renders
  const { result, latencies } = await load(DURATION_S)
  const results = {
    date: new Date().toISOString(),
    machine: {
      cpu: os.cpus()[0]?.model.trim(),
      cores: os.cpus().length,
      ramGb: Math.round(os.totalmem() / 2 ** 30),
      os: `${os.type()} ${os.release()}`,
      node: process.version,
    },
    dataset: { customerPayments: total, month, category, rowsInCategory: count, pages: lastPage },
    queries: { iterations: ITERATIONS, ...queries },
    http: {
      connections: CONNECTIONS,
      distinctSessions: tokens.length,
      durationS: DURATION_S,
      requests: result.requests.total,
      requestsPerSecond: Math.round(result.requests.average),
      latencyMs: { median: percentile(latencies, 50), p95: percentile(latencies, 95), max: Math.max(...latencies) },
      non2xx: result.non2xx,
      errors: result.errors,
      timeouts: result.timeouts,
    },
  }
  writeFileSync(resolve(out, 'results.json'), JSON.stringify(results, null, 2) + '\n')
  console.log(JSON.stringify(results, null, 2))
  if (result.non2xx || result.errors || result.timeouts) {
    console.error('Some requests failed: the throughput above is not valid.')
    process.exitCode = 1
  }
} finally {
  server.kill()
}
