import pg from 'pg'
import { config } from './config.js'

// numeric -> number (quantities are numeric(12,3); safe within double range for our sizes)
pg.types.setTypeParser(1700, (v) => (v === null ? null : Number(v)))
pg.types.setTypeParser(20, (v) => (v === null ? null : Number(v)))

export const pool = new pg.Pool({ connectionString: config.databaseUrl, max: 10 })

export type Tx = pg.PoolClient
type Row = pg.QueryResultRow

export async function q<T extends Row = Row>(sql: string, params: unknown[] = []): Promise<T[]> {
  const r = await pool.query<T>(sql, params)
  return r.rows
}

export async function one<T extends Row = Row>(sql: string, params: unknown[] = []): Promise<T | null> {
  const rows = await q<T>(sql, params)
  return rows[0] ?? null
}

/** Runs fn in a transaction; rolls back on any throw. */
export async function tx<T>(fn: (c: Tx) => Promise<T>): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const out = await fn(client)
    await client.query('COMMIT')
    return out
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {})
    throw e
  } finally {
    client.release()
  }
}

export async function txq<T extends Row = Row>(c: Tx, sql: string, params: unknown[] = []): Promise<T[]> {
  return (await c.query<T>(sql, params)).rows
}
