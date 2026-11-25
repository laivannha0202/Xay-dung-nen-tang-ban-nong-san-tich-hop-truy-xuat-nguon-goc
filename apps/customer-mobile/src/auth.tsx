import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { storage } from './storage'
import { api, setToken } from './api'

export interface User {
  id: string
  email: string
  name: string | null
  phone: string | null
  role: string
}

interface Ctx {
  user: User | null
  booting: boolean
  login: (email: string, password: string) => Promise<void>
  register: (input: { name: string; email: string; phone: string; password: string }) => Promise<void>
  /** Re-reads `/me` so every header using the context sees an edited profile at once. */
  refresh: () => Promise<void>
  /** Stores the bearer the API re-issued after a password change. */
  adoptToken: (token: string) => Promise<void>
  /** Resolves `{ revoked }`: false means the bearer may still be valid server-side. */
  logout: () => Promise<{ revoked: boolean }>
}

const AuthCtx = createContext<Ctx | null>(null)
const TOKEN_KEY = 'agrimarket.token'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [booting, setBooting] = useState(true)

  useEffect(() => {
    void (async () => {
      const saved = await storage.get(TOKEN_KEY)
      if (saved) {
        setToken(saved)
        try {
          setUser(await api<User>('/me'))
        } catch {
          setToken(null)
          await storage.del(TOKEN_KEY)
        }
      }
      setBooting(false)
    })()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    })
    setToken(res.token)
    await storage.set(TOKEN_KEY, res.token)
    setUser(res.user)
  }, [])

  const register = useCallback(async (input: { name: string; email: string; phone: string; password: string }) => {
    const res = await api<{ token: string; user: User }>('/auth/customer/register', { method: 'POST', body: input })
    setToken(res.token)
    await storage.set(TOKEN_KEY, res.token)
    setUser(res.user)
  }, [])
  const refresh = useCallback(async () => {
    setUser(await api<User>('/me'))
  }, [])

  const adoptToken = useCallback(async (next: string) => {
    setToken(next)
    await storage.set(TOKEN_KEY, next)
  }, [])

  /** Revokes the bearer on the server first; local state is always cleared. */
  const logout = useCallback(async () => {
    let revoked = false
    try {
      await api('/auth/logout', { method: 'POST' })
      revoked = true
    } catch {
      // Offline: the token stays valid until it expires, so say so instead of lying.
    } finally {
      setToken(null)
      await storage.del(TOKEN_KEY)
      setUser(null)
    }
    return { revoked }
  }, [])

  const value = useMemo(
    () => ({ user, booting, login, register, logout, refresh, adoptToken }),
    [user, booting, login, register, logout, refresh, adoptToken],
  )
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth(): Ctx {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth needs AuthProvider')
  return ctx
}
