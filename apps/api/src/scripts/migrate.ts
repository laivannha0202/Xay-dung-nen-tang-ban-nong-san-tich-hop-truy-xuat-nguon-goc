import { readdir, readFile } from 'node:fs/promises'
import { pool } from '../db.js'

const DIR = 'migrations'

export async function migrate() {
  await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz DEFAULT now())`)
  const done = new Set((await pool.query(`SELECT name FROM schema_migrations`)).rows.map((r) => r.name as string))
  const files = (await readdir(DIR)).filter((f) => f.endsWith('.sql')).sort()
  for (const f of files) {
    if (done.has(f)) continue
    const sql = await readFile(`${DIR}/${f}`, 'utf8')
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query(sql)
      await client.query(`INSERT INTO schema_migrations (name) VALUES ($1)`, [f])
      await client.query('COMMIT')
      console.log(`applied ${f}`)
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  }
}

if (process.argv[1]?.endsWith('migrate.ts')) {
  await migrate()
  await pool.end()
}
