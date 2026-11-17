import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { randomBytes } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { z } from 'zod'
import { currentSession, requireAdmin, requireUser } from '../lib/auth.js'
import { parse } from '../lib/validate.js'
import { AppError, errors } from '../lib/errors.js'
import { config } from '../config.js'
import { one, q } from '../db.js'

/**
 * File storage under infra/uploads, addressed by a random 128-bit name.
 *
 * Reads are authorized per file (`evidence_files`), never by knowing the URL:
 *  - `UPLOAD`  private to the uploading user (complaint photos); admin may read.
 *  - `PRODUCT` public: catalogue images are meant to be shown to everyone.
 *  - `PUBLIC`/`PUBLIC_QR` evidence is public only while the underlying batch trace
 *    is actually published (see `buildTrace`), so unpublishing a batch also pulls
 *    its certificates out of public view.
 * MIME comes from magic bytes, never from the client; names cannot traverse paths.
 */
export function isUploadUrl(url: string | null | undefined): url is string {
  return typeof url === 'string' && url.startsWith('/uploads/')
}

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

  async function save(req: FastifyRequest, ownerType: 'UPLOAD' | 'PRODUCT', ownerId: string, uploadedBy: string) {
    const file = await req.file({ limits: { fileSize: 8 * 1024 * 1024, files: 1 } })
    if (!file) throw errors.invalid('Không có tệp được tải lên.')
    const buf = await file.toBuffer()
    if (buf.length === 0) throw errors.invalid('Tệp rỗng.')
    const mime = sniff(buf)
    if (!mime || !(mime in EXT_BY_MIME)) {
      throw new AppError(422, 'INVALID_DATA', 'Chỉ chấp nhận tệp JPG, PNG hoặc PDF hợp lệ (tối đa 8MB).')
    }
    const name = `${randomBytes(16).toString('hex')}.${EXT_BY_MIME[mime]}`
    await mkdir('infra/uploads', { recursive: true })
    await writeFile(`infra/uploads/${name}`, buf)
    const url = `/uploads/${name}`
    await q(
      `INSERT INTO evidence_files (owner_type, owner_id, url, mime, size_bytes, original_name, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [ownerType, ownerId, url, mime, buf.length, file.filename.slice(0, 120), uploadedBy],
    )
    return { url, mime, size: buf.length }
  }

  app.post('/uploads', async (req, reply) => {
    const s = await requireUser(req)
    return reply.code(201).send(await save(req, 'UPLOAD', s.sub, s.sub))
  })

  app.post('/admin/uploads', async (req, reply) => {
    const s = await requireAdmin(req)
    return reply.code(201).send(await save(req, 'PRODUCT', s.sub, s.sub))
  })

  /** True when the evidence record is published with a batch people may inspect. */
  async function publishedWithTrace(url: string): Promise<boolean> {
    return Boolean(
      await one(
        `SELECT 1 FROM evidence_files e
          WHERE e.url = $1 AND e.is_public AND (
            (e.owner_type = 'BATCH' AND EXISTS (
              SELECT 1 FROM batches b WHERE b.id = e.owner_id AND b.publication_status = 'PUBLISHED'))
            OR (e.owner_type = 'CERTIFICATE' AND EXISTS (
              SELECT 1 FROM certificates c JOIN batches b ON b.id = c.batch_id
               WHERE c.id = e.owner_id AND c.is_public AND b.publication_status = 'PUBLISHED'))
            OR (e.owner_type = 'LAB_TEST' AND EXISTS (
              SELECT 1 FROM lab_tests t JOIN batches b ON b.id = t.batch_id
               WHERE t.id = e.owner_id AND t.is_effective AND b.publication_status = 'PUBLISHED'))
          )`,
        [url],
      ),
    )
  }

  app.get('/uploads/:name', async (req: FastifyRequest, reply: FastifyReply) => {
    const { name } = parse(z.object({ name: z.string().regex(/^[a-f0-9]{32}\.(jpg|png|pdf)$/) }), req.params)
    const url = `/uploads/${name}`
    // One stored file can back several records (catalogue image + batch evidence), so
    // every owner row is inspected instead of trusting an arbitrary first match.
    const files = await q<{ owner_type: string; owner_id: string; mime: string; is_public: boolean }>(
      `SELECT owner_type, owner_id, mime, is_public FROM evidence_files WHERE url = $1`,
      [url],
    )
    if (files.length === 0) throw errors.notFound('tệp')

    const session = await currentSession(req)
    const isAdmin = session?.role === 'ADMIN'
    const visible =
      isAdmin ||
      files.some((f) => f.owner_type === 'PRODUCT') ||
      files.some((f) => f.owner_type === 'UPLOAD' && session?.sub === f.owner_id) ||
      (files.some((f) => f.is_public) && (await publishedWithTrace(url)))
    if (!visible) throw errors.notFound('tệp')

    let buf: Buffer
    try {
      buf = await readFile(`infra/uploads/${name}`)
    } catch {
      throw errors.notFound('tệp')
    }
    // Private evidence must never land in a shared cache, even for a 200 response.
    const publicOk = (files.some((f) => f.owner_type === 'PRODUCT') || (await publishedWithTrace(url))) && !isAdmin
    return reply
      .type(files[0]!.mime)
      .header('cache-control', publicOk ? 'public, max-age=300' : 'private, no-store')
      .send(buf)
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
        url: z.string().regex(/^\/uploads\/[a-f0-9]{32}\.(jpg|png|pdf)$/, 'Tệp chưa được tải lên hệ thống.'),
        mime: z.string().min(3).max(60),
        description: z.string().trim().max(200).default(''),
        is_public: z.boolean().default(false),
      }),
      req.body,
    )
    // Only files that actually live on this server may be attached to a record.
    const owned = await one(`SELECT 1 FROM evidence_files WHERE url = $1`, [body.url])
    if (!owned) throw errors.invalid('Tệp không tồn tại trên hệ thống.')
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
