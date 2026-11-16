import { inflateSync } from 'node:zlib'
import { beforeAll, describe, expect, it } from 'vitest'
import { bootstrap, type Ctx } from './helpers.js'

let ctx: Ctx
beforeAll(async () => {
  ctx = await bootstrap()
}, 180000)

/**
 * Concatenates every Flate-compressed stream in the PDF so the assertion scans the real
 * glyph/text payload — scanning raw bytes gives random false hits inside binary sections.
 */
function pdfText(buf: Buffer): string {
  const latin = buf.toString('latin1')
  const out: string[] = []
  const streamRe = /stream\r?\n/g
  for (let m = streamRe.exec(latin); m; m = streamRe.exec(latin)) {
    const start = m.index + m[0].length
    const end = latin.indexOf('endstream', start)
    if (end < 0) break
    try {
      out.push(inflateSync(buf.subarray(start, end)).toString('latin1'))
    } catch {
      /* image or uncompressed stream — not text */
    }
  }
  return out.join('\n')
}

describe('trace PDF (§9 #20)', () => {
  it('serves a real PDF and leaks no contact PII', async () => {
    const res = await ctx.app.inject({ url: '/api/v1/t/demo-ca-chua-lo-0001/pdf' })
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toContain('application/pdf')
    const buf = res.rawPayload
    expect(buf.subarray(0, 5).toString('latin1')).toBe('%PDF-')
    expect(buf.length).toBeGreaterThan(3000)
    expect(pdfText(buf)).not.toMatch(/@agrimarket|@example|0901|0938/)
  })

  it('unknown token yields 404, not an empty PDF', async () => {
    const res = await ctx.app.inject({ url: '/api/v1/t/khong-ton-tai-123456/pdf' })
    expect(res.statusCode).toBe(404)
  })
})
