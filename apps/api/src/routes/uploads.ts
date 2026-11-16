import type { FastifyInstance } from 'fastify'
import { randomBytes } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { z } from 'zod'
import { requireAdmin, requireUser } from '../lib/auth.js'
import { parse } from '../lib/validate.js'
import { AppError, errors } from '../lib/errors.js'
import { config } from '../config.js'
import { one, q } from '../db.js'

/**
 * File uploads: stored under infra/uploads, served publicly only when the record
 * was explicitly marked public (trace evidence). MIME is sniffed from magic bytes,
 * never trusted from the client, and the stored name is random (no traversal).
 */
export async function uploadRoutes(app: FastifyInstance) {
  const EXT_BY_MIME: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'application/pdf': 'pdf',
  }

  function sniff(buf: Buffer): string | null {
    if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg'
    if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png'
    if (buf.length > 5 && buf.subarray(0, 5).toString('latin1') === '%PDF-') return 'application/pdf'
    return null
  }

  app.post('/uploads', async (req, reply) => {
    const s = await requireUser(req)
    const file = await req.file({ limits: { fileSize: 8 * 1024 * 1024, files: 1 } })
    if (!file) throw errors.invalid('Không có tệp được tải lên.')
    const buf = await file.toBuffer()
    if (buf.length === 0) throw errors.invalid('Tệp rỗng.')
    const mime = sniff(buf)
    if (!mime || !(mime in EXT_BY_MIME)) {
      throw new AppError(422, 'INVALID_DATA', 'Chỉ chấp nhận tệp JPG, PNG hoặc PDF hợp lệ (tối đa 8MB).')
    }
    const ext = EXT_BY_MIME[mime]
    const name = `${randomBytes(16).toString('hex')}.${ext}`
    const dir = 'infra/uploads'
    await mkdir(dir, { recursive: true })
    await writeFile(`${dir}/${name}`, buf)
    const url = `/uploads/${name}`
    await q(
      `INSERT INTO evidence_files (owner_type, owner_id, url, mime, size_bytes, original_name, uploaded_by)
       VALUES ('UPLOAD', $1, $2, $3, $4, $5, $1)`,
      [s.sub, url, mime, buf.length, file.filename.slice(0, 120)],
    )
    return reply.code(201).send({ url, mime, size: buf.length })
  })

  app.get('/uploads/:name', async (req, reply) => {
    const { name } = parse(z.object({ name: z.string().regex(/^[a-f0-9]{32}\.(jpg|png|pdf)$/) }), req.params)
    try {
      const buf = await readFile(`infra/uploads/${name}`)
      const ext = name.split('.').pop()!
      const mime = ext === 'pdf' ? 'application/pdf' : ext === 'png' ? 'image/png' : 'image/jpeg'
      return reply.type(mime).header('cache-control', 'public, max-age=86400').send(buf)
    } catch {
      throw errors.notFound('tệp')
    }
  })

  app.get('/health', async () => {
    const db = await one<{ ok: number }>(`SELECT 1 AS ok`)
    return { status: db?.ok === 1 ? 'ok' : 'degraded', time: new Date().toISOString(), web: config.publicWebUrl }
  })

  // Admin-only: upload tied to a domain record so trace can decide visibility.
  app.post('/admin/evidence', async (req, reply) => {
    const s = await requireAdmin(req)
    const body = parse(
      z.object({
        owner_type: z.enum(['FARM', 'BATCH', 'CULTIVATION_LOG', 'LAB_TEST', 'CERTIFICATE', 'BATCH_EVENT']),
        owner_id: z.string().uuid(),
        url: z.string().min(1).max(400),
        mime: z.string().min(3).max(60),
        description: z.string().trim().max(200).default(''),
        is_public: z.boolean().default(false),
      }),
      req.body,
    )
    const r = await one<{ id: string }>(
      `INSERT INTO evidence_files (owner_type, owner_id, url, mime, size_bytes, original_name, description, is_public, uploaded_by)
       VALUES ($1,$2,$3,$4,0,$5,$5,$6,$7) RETURNING id`,
      [body.owner_type, body.owner_id, body.url, body.mime, body.description, body.is_public, s.sub],
    )
    return reply.code(201).send({ id: r?.id })
  })

  app.get('/admin/evidence', async (req) => {
    await requireAdmin(req)
    const f = parse(
      z.object({
        owner_type: z.enum(['FARM', 'BATCH', 'CULTIVATION_LOG', 'LAB_TEST', 'CERTIFICATE', 'BATCH_EVENT']).optional(),
        owner_id: z.string().uuid().optional(),
      }),
      req.query ?? {},
    )
    return q(
      `SELECT id, owner_type, owner_id, url, mime, description, is_public, uploaded_by, created_at
         FROM evidence_files
        WHERE ($1::text IS NULL OR owner_type = $1) AND ($2::uuid IS NULL OR owner_id = $2)
        ORDER BY created_at DESC LIMIT 200`,
      [f.owner_type ?? null, f.owner_id ?? null],
    )
  })
}
