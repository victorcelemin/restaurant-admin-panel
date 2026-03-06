"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChefHat, LogIn, Eye, EyeOff, Sparkles, ShieldCheck } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const { login, user } = useAuth()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) router.replace("/admin")
  }, [user, router])

  if (user) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      toast.error("Ingresa usuario y contraseña")
      return
    }
    setLoading(true)
    try {
      await login(username, password)
      toast.success("¡Bienvenido a RestaurantOS!")
      const from = new URLSearchParams(window.location.search).get("from")
      router.push(from && from.startsWith("/admin") ? from : "/admin")
    } catch (err: any) {
      toast.error(err.message || "Credenciales incorrectas")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dark flex min-h-screen bg-background">
      {/* Left — Branding panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col items-center justify-center p-12"
        style={{
          background: "linear-gradient(135deg, oklch(0.12 0.04 260) 0%, oklch(0.09 0.025 245) 50%, oklch(0.13 0.05 280) 100%)",
        }}
      >
        {/* Grid dots */}
        <div className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(circle, oklch(0.97 0 0) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full blur-3xl opacity-20"
          style={{ background: "oklch(0.78 0.18 195)" }} />
        <div className="absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full blur-3xl opacity-15"
          style={{ background: "oklch(0.72 0.28 12)" }} />

        {/* Content */}
        <div className="relative z-10 max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-primary/30"
            style={{ background: "oklch(0.78 0.18 195 / 0.15)", boxShadow: "0 0 40px oklch(0.78 0.18 195 / 0.25)" }}>
            <ChefHat className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl font-black text-foreground mb-2">
            Restaurant<span style={{ color: "oklch(0.78 0.18 195)" }}>OS</span>
          </h1>
          <p className="text-muted-foreground font-medium mb-10">
            Sistema de gestión para restaurantes modernos
          </p>

          <div className="grid gap-4 text-left">
            {[
              { icon: "⚡", title: "Pedidos en tiempo real", desc: "Gestiona mesas y comandas al instante" },
              { icon: "📊", title: "Reportes detallados", desc: "Ventas, inventario y métricas del día" },
              { icon: "🔒", title: "Acceso por roles", desc: "Admin, cajero, mesero y cocinero" },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-3 rounded-2xl border border-border bg-card/30 px-4 py-3 backdrop-blur-sm">
                <span className="mt-0.5 text-xl">{f.icon}</span>
                <div>
                  <p className="text-sm font-bold text-foreground">{f.title}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Login form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-12">
        {/* Mobile logo */}
        <div className="mb-8 flex flex-col items-center gap-3 lg:hidden">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary"
            style={{ boxShadow: "0 0 24px oklch(from var(--primary) l c h / 0.4)" }}>
            <ChefHat className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-black text-foreground">
            Restaurant<span style={{ color: "oklch(0.78 0.18 195)" }}>OS</span>
          </h1>
        </div>

        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold text-primary">
              <ShieldCheck className="h-3 w-3" />
              Acceso seguro
            </div>
            <h2 className="text-3xl font-black text-foreground">Iniciar sesión</h2>
            <p className="mt-1 text-sm text-muted-foreground">Ingresa tus credenciales para continuar</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="username" className="text-sm font-bold text-foreground">
                Usuario
              </Label>
              <Input
                id="username"
                placeholder="nombre_usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-12 rounded-2xl bg-card border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary focus-visible:border-primary/50 font-medium"
                autoComplete="username"
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password" className="text-sm font-bold text-foreground">
                Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-2xl bg-card border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary focus-visible:border-primary/50 pr-12 font-medium"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-13 w-full rounded-2xl text-base font-black text-primary-foreground transition-all active:scale-[0.98] disabled:opacity-60"
              style={{
                background: loading
                  ? "oklch(from var(--primary) l c h / 0.6)"
                  : "linear-gradient(135deg, oklch(0.78 0.18 195), oklch(0.68 0.20 220))",
                boxShadow: loading ? "none" : "0 4px 20px oklch(0.78 0.18 195 / 0.35)",
              }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Ingresando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="h-5 w-5" />
                  Ingresar al panel
                </span>
              )}
            </Button>
          </form>

          {/* Help text */}
          <div className="mt-8 rounded-2xl border border-border bg-card/50 p-4">
            <p className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-primary" />
              Credenciales de prueba
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>
                <span className="font-semibold text-foreground">Usuario:</span> admin
              </div>
              <div>
                <span className="font-semibold text-foreground">Contraseña:</span> admin123
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
