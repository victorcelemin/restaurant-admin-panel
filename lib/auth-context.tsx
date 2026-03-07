"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react"
import { auth as authApi, type User } from "@/lib/api"

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  hasRole: (...roles: string[]) => boolean
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

// Set the HttpOnly session cookie via a server-side route handler.
// This prevents JavaScript (including XSS payloads) from reading the cookie.
async function setSessionCookie(token: string) {
  await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  })
}

// Clear the HttpOnly session cookie via server-side route handler.
async function clearSessionCookie() {
  await fetch("/api/auth/session", { method: "DELETE" })
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem("token")
    const savedUser = localStorage.getItem("user")
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
      authApi
        .me()
        .then((u) => {
          setUser(u)
          localStorage.setItem("user", JSON.stringify(u))
        })
        .catch((err) => {
          // Only clear session on 401 (invalid/expired token), not on network errors
          const status = err?.status ?? err?.response?.status
          if (status === 401) {
            localStorage.removeItem("token")
            localStorage.removeItem("user")
            clearSessionCookie()
            setToken(null)
            setUser(null)
          }
          // On network error / 5xx: keep the cached user session
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const res = await authApi.login(username, password)
    localStorage.setItem("token", res.access_token)
    localStorage.setItem("user", JSON.stringify(res.user))
    // Set HttpOnly cookie server-side (not readable by JS / XSS)
    await setSessionCookie(res.access_token)
    setToken(res.access_token)
    setUser(res.user)
  }, [])

  const logout = useCallback(async () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    await clearSessionCookie()
    setToken(null)
    setUser(null)
  }, [])

  const hasRole = useCallback(
    (...roles: string[]) => (user ? roles.includes(user.role) : false),
    [user]
  )

  const isAdmin = useMemo(() => user?.role === "administrador", [user])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, hasRole, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
