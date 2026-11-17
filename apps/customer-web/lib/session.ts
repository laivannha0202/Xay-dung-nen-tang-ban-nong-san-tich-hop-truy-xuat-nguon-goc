import { cookies } from 'next/headers'
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

/**
 * Shopping surfaces are CUSTOMER-only. An admin session is a valid session but not a
 * shopper: treat it as a guest here instead of letting 403s surface as page errors.
 */
export async function currentCustomer(): Promise<SessionUser | null> {
  const user = await currentUser()
  return user?.role === 'CUSTOMER' ? user : null
}
