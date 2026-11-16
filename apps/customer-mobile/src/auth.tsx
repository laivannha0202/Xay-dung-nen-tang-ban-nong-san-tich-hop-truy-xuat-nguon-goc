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
  logout: () => Promise<void>
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

  const logout = useCallback(async () => {
    setToken(null)
    await storage.del(TOKEN_KEY)
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, booting, login, register, logout }), [user, booting, login, register, logout])
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth(): Ctx {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth needs AuthProvider')
  return ctx
}
