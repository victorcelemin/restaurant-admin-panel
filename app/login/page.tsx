"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChefHat, LogIn, Eye, EyeOff, ShieldCheck } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const { login, user } = useAuth()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (user) router.replace("/admin") }, [user, router])
  if (user) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim() || !password.trim()) { toast.error("Ingresa usuario y contraseña"); return }
    setLoading(true)
    try {
      await login(username, password)
      toast.success("¡Bienvenido!")
      const from = new URLSearchParams(window.location.search).get("from")
      router.push(from?.startsWith("/admin") ? from : "/admin")
    } catch (err: any) {
      toast.error(err.message || "Credenciales incorrectas")
    } finally { setLoading(false) }
  }

  return (
    <div className="dark flex min-h-screen" style={{ background: "oklch(0.09 0.020 255)" }}>

      {/* ── LEFT PANEL — Photo + branding ── */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col">
        <Image
          src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=85"
          alt="Restaurant"
          fill
          className="object-cover object-center"
          priority
          unoptimized
        />
        {/* Gradient mask */}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(135deg, oklch(0.09 0.020 255 / 0.70) 0%, oklch(0.09 0.020 255 / 0.40) 60%, oklch(0.09 0.020 255 / 0.15) 100%)"
        }} />
        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "30px 30px"
        }} />
        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl"
              style={{ background: "oklch(0.78 0.18 195)", boxShadow: "0 0 24px oklch(0.78 0.18 195 / 0.4)" }}>
              <ChefHat className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-black text-white">RestaurantOS</span>
          </div>

          {/* Bottom copy */}
          <div className="mt-auto">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "oklch(0.78 0.18 195)" }}>
              Panel Administrativo
            </p>
            <h2 className="text-4xl font-black text-white leading-tight mb-4">
              Gestiona tu<br />restaurante<br />
              <span style={{
                backgroundImage: "linear-gradient(90deg, oklch(0.78 0.18 195), oklch(0.68 0.22 210))",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
              }}>en tiempo real</span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {["Pedidos", "Inventario", "Reportes", "Facturación"].map(f => (
                <span key={f} className="rounded-full px-3 py-1 text-xs font-bold text-white backdrop-blur-sm"
                  style={{ background: "oklch(1 0 0 / 0.12)", border: "1px solid oklch(1 0 0 / 0.15)" }}>
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — Form ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ background: "oklch(0.78 0.18 195)", boxShadow: "0 0 20px oklch(0.78 0.18 195 / 0.4)" }}>
            <ChefHat className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-black text-white">RestaurantOS</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
              style={{ background: "oklch(0.78 0.18 195 / 0.12)", color: "oklch(0.78 0.18 195)", border: "1px solid oklch(0.78 0.18 195 / 0.25)" }}>
              <ShieldCheck className="h-3 w-3" /> Acceso seguro
            </div>
            <h1 className="text-3xl font-black text-white">Bienvenido</h1>
            <p className="mt-1 text-sm" style={{ color: "oklch(0.55 0.012 255)" }}>Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-bold text-white/80">Usuario</Label>
              <Input
                placeholder="nombre_usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
                className="h-12 rounded-2xl border text-white placeholder:text-white/25 focus-visible:ring-1 font-medium"
                style={{
                  background: "oklch(0.15 0.025 255)",
                  borderColor: "oklch(0.26 0.030 255)",
                  "--tw-ring-color": "oklch(0.78 0.18 195 / 0.5)"
                } as React.CSSProperties}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-bold text-white/80">Contraseña</Label>
              <div className="relative">
                <Input
                  type={showPwd ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="h-12 rounded-2xl border text-white placeholder:text-white/25 focus-visible:ring-1 pr-12 font-medium"
                  style={{
                    background: "oklch(0.15 0.025 255)",
                    borderColor: "oklch(0.26 0.030 255)",
                    "--tw-ring-color": "oklch(0.78 0.18 195 / 0.5)"
                  } as React.CSSProperties}
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors">
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-base font-black text-white transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
              style={{
                background: "linear-gradient(135deg, oklch(0.78 0.18 195), oklch(0.65 0.22 215))",
                boxShadow: "0 4px 20px oklch(0.78 0.18 195 / 0.35)"
              }}>
              {loading ? (
                <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Ingresando...</>
              ) : (
                <><LogIn className="h-5 w-5" /> Ingresar al panel</>
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 rounded-2xl p-4 border"
            style={{ background: "oklch(0.13 0.022 255)", borderColor: "oklch(0.24 0.028 255)" }}>
            <p className="text-xs font-bold mb-2" style={{ color: "oklch(0.78 0.18 195)" }}>
              ✦ Credenciales de prueba
            </p>
            <div className="grid grid-cols-2 gap-1 text-xs" style={{ color: "oklch(0.55 0.012 255)" }}>
              <span><span className="text-white font-semibold">Usuario:</span> admin</span>
              <span><span className="text-white font-semibold">Contraseña:</span> admin123</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
