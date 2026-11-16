import type { FastifyInstance } from 'fastify'
import { migrate } from '../src/scripts/migrate.js'
import { seedDatabase } from '../src/scripts/seed.js'
import { buildApp } from '../src/server.js'
import { q } from '../src/db.js'

/** Fresh migrated + seeded DB and a Fastify instance per test file. */
export type AuthHeaders = Record<string, string>

export interface Ctx {
  app: FastifyInstance
  admin: () => Promise<AuthHeaders>
  customer: (n?: number) => Promise<AuthHeaders>
  token: (email: string, password: string) => Promise<string>
}

export function headers(token: string): AuthHeaders {
  return { authorization: `Bearer ${token}`, 'x-agri-csrf': '1' }
}

export async function bootstrap(): Promise<Ctx> {
  await migrate()
  await seedDatabase()
  const app = await buildApp()
  const token = async (email: string, password: string) => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email, password } })
    if (res.statusCode !== 200) throw new Error(`login ${email} failed: ${res.statusCode} ${res.body}`)
    return res.json().token as string
  }
  return {
    app,
    token,
    admin: async () => headers(await token('admin@agrimarket.vn', 'Admin@123456')),
    customer: async (n = 1) => headers(await token(`khach${n}@example.com`, 'Khach@123456')),
  }
}

/** Fixture helper: sets on-hand stock directly so allocation scenarios are exact. */
export async function setStock(batchId: string, onHand: number) {
  await q(`UPDATE inventory SET on_hand_qty=$2, reserved_qty=0 WHERE batch_id=$1`, [batchId, onHand])
}

export async function batchIdByCode(code: string): Promise<string> {
  const rows = await q<{ id: string }>(`SELECT id FROM batches WHERE code=$1`, [code])
  return rows[0]!.id
}

export async function warehouseId(): Promise<string> {
  const rows = await q<{ id: string }>(`SELECT id FROM warehouses LIMIT 1`)
  return rows[0]!.id
}

export async function productIdBySlug(slug: string): Promise<string> {
  const rows = await q<{ id: string }>(`SELECT id FROM products WHERE slug=$1`, [slug])
  return rows[0]!.id
}

export async function json<T = any>(res: { body: string }): Promise<T> {
  return JSON.parse(res.body) as T
}
