"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChefHat, LogIn } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const { login, user } = useAuth()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) router.replace("/")
  }, [user, router])

  if (user) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      toast.error("Ingresa usuario y contrasena")
      return
    }
    setLoading(true)
    try {
      await login(username, password)
      toast.success("Bienvenido a RestaurantOS")
      router.push("/")
    } catch (err: any) {
      toast.error(err.message || "Error al iniciar sesion")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm border-border bg-card">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
            <ChefHat className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-xl font-bold text-foreground">RestaurantOS</CardTitle>
          <p className="text-sm text-muted-foreground">Panel Administrativo</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="username" className="text-foreground">Usuario</Label>
              <Input
                id="username"
                placeholder="Tu nombre de usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-secondary text-foreground"
                autoComplete="username"
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password" className="text-foreground">Contrasena</Label>
              <Input
                id="password"
                type="password"
                placeholder="Tu contrasena"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-secondary text-foreground"
                autoComplete="current-password"
              />
            </div>
            <Button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={loading}
            >
              <LogIn className="mr-2 h-4 w-4" />
              {loading ? "Ingresando..." : "Iniciar Sesion"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
