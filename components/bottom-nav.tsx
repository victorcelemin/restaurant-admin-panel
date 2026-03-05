"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import {
  LayoutDashboard,
  ClipboardList,
  Plus,
  Package,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react"

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  isFab?: boolean
}

const roleNavItems: Record<string, NavItem[]> = {
  mesero: [
    { href: "/", label: "Inicio", icon: LayoutDashboard },
    { href: "/pedidos/nuevo", label: "Nuevo", icon: Plus, isFab: true },
    { href: "/pedidos", label: "Pedidos", icon: ClipboardList },
  ],
  cajero: [
    { href: "/", label: "Inicio", icon: LayoutDashboard },
    { href: "/pedidos", label: "Pedidos", icon: ClipboardList },
    { href: "/pedidos/nuevo", label: "Nuevo", icon: Plus, isFab: true },
    { href: "/reportes", label: "Reportes", icon: BarChart3 },
  ],
  cocinero: [
    { href: "/", label: "Inicio", icon: LayoutDashboard },
    { href: "/pedidos", label: "Pedidos", icon: ClipboardList },
    { href: "/inventario", label: "Inventario", icon: Package },
  ],
  administrador: [
    { href: "/", label: "Inicio", icon: LayoutDashboard },
    { href: "/pedidos", label: "Pedidos", icon: ClipboardList },
    { href: "/pedidos/nuevo", label: "Nuevo", icon: Plus, isFab: true },
    { href: "/reportes", label: "Reportes", icon: BarChart3 },
    { href: "/configuracion", label: "Config", icon: Settings },
  ],
}

export function BottomNav() {
  const pathname = usePathname()
  const { user } = useAuth()

  if (!user) return null

  const items = roleNavItems[user.role] ?? roleNavItems.mesero

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border/50 bg-card/95 backdrop-blur-xl md:hidden">
      <div className="flex items-end justify-around px-2 pt-1 pb-5">
        {items.map((item) => {
          const isActive = pathname === item.href

          if (item.isFab) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1 -mt-6"
              >
                <div
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-full transition-all active:scale-90",
                    "bg-primary shadow-lg ring-4 ring-background",
                    isActive && "scale-105"
                  )}
                  style={{ boxShadow: "0 8px 24px oklch(0.72 0.19 50 / 0.45)" }}
                >
                  <Plus className="h-7 w-7 text-primary-foreground" strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-semibold text-primary">{item.label}</span>
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-[48px] flex-col items-center gap-1 py-1.5 px-2 transition-all",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className="relative flex h-6 items-center justify-center">
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-transform",
                    isActive && "scale-110"
                  )}
                />
                {isActive && (
                  <span className="absolute -bottom-2 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-primary" />
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
