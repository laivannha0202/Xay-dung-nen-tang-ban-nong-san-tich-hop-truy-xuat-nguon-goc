import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { serverFetch } from './api'
import type { SessionUser } from '@agrimarket/core'

export type { SessionUser }

export async function currentUser(): Promise<SessionUser | null> {
  const jar = await cookies()
  const cookie = jar.toString()
  if (!cookie) return null
  try {
    return await serverFetch<SessionUser>('/me', cookie)
  } catch {
    return null
  }
}

export async function authCookie(): Promise<string> {
  return (await cookies()).toString()
}

/** Server-side gate: the API also enforces role, this only avoids rendering a console. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await currentUser()
  if (!user) redirect('/dang-nhap?next=/')
  if (user.role !== 'ADMIN') redirect('/khong-co-quyen')
  return user
}
