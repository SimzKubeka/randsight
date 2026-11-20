// Adds the 50,000-transaction load-test customer. Not part of the normal seed.
import { databasePath, getDb } from '../lib/db.ts'
import { seedLarge } from '../lib/seed.ts'

const started = performance.now()
seedLarge(getDb())
console.log(`Load-test customer ready in ${databasePath} (${Math.round(performance.now() - started)} ms)`)
