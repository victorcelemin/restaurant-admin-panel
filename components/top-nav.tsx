"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  LayoutDashboard,
  ClipboardList,
  Package,
  BarChart3,
  FileText,
  Settings,
  ChefHat,
  LogOut,
} from "lucide-react"

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["administrador", "cajero", "mesero", "cocinero"] },
  { href: "/pedidos", label: "Pedidos", icon: ClipboardList, roles: ["administrador", "cajero", "mesero", "cocinero"] },
  { href: "/inventario", label: "Inventario", icon: Package, roles: ["administrador", "cocinero"] },
  { href: "/reportes", label: "Reportes", icon: BarChart3, roles: ["administrador", "cajero"] },
  { href: "/facturacion", label: "Facturacion", icon: FileText, roles: ["administrador", "cajero"] },
  { href: "/configuracion", label: "Config", icon: Settings, roles: ["administrador"] },
]

export function TopNav() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const visibleItems = navItems.filter((item) => user && item.roles.includes(user.role))

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <ChefHat className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="hidden font-semibold tracking-tight text-foreground sm:inline-block">
            RestaurantOS
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {user && (
            <>
              <div className="hidden items-center gap-2 sm:flex">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {user.name.charAt(0)}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-foreground leading-none">{user.name}</span>
                  <span className="text-[10px] text-muted-foreground capitalize">{user.role}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={logout}
                title="Cerrar sesion"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
