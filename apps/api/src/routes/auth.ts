import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { one, q, tx, txq } from '../db.js'
import { hashPassword, verifyPassword } from '../lib/password.js'
import { parse } from '../lib/validate.js'
import { AUTH_COOKIE, signSession, setAuthCookie, clearAuthCookie, revokeSession, requireUser, type Session } from '../lib/auth.js'
import { AppError, errors } from '../lib/errors.js'

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email không hợp lệ'),
  password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự').max(72),
  name: z.string().trim().min(2, 'Vui lòng nhập họ tên').max(80),
  phone: z.string().trim().max(20).optional(),
})

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
})

const MAX_FAILED = 5
const FAIL_WINDOW = "interval '15 minutes'"

async function throttle(email: string) {
  const row = await one<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM login_attempts
      WHERE lower(email) = $1 AND success = false AND at > now() - ${FAIL_WINDOW}`,
    [email],
  )
  if ((row?.n ?? 0) >= MAX_FAILED) {
    throw new AppError(429, 'TOO_MANY_REQUESTS', 'Bạn đã thử đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.')
  }
}

function publicUser(s: Session) {
  return { id: s.sub, email: s.email, name: s.name, role: s.role }
}

export async function authRoutes(app: FastifyInstance) {
  const authLimit = { rateLimit: { max: 20, timeWindow: '1 minute' } }

  app.post('/auth/customer/register', { config: authLimit }, async (req, reply) => {
    const body = parse(registerSchema, req.body)
    const hash = await hashPassword(body.password)
    const created = await tx(async (c) => {
      const existing = await txq(c, `SELECT id FROM users WHERE lower(email) = $1`, [body.email])
      if (existing.length > 0) throw new AppError(409, 'EMAIL_EXISTS', 'Email này đã được đăng ký.')
      // Role is never taken from the client (CUS-01, TC28).
      const u = await txq<{ id: string; email: string; role: Session['role'] }>(
        c,
        `INSERT INTO users (email, password_hash, role) VALUES ($1,$2,'CUSTOMER') RETURNING id, email, role`,
        [body.email, hash],
      )
      await txq(c, `INSERT INTO customer_profiles (user_id, name, phone) VALUES ($1,$2,$3)`, [
        u[0]!.id,
        body.name,
        body.phone ?? null,
      ])
      await txq(c, `INSERT INTO carts (customer_id) VALUES ($1) ON CONFLICT DO NOTHING`, [u[0]!.id])
      return u[0]!
    })
    const session: Session = { sub: created.id, role: created.role, email: created.email, name: body.name, tv: 0 }
    const token = await signSession(session)
    setAuthCookie(reply, token)
    return reply.code(201).send({ token, user: publicUser(session) })
  })

  app.post('/auth/login', { config: authLimit }, async (req, reply) => {
    const body = parse(loginSchema, req.body)
    await throttle(body.email)
    const user = await one<{
      id: string; email: string; password_hash: string; role: Session['role']; status: string
      token_version: number; name: string | null
    }>(
      `SELECT u.id, u.email, u.password_hash, u.role, u.status, u.token_version, p.name
         FROM users u LEFT JOIN customer_profiles p ON p.user_id = u.id
        WHERE lower(u.email) = $1`,
      [body.email],
    )
    await q(`INSERT INTO login_attempts (email, ip, success) VALUES ($1,$2,$3)`, [
      body.email,
      req.ip,
      false,
    ])
    // Same message for unknown email and wrong password (no account enumeration).
    if (!user || !(await verifyPassword(body.password, user.password_hash))) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Email hoặc mật khẩu chưa đúng.')
    }
    if (user.status !== 'ACTIVE') {
      throw new AppError(403, 'ACCOUNT_LOCKED', 'Tài khoản đã bị khóa. Vui lòng liên hệ bộ phận hỗ trợ.')
    }
    await q(`UPDATE login_attempts SET success = true WHERE id = (SELECT max(id) FROM login_attempts WHERE lower(email)=$1 AND success=false)`, [body.email])
    const session: Session = {
      sub: user.id,
      role: user.role,
      email: user.email,
      name: user.name ?? user.email,
      tv: user.token_version,
    }
    const token = await signSession(session)
    setAuthCookie(reply, token)
    return { token, user: publicUser(session) }
  })

  app.post('/auth/logout', async (req, reply) => {
    const token = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : req.cookies?.[AUTH_COOKIE]
    if (token) await revokeSession(token)
    clearAuthCookie(reply)
    return { ok: true }
  })

  app.get('/me', async (req) => {
    const s = await requireUser(req)
    const profile = await one<{ name: string; phone: string | null; created_at: string }>(
      `SELECT p.name, p.phone, u.created_at FROM customer_profiles p JOIN users u ON u.id = p.user_id WHERE p.user_id = $1`,
      [s.sub],
    )
    return {
      id: s.sub,
      email: s.email,
      role: s.role,
      name: profile?.name ?? s.name,
      phone: profile?.phone ?? null,
      created_at: profile?.created_at ?? null,
    }
  })

  app.patch('/me', async (req) => {
    const s = await requireUser(req)
    const body = parse(
      z.object({ name: z.string().trim().min(2).max(80).optional(), phone: z.string().trim().max(20).optional() }),
      req.body,
    )
    // Only the fields present in the payload are written, so clearing the phone
    // cannot silently keep the old value.
    await q(
      `INSERT INTO customer_profiles (user_id, name, phone) VALUES ($1,$2,$3)
       ON CONFLICT (user_id) DO UPDATE SET
         name = CASE WHEN $4 THEN $2 ELSE customer_profiles.name END,
         phone = CASE WHEN $5 THEN $3 ELSE customer_profiles.phone END`,
      [s.sub, body.name ?? null, body.phone ?? null, body.name !== undefined, body.phone !== undefined],
    )
    return { ok: true }
  })

  // The reply carries the re-signed cookie: the token_version bump invalidates the old one,
  // so without this the shopper is logged out the instant they change their password.
  app.post('/me/password', async (req, reply) => {
    const s = await requireUser(req)
    const body = parse(
      z.object({
        current_password: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
        new_password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự').max(72),
      }),
      req.body,
    )
    const user = await one<{ password_hash: string }>(`SELECT password_hash FROM users WHERE id = $1`, [s.sub])
    if (!user || !(await verifyPassword(body.current_password, user.password_hash))) {
      throw new AppError(422, 'INVALID_DATA', 'Mật khẩu hiện tại không đúng.', {
        current_password: 'Mật khẩu hiện tại không đúng.',
      })
    }
    const hash = await hashPassword(body.new_password)
    // token_version bump invalidates every other device's session.
    await q(`UPDATE users SET password_hash = $2, token_version = token_version + 1 WHERE id = $1`, [s.sub, hash])
    const token = await signSession({ ...s, tv: s.tv + 1 })
    setAuthCookie(reply, token)
    return { ok: true, token }
  })
}
