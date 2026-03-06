"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import {
  ChefHat,
  Search,
  Plus,
  Minus,
  ShoppingCart,
  Trash2,
  ArrowRight,
  Sparkles,
  Clock,
  MapPin,
  Flame,
  Star,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useApi } from "@/hooks/use-api"
import { products as productsApi, type Product } from "@/lib/api"

interface CartItem {
  product: Product
  quantity: number
}

const CATEGORY_ICONS: Record<string, string> = {
  "plato principal": "🍽️",
  "plato": "🍽️",
  "acompanamiento": "🥗",
  "acompañamiento": "🥗",
  "bebida": "🥤",
  "bebidas": "🥤",
  "salsa": "🫙",
  "salsas": "🫙",
  "combo": "🎁",
  "combos": "🎁",
  "postre": "🍮",
  "postres": "🍮",
  "entrada": "🥙",
  "entradas": "🥙",
}

function getCategoryIcon(cat: string) {
  return CATEGORY_ICONS[cat.toLowerCase()] ?? "🍴"
}

function formatCOP(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n)
}

export default function MenuPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)

  const { data: productsList, loading, error } = useApi(
    () => productsApi.list({ active_only: true }),
    []
  )

  const categories = useMemo(() => {
    const cats = [...new Set((productsList ?? []).map((p) => p.category))]
    return cats.sort()
  }, [productsList])

  const filtered = useMemo(() => {
    return (productsList ?? []).filter((p) => {
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
      const matchCat = activeCategory === "all" || p.category === activeCategory
      return matchSearch && matchCat && p.stock > 0
    })
  }, [productsList, search, activeCategory])

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)
  const cartTotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0)

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id)
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error(`Solo hay ${product.stock} disponibles`)
          return prev
        }
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
    toast.success(`${product.name} agregado`)
  }

  function updateQty(id: number, delta: number) {
    setCart((prev) =>
      prev
        .map((i) => (i.product.id === id ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    )
  }

  function removeFromCart(id: number) {
    setCart((prev) => prev.filter((i) => i.product.id !== id))
  }

  function goToCheckout() {
    if (cart.length === 0) return
    const params = new URLSearchParams()
    params.set("items", JSON.stringify(cart.map((i) => ({ id: i.product.id, qty: i.quantity, name: i.product.name, price: i.product.price }))))
    params.set("total", String(cartTotal))
    setCartOpen(false)
    router.push(`/pago?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-background">

      {/* ── HERO HEADER ── */}
      <header className="relative overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 20% 50%, oklch(0.72 0.28 12 / 0.18) 0%, transparent 60%), " +
              "radial-gradient(ellipse at 80% 20%, oklch(0.65 0.22 280 / 0.15) 0%, transparent 55%)",
          }}
        />
        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "radial-gradient(circle, oklch(0.97 0 0) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative mx-auto max-w-6xl px-4 py-10 md:py-16">
          <div className="flex items-center justify-between">
            {/* Brand */}
            <div className="flex items-center gap-4">
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-primary glow-primary">
                <ChefHat className="h-7 w-7 text-primary-foreground" />
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-success text-[8px] font-bold text-success-foreground">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-60" />
                  <span className="relative">✓</span>
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-foreground">
                  Restaurant<span className="text-gradient">OS</span>
                </h1>
                <p className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <MapPin className="h-3 w-3 text-primary" />
                  Medellín, Colombia
                  <span className="text-border">·</span>
                  <Clock className="h-3 w-3 text-primary" />
                  11:00 – 22:00
                </p>
              </div>
            </div>

            {/* Cart button */}
            <button
              onClick={() => cartCount > 0 && setCartOpen(true)}
              className={cn(
                "relative flex items-center gap-2.5 rounded-2xl px-5 py-3 text-sm font-bold transition-all duration-200",
                cartCount > 0
                  ? "bg-primary text-primary-foreground glow-sm hover:scale-105 active:scale-95"
                  : "bg-muted text-muted-foreground cursor-default"
              )}
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Mi Pedido</span>
              {cartCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground text-[10px] font-black text-primary">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

          {/* Hero text */}
          <div className="mt-10 max-w-xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/15 border border-primary/25 px-3 py-1 text-xs font-semibold text-primary">
              <Flame className="h-3 w-3" />
              Menú del día disponible
            </div>
            <h2 className="text-4xl font-black leading-tight text-foreground md:text-5xl">
              Hecho con
              <br />
              <span className="text-gradient">pasión & sabor</span>
            </h2>
            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Star className="h-3.5 w-3.5 fill-warning text-warning" />
              Ingredientes frescos · Preparación al momento · Directo a tu mesa
            </p>
          </div>

          {/* Stats row */}
          <div className="mt-8 flex flex-wrap gap-4">
            {[
              { label: "Platos disponibles", value: String(productsList?.length ?? "–") },
              { label: "Categorías", value: String(categories.length || "–") },
              { label: "Tiempo promedio", value: "15–25 min" },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2">
                <span className="text-lg font-black text-primary">{stat.value}</span>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ── STICKY SEARCH + FILTERS ── */}
      <div className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl shadow-lg shadow-background/50">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="relative mb-3">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar en el menú..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 pl-11 bg-card border-border text-foreground placeholder:text-muted-foreground rounded-2xl focus-visible:ring-primary focus-visible:border-primary/50"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                ✕
              </button>
            )}
          </div>
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveCategory("all")}
              className={cn(
                "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all duration-150",
                activeCategory === "all"
                  ? "bg-primary text-primary-foreground glow-sm shadow-lg"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
              )}
            >
              <Sparkles className="h-3.5 w-3.5" /> Todo
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all duration-150",
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground glow-sm shadow-lg"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                )}
              >
                {getCategoryIcon(cat)} {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── PRODUCTS GRID ── */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-52 animate-pulse rounded-3xl bg-card border border-border" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <span className="text-6xl">⚠️</span>
            <p className="text-lg font-bold text-foreground">Error cargando el menú</p>
            <p className="text-sm text-muted-foreground max-w-xs">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90"
            >
              Reintentar
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-24 text-center">
            <span className="text-6xl">🔍</span>
            <p className="text-lg font-bold text-foreground">Sin resultados</p>
            <p className="text-sm text-muted-foreground">Prueba con otra búsqueda o categoría</p>
            <button onClick={() => { setSearch(""); setActiveCategory("all") }} className="mt-2 text-sm text-primary hover:underline">
              Ver todo el menú
            </button>
          </div>
        ) : (
          <>
            {(activeCategory === "all" ? categories : [activeCategory]).map((cat) => {
              const items = filtered.filter((p) => p.category === cat)
              if (items.length === 0) return null
              return (
                <section key={cat} className="mb-12">
                  {/* Category header */}
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15 border border-primary/25 text-xl">
                      {getCategoryIcon(cat)}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-foreground capitalize">{cat}</h3>
                      <p className="text-xs text-muted-foreground">{items.length} opciones disponibles</p>
                    </div>
                    <div className="ml-auto h-px flex-1 bg-gradient-to-r from-border to-transparent" />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((product) => {
                      const inCart = cart.find((i) => i.product.id === product.id)
                      return (
                        <div
                          key={product.id}
                          className={cn(
                            "group relative flex flex-col overflow-hidden rounded-3xl border transition-all duration-300 hover:-translate-y-1",
                            inCart
                              ? "border-primary/50 bg-card shadow-lg shadow-primary/10 ring-1 ring-primary/20"
                              : "border-border bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                          )}
                        >
                          {/* Top accent bar */}
                          <div className={cn(
                            "h-1 w-full transition-all duration-300",
                            inCart
                              ? "bg-primary"
                              : "bg-gradient-to-r from-primary/30 to-transparent group-hover:from-primary/60"
                          )} />

                          <div className="flex flex-1 flex-col gap-4 p-5">
                            {/* Icon + name row */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 border border-primary/15 text-2xl">
                                {getCategoryIcon(product.category)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold leading-snug text-foreground">{product.name}</p>
                                <p className="mt-0.5 text-xs text-muted-foreground capitalize">{product.category}</p>
                              </div>
                              {product.stock <= 3 && product.stock > 0 && (
                                <Badge className="shrink-0 bg-warning/20 text-warning-foreground border border-warning/30 text-[10px]">
                                  ¡Últimos!
                                </Badge>
                              )}
                            </div>

                            {/* Price + action row */}
                            <div className="flex items-end justify-between mt-auto">
                              <div>
                                <p className="text-2xl font-black text-primary leading-none">{formatCOP(product.price)}</p>
                                <p className="mt-1 text-xs text-muted-foreground">{product.unit}</p>
                              </div>

                              {inCart ? (
                                <div className="flex items-center gap-0.5 overflow-hidden rounded-2xl border border-border bg-muted/60">
                                  <button
                                    onClick={() => updateQty(product.id, -1)}
                                    className="flex h-10 w-10 items-center justify-center text-foreground hover:bg-destructive/15 hover:text-destructive transition-colors"
                                  >
                                    <Minus className="h-3.5 w-3.5" />
                                  </button>
                                  <span className="w-8 text-center text-sm font-black text-foreground">
                                    {inCart.quantity}
                                  </span>
                                  <button
                                    onClick={() => addToCart(product)}
                                    className="flex h-10 w-10 items-center justify-center text-foreground hover:bg-primary/15 hover:text-primary transition-colors"
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => addToCart(product)}
                                  className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground glow-sm hover:scale-110 active:scale-95 transition-all duration-150 shadow-lg"
                                >
                                  <Plus className="h-5 w-5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* In-cart indicator */}
                          {inCart && (
                            <div className="absolute top-4 right-4 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-black text-primary-foreground shadow-md">
                              {inCart.quantity}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </section>
              )
            })}
          </>
        )}
      </main>

      {/* ── FLOATING CART BAR (mobile) ── */}
      {cartCount > 0 && !cartOpen && (
        <div className="fixed inset-x-4 bottom-6 z-40 md:hidden">
          <button
            onClick={() => setCartOpen(true)}
            className="flex w-full items-center justify-between rounded-3xl bg-primary px-5 py-4 shadow-2xl active:scale-[0.97] transition-transform glow-primary"
          >
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-foreground/20">
                <ShoppingCart className="h-5 w-5 text-primary-foreground" />
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground text-[10px] font-black text-primary">
                  {cartCount}
                </span>
              </div>
              <span className="text-sm font-bold text-primary-foreground">Ver mi pedido</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-primary-foreground">{formatCOP(cartTotal)}</span>
              <ArrowRight className="h-4 w-4 text-primary-foreground" />
            </div>
          </button>
        </div>
      )}

      {/* ── CART SHEET ── */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent className="flex w-full flex-col bg-card border-border sm:max-w-md" side="right">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2 text-foreground text-lg font-black">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary">
                <ShoppingCart className="h-4 w-4 text-primary-foreground" />
              </div>
              Mi Pedido
              {cartCount > 0 && (
                <Badge className="ml-auto bg-primary/20 text-primary border border-primary/30 font-bold">
                  {cartCount} {cartCount === 1 ? "item" : "items"}
                </Badge>
              )}
            </SheetTitle>
          </SheetHeader>

          {cart.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-muted border border-border text-4xl">
                🛒
              </div>
              <div>
                <p className="font-bold text-foreground">Tu pedido está vacío</p>
                <p className="text-sm text-muted-foreground mt-1">Agrega productos del menú</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto">
                <div className="flex flex-col gap-3 pb-4">
                  {cart.map(({ product, quantity }) => (
                    <div key={product.id} className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3 transition-all hover:border-primary/30">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/15 text-xl">
                        {getCategoryIcon(product.category)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-foreground">{product.name}</p>
                        <p className="text-xs font-bold text-primary">{formatCOP(product.price * quantity)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateQty(product.id, -1)} className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted hover:bg-destructive/15 hover:text-destructive transition-colors">
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-7 text-center text-sm font-black text-foreground">{quantity}</span>
                        <button onClick={() => updateQty(product.id, 1)} className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted hover:bg-primary/15 hover:text-primary transition-colors">
                          <Plus className="h-3 w-3" />
                        </button>
                        <button onClick={() => removeFromCart(product.id)} className="ml-1 flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground hover:bg-destructive/15 hover:text-destructive transition-colors">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-3">
                <div className="flex items-center justify-between rounded-2xl bg-muted/50 px-4 py-3">
                  <span className="text-sm text-muted-foreground font-medium">Total</span>
                  <span className="text-xl font-black text-foreground">{formatCOP(cartTotal)}</span>
                </div>
                <Button
                  className="h-13 w-full rounded-2xl bg-primary text-base font-black text-primary-foreground hover:bg-primary/90 glow-sm transition-all active:scale-[0.98]"
                  onClick={goToCheckout}
                >
                  Confirmar Pedido
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Pago en caja al retirar · Directo a cocina
                </p>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
