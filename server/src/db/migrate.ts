import path from 'node:path'
import { readFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import 'dotenv/config'
import { db, pglite, pool, closeDb, isPglite } from './index.js'
import { badgeDefs } from './schema/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SQL_PATH = path.resolve(__dirname, '../../db/schema.sql')

export async function migrate(): Promise<void> {
  const sql = readFileSync(SQL_PATH, 'utf8')
  if (isPglite) {
    if (!pglite) throw new Error('pglite not initialized')
    await pglite.exec(sql)
  } else {
    if (!pool) throw new Error('pg pool not initialized')
    await pool.query(sql)
  }
  const defs = await db.select().from(badgeDefs)
  console.log(`[db] migrate done — badge_defs: ${defs.length} rows`)
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) {
  migrate()
    .then(() => closeDb())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[db] migrate failed:', err)
      process.exit(1)
    })
}
