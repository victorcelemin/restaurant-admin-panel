"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
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
      // Validate token is still valid
      authApi.me().then((u) => {
        setUser(u)
        localStorage.setItem("user", JSON.stringify(u))
      }).catch(() => {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        setToken(null)
        setUser(null)
      }).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const res = await authApi.login(username, password)
    localStorage.setItem("token", res.access_token)
    localStorage.setItem("user", JSON.stringify(res.user))
    setToken(res.access_token)
    setUser(res.user)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setToken(null)
    setUser(null)
  }, [])

  const hasRole = useCallback((...roles: string[]) => {
    return user ? roles.includes(user.role) : false
  }, [user])

  const isAdmin = user?.role === "administrador"

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
