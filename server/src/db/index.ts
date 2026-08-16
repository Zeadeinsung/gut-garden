import path from 'node:path'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { PGlite } from '@electric-sql/pglite'
import { Pool } from 'pg'
import { drizzle as pgDrizzle } from 'drizzle-orm/node-postgres'
import { drizzle as pgliteDrizzle } from 'drizzle-orm/pglite'
import type { PgliteDatabase } from 'drizzle-orm/pglite'
import * as schema from './schema/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.resolve(__dirname, '../../.data/pglite')

export const isPglite = !process.env.DATABASE_URL

export let pglite: PGlite | null = null
export let pool: Pool | null = null

let instance: PGlite | Pool
if (isPglite) {
  mkdirSync(path.dirname(DATA_DIR), { recursive: true })
  pglite = new PGlite(DATA_DIR)
  instance = pglite
} else {
  pool = new Pool({ connectionString: process.env.DATABASE_URL })
  instance = pool
}

export const db = (
  isPglite
    ? pgliteDrizzle(instance as PGlite, { schema })
    : pgDrizzle(instance as Pool, { schema })
) as PgliteDatabase<typeof schema>

export async function closeDb(): Promise<void> {
  if (isPglite && pglite) await pglite.close()
  else if (pool) await pool.end()
}

export { schema }
