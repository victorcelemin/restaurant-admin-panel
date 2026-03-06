"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import {
  LayoutDashboard,
  ClipboardList,
  Package,
  BarChart3,
  FileText,
  Settings,
  ChefHat,
  LogOut,
  Plus,
  Menu,
  X,
  ChevronRight,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  roles: string[]
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, roles: ["administrador", "cajero", "mesero", "cocinero"] },
  { href: "/admin/pedidos", label: "Pedidos", icon: ClipboardList, roles: ["administrador", "cajero", "mesero", "cocinero"] },
  { href: "/admin/inventario", label: "Inventario", icon: Package, roles: ["administrador", "cocinero"] },
  { href: "/admin/reportes", label: "Reportes", icon: BarChart3, roles: ["administrador", "cajero"] },
  { href: "/admin/facturacion", label: "Facturación", icon: FileText, roles: ["administrador", "cajero"] },
  { href: "/admin/configuracion", label: "Configuración", icon: Settings, roles: ["administrador"] },
]

const ROLE_LABELS: Record<string, string> = {
  administrador: "Admin",
  cajero: "Cajero",
  mesero: "Mesero",
  cocinero: "Cocinero",
}

const ROLE_COLORS: Record<string, string> = {
  administrador: "bg-warning/20 text-warning border-warning/30",
  cajero: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  mesero: "bg-success/20 text-success border-success/30",
  cocinero: "bg-destructive/20 text-destructive border-destructive/30",
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 border border-primary/20">
            <ChefHat className="h-8 w-8 text-primary" />
            <div className="absolute inset-0 rounded-3xl border-2 border-primary/40 animate-ping" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">Cargando panel...</span>
        </div>
      </div>
    )
  }

  if (!user) return null

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(user.role))
  const canCreateOrder = ["administrador", "cajero", "mesero"].includes(user.role)

  function handleLogout() {
    logout()
    router.replace("/login")
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-5 border-b border-sidebar-border">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg"
          style={{ boxShadow: "0 0 16px oklch(from var(--primary) l c h / 0.4)" }}>
          <ChefHat className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-black text-sidebar-foreground tracking-tight">
            Restaurant<span style={{ color: "oklch(0.78 0.18 195)" }}>OS</span>
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">Panel Admin</p>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
          <span className="text-[10px] text-muted-foreground">Online</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150",
                isActive
                  ? "bg-primary/15 text-primary border border-primary/20"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground border border-transparent"
              )}
            >
              <item.icon className={cn(
                "h-4 w-4 shrink-0 transition-all",
                isActive ? "text-primary" : "text-muted-foreground group-hover:text-sidebar-foreground"
              )} />
              <span className="flex-1">{item.label}</span>
              {isActive && (
                <div className="flex h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </Link>
          )
        })}

        {/* New order CTA */}
        {canCreateOrder && (
          <div className="mt-4 pt-4 border-t border-sidebar-border">
            <Link
              href="/admin/pedidos/nuevo"
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, oklch(0.78 0.18 195), oklch(0.68 0.20 220))",
                boxShadow: "0 4px 16px oklch(0.78 0.18 195 / 0.3)",
              }}
            >
              <Zap className="h-4 w-4" />
              Nuevo Pedido
              <ChevronRight className="ml-auto h-4 w-4 opacity-70" />
            </Link>
          </div>
        )}
      </nav>

      {/* User footer */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-xl p-2 hover:bg-sidebar-accent transition-colors">
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-sm font-black text-primary border border-primary/25">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-sidebar-foreground">{user.name}</p>
            <span className={cn(
              "inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold",
              ROLE_COLORS[user.role] ?? "bg-secondary text-secondary-foreground border-border"
            )}>
              {ROLE_LABELS[user.role] ?? user.role}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
            onClick={handleLogout}
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-sidebar-border bg-sidebar md:flex md:flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r border-sidebar-border bg-sidebar transition-transform duration-300 ease-out md:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        <SidebarContent />
      </aside>

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex h-14 items-center gap-3 border-b border-border bg-card/80 backdrop-blur-sm px-4 md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary">
              <ChefHat className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-black text-foreground">RestaurantOS</span>
          </div>
          {canCreateOrder && (
            <Link
              href="/admin/pedidos/nuevo"
              className="ml-auto flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-bold text-primary-foreground transition-all"
              style={{ background: "linear-gradient(135deg, oklch(0.78 0.18 195), oklch(0.68 0.20 220))" }}
            >
              <Plus className="h-4 w-4" />
              Nuevo
            </Link>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
