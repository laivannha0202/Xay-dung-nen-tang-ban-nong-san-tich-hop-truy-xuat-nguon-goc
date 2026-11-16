import { cookies } from 'next/headers'
import { serverFetch } from './api'

export interface SessionUser {
  id: string
  email: string
  role: 'ADMIN' | 'CUSTOMER'
  status: string
  name: string | null
  phone: string | null
}

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
