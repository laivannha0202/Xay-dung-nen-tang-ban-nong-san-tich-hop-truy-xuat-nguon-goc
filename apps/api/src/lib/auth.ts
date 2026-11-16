import { SignJWT, jwtVerify } from 'jose'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { config } from '../config.js'
import { AppError, errors } from './errors.js'
import { one } from '../db.js'

const secret = new TextEncoder().encode(config.jwtSecret)
export const AUTH_COOKIE = 'am_token'

export type Role = 'ADMIN' | 'CUSTOMER'
export interface Session {
  sub: string
  role: Role
  email: string
  name: string
  tv: number
}

export async function signSession(s: Session): Promise<string> {
  return new SignJWT({ role: s.role, email: s.email, name: s.name, tv: s.tv })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(s.sub)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
}

export function setAuthCookie(reply: FastifyReply, token: string) {
  reply.setCookie(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProd,
    path: '/',
    maxAge: 7 * 24 * 3600,
  })
}

export function clearAuthCookie(reply: FastifyReply) {
  reply.clearCookie(AUTH_COOKIE, { path: '/' })
}

function readToken(req: FastifyRequest): { token: string; viaCookie: boolean } | null {
  const h = req.headers.authorization
  if (h?.startsWith('Bearer ')) return { token: h.slice(7), viaCookie: false }
  const c = req.cookies?.[AUTH_COOKIE]
  if (c) return { token: c, viaCookie: true }
  return null
}

/**
 * Resolves the session, verifying signature + token_version + account status against DB.
 * Cookie-authenticated mutations additionally require the `x-agri-csrf` header (unforgeable
 * by cross-site forms), which stops CSRF without a separate token store.
 */
export async function currentSession(req: FastifyRequest, opts: { mutate?: boolean } = {}): Promise<Session | null> {
  const found = readToken(req)
  if (!found) return null
  let payload: { sub?: string; role?: string; tv?: number; email?: string; name?: string }
  try {
    payload = (await jwtVerify(found.token, secret)).payload as typeof payload
  } catch {
    return null
  }
  if (!payload.sub) return null
  if (found.viaCookie && opts.mutate && req.headers['x-agri-csrf'] !== '1') return null

  const user = await one<{ id: string; role: Role; email: string; status: string; token_version: number; name: string | null }>(
    `SELECT u.id, u.role, u.email, u.status, u.token_version, p.name
       FROM users u LEFT JOIN customer_profiles p ON p.user_id = u.id
      WHERE u.id = $1`,
    [payload.sub],
  )
  if (!user) return null
  if (user.token_version !== (payload.tv ?? 0)) return null
  if (user.status !== 'ACTIVE') return null
  return { sub: user.id, role: user.role, email: user.email, name: user.name ?? user.email, tv: user.token_version }
}

export async function requireUser(req: FastifyRequest): Promise<Session> {
  const s = await currentSession(req, { mutate: req.method !== 'GET' && req.method !== 'HEAD' })
  if (!s) throw errors.unauthenticated()
  return s
}

export async function requireAdmin(req: FastifyRequest): Promise<Session> {
  const s = await requireUser(req)
  if (s.role !== 'ADMIN') throw errors.forbidden()
  return s
}

export async function requireCustomer(req: FastifyRequest): Promise<Session> {
  const s = await requireUser(req)
  if (s.role !== 'CUSTOMER') throw new AppError(403, 'FORBIDDEN', 'Chỉ tài khoản khách hàng được thực hiện thao tác này.')
  return s
}
