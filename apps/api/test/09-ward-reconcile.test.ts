import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import pg from 'pg'
import { config } from '../src/config.js'

/**
 * 005_reconcile_ward_codes.sql must be safe on every database state we shipped:
 * a fresh DB (004 inserts canonical codes), a DB that applied the old 004 (legacy
 * codes in use, addresses repointed), a DB repaired by hand (canonical codes only),
 * and a DB that somehow ended up with both rows.
 * Each case runs in its own scratch database, dropped afterwards.
 */
const MIGRATIONS = 'migrations'
const SQL = readFileSync(`${MIGRATIONS}/005_reconcile_ward_codes.sql`, 'utf8')
const BASE = config.databaseUrl.replace(/\/[^/]*$/, '')
const scratch: string[] = []

function client(url: string) {
  return new pg.Client({ connectionString: url })
}

async function withDb<T>(name: string, fn: (c: pg.Client, url: string) => Promise<T>): Promise<T> {
  const url = `${BASE}/${name}`
  const c = client(url)
  await c.connect()
  try {
    return await fn(c, url)
  } finally {
    await c.end()
  }
}

async function applyBase(c: pg.Client, files: string[]) {
  for (const f of files) await c.query(readFileSync(`${MIGRATIONS}/${f}`, 'utf8'))
}

const PAIRS = [
  ['12004', '11986'],
  ['12073', '12052'],
  ['12223', '12220'],
  ['12583', '12478'],
  ['12916', '12841'],
] as const

async function codes(c: pg.Client, list: string[]) {
  const { rows } = await c.query<{ code: string; in_service_area: boolean }>(
    'SELECT code, in_service_area FROM wards WHERE code = ANY($1) ORDER BY code',
    [list],
  )
  return rows
}

beforeAll(async () => {
  const root = client(`${BASE}/postgres`)
  await root.connect()
  try {
    for (const [i] of ['fresh', 'legacy', 'both'].entries()) {
      const name = `agrimarket_ward_check_${i}`
      scratch.push(name)
      await root.query(`DROP DATABASE IF EXISTS ${name}`)
      await root.query(`CREATE DATABASE ${name}`)
    }
  } finally {
    await root.end()
  }
})

afterAll(async () => {
  const root = client(`${BASE}/postgres`)
  await root.connect()
  try {
    for (const name of scratch) await root.query(`DROP DATABASE IF EXISTS ${name}`)
  } finally {
    await root.end()
  }
})

describe('005_reconcile_ward_codes.sql', () => {
  it('fresh database: 004 + 005 keep 104 canonical codes', async () => {
    await withDb(scratch[0], async (c) => {
      await applyBase(c, ['001_init.sql', '002_code_sequences.sql', '003_session_revocations.sql', '004_service_area.sql'])
      await c.query(SQL)
      const rows = await codes(c, PAIRS.flatMap(([l, n]) => [l, n]))
      expect(rows.map((r) => r.code)).toEqual(PAIRS.map(([, n]) => n).sort())
      expect((await c.query('SELECT COUNT(*)::int AS n FROM wards')).rows[0].n).toBe(104)
    })
  })

  it('old 004 state: legacy code renamed in place, saved address repointed, disabled flag kept', async () => {
    await withDb(scratch[1], async (c) => {
      await applyBase(c, ['001_init.sql', '002_code_sequences.sql', '003_session_revocations.sql', '004_service_area.sql'])
      // Simulate the earlier 004: canonical row back to the legacy code + a saved address on it.
      for (const [legacy, canonical] of PAIRS) {
        await c.query('UPDATE wards SET code = $1 WHERE code = $2', [legacy, canonical])
      }
      await c.query("UPDATE wards SET in_service_area = false, disabled_at = now() WHERE code = '12073'")
      const userId = (await c.query("INSERT INTO users (email, password_hash) VALUES ('k@example.com','x') RETURNING id")).rows[0].id
      await c.query(
        `INSERT INTO addresses (user_id, recipient_name, phone, province, district, ward, street_detail, ward_code, province_code)
         VALUES ($1, 'Khách', '0912345678', 'Hưng Yên', NULL, 'Yên Mỹ', '12 Đường Làng', '12073', '33')`,
        [userId],
      )
      await c.query(SQL)

      const rows = await codes(c, PAIRS.flatMap(([l, n]) => [l, n]))
      expect(rows.map((r) => r.code)).toEqual(PAIRS.map(([, n]) => n).sort())
      const yenMy = rows.find((r) => r.code === '12052')!
      expect(yenMy.in_service_area).toBe(false)
      expect(
        (await c.query("SELECT ward_code FROM addresses WHERE recipient_name = 'Khách'")).rows[0].ward_code,
      ).toBe('12052')
      expect((await c.query('SELECT COUNT(*)::int AS n FROM wards')).rows[0].n).toBe(104)
    })
  })

  it('both codes present: addresses moved to canonical row, legacy row dropped, stricter state wins', async () => {
    await withDb(scratch[2], async (c) => {
      await applyBase(c, ['001_init.sql', '002_code_sequences.sql', '003_session_revocations.sql', '004_service_area.sql'])
      await c.query(
        `INSERT INTO wards (code, province_code, name, type, search_text, dataset_version, source, source_checked_at, in_service_area)
         SELECT '12004', province_code, name, type, search_text, dataset_version, source, source_checked_at, false
           FROM wards WHERE code = '11986'`,
      )
      const userId = (await c.query("INSERT INTO users (email, password_hash) VALUES ('k@example.com','x') RETURNING id")).rows[0].id
      await c.query(
        `INSERT INTO addresses (user_id, recipient_name, phone, province, district, ward, street_detail, ward_code, province_code)
         VALUES ($1, 'Khách', '0912345678', 'Hưng Yên', NULL, 'Như Quỳnh', '12 Đường Làng', '12004', '33')`,
        [userId],
      )
      await c.query(SQL)

      expect(await codes(c, ['12004'])).toEqual([])
      const [canonical] = await codes(c, ['11986'])
      expect(canonical.in_service_area).toBe(false)
      expect(
        (await c.query("SELECT ward_code FROM addresses WHERE recipient_name = 'Khách'")).rows[0].ward_code,
      ).toBe('11986')
      expect((await c.query('SELECT COUNT(*)::int AS n FROM wards')).rows[0].n).toBe(104)
      // Idempotent: a second application changes nothing.
      await c.query(SQL)
      expect((await c.query('SELECT COUNT(*)::int AS n FROM wards')).rows[0].n).toBe(104)
    })
  })
})
