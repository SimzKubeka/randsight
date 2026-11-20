// Recreates the database from scratch with the demo fixture.
import { rmSync } from 'node:fs'
import { databasePath, getDb } from '../lib/db.ts'

for (const suffix of ['', '-wal', '-shm']) rmSync(databasePath + suffix, { force: true })
const counts = getDb()
  .prepare('SELECT (SELECT count(*) FROM customers) AS customers, (SELECT count(*) FROM transactions) AS transactions')
  .get()
console.log(`Seeded ${databasePath}:`, { ...counts })
