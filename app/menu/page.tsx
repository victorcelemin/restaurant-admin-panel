"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import {
  ChefHat, Search, Plus, Minus, ShoppingCart,
  Trash2, ArrowRight, Clock, MapPin, Star, Flame, Sparkles,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useApi } from "@/hooks/use-api"
import { fetchMenuProducts, type Product } from "@/lib/api"

interface CartItem { product: Product; quantity: number }

/* ── Category config ─────────────────────────────────── */
const CATEGORIES: Record<string, { icon: string; color: string; bg: string }> = {
  "plato principal": { icon: "🍽️", color: "text-orange-400", bg: "bg-orange-500/15" },
  "acompanamiento":  { icon: "🥗", color: "text-emerald-400", bg: "bg-emerald-500/15" },
  "acompañamiento":  { icon: "🥗", color: "text-emerald-400", bg: "bg-emerald-500/15" },
  "bebida":          { icon: "🥤", color: "text-sky-400",     bg: "bg-sky-500/15" },
  "bebidas":         { icon: "🥤", color: "text-sky-400",     bg: "bg-sky-500/15" },
  "salsa":           { icon: "🫙", color: "text-red-400",     bg: "bg-red-500/15" },
  "salsas":          { icon: "🫙", color: "text-red-400",     bg: "bg-red-500/15" },
  "combo":           { icon: "🎁", color: "text-violet-400",  bg: "bg-violet-500/15" },
  "combos":          { icon: "🎁", color: "text-violet-400",  bg: "bg-violet-500/15" },
  "postre":          { icon: "🍮", color: "text-pink-400",    bg: "bg-pink-500/15" },
  "postres":         { icon: "🍮", color: "text-pink-400",    bg: "bg-pink-500/15" },
  "entrada":         { icon: "🥙", color: "text-amber-400",   bg: "bg-amber-500/15" },
  "entradas":        { icon: "🥙", color: "text-amber-400",   bg: "bg-amber-500/15" },
}
function getCat(cat: string) {
  return CATEGORIES[cat.toLowerCase()] ?? { icon: "🍴", color: "text-primary", bg: "bg-primary/15" }
}

/* ── Hero images per category (Unsplash) ─────────────── */
const HERO_IMAGES: Record<string, string> = {
  "plato principal": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80",
  "acompanamiento":  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80",
  "acompañamiento":  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80",
  "bebida":          "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&q=80",
  "bebidas":         "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&q=80",
  "salsa":           "https://images.unsplash.com/photo-1606756790138-261d2b21cd75?w=600&q=80",
  "salsas":          "https://images.unsplash.com/photo-1606756790138-261d2b21cd75?w=600&q=80",
  "combo":           "https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&q=80",
  "combos":          "https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&q=80",
  "postre":          "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=600&q=80",
  "postres":         "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=600&q=80",
  "entrada":         "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=600&q=80",
  "entradas":        "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=600&q=80",
  default:           "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80",
}
function getHeroImg(cat: string) {
  return HERO_IMAGES[cat.toLowerCase()] ?? HERO_IMAGES.default
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
    () => fetchMenuProducts({ active_only: true }),
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
        if (existing.quantity >= product.stock) { toast.error(`Solo hay ${product.stock} disponibles`); return prev }
        return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { product, quantity: 1 }]
    })
    toast.success(`${product.name} agregado`)
  }

  function updateQty(id: number, delta: number) {
    setCart((prev) => prev.map((i) => i.product.id === id ? { ...i, quantity: i.quantity + delta } : i).filter((i) => i.quantity > 0))
  }

  function goToCheckout() {
    if (!cart.length) return
    const params = new URLSearchParams()
    params.set("items", JSON.stringify(cart.map((i) => ({ id: i.product.id, qty: i.quantity, name: i.product.name, price: i.product.price }))))
    params.set("total", String(cartTotal))
    setCartOpen(false)
    router.push(`/pago?${params.toString()}`)
  }

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.08 0.012 265)" }}>

      {/* ══ CINEMATIC HERO ══════════════════════════════════════════ */}
      <header className="relative h-[420px] md:h-[500px] overflow-hidden">
        {/* Background photo */}
        <Image
          src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=85"
          alt="Restaurant"
          fill
          className="object-cover object-center"
          priority
          unoptimized
        />
        {/* Gradient overlays */}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(to bottom, oklch(0.08 0.012 265 / 0.55) 0%, oklch(0.08 0.012 265 / 0.85) 70%, oklch(0.08 0.012 265) 100%)"
        }} />
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse at 70% 40%, oklch(0.72 0.28 12 / 0.20) 0%, transparent 60%)"
        }} />

        {/* Top bar */}
        <div className="relative z-10 mx-auto max-w-6xl px-4 pt-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl backdrop-blur-md"
              style={{ background: "oklch(0.72 0.28 12 / 0.85)", boxShadow: "0 0 24px oklch(0.72 0.28 12 / 0.5)" }}>
              <ChefHat className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-base font-black text-white tracking-tight">RestaurantOS</p>
              <p className="flex items-center gap-1 text-[11px]" style={{ color: "oklch(0.85 0.01 0)" }}>
                <MapPin className="h-2.5 w-2.5" style={{ color: "oklch(0.72 0.28 12)" }} />
                Medellín · <Clock className="h-2.5 w-2.5 ml-0.5" style={{ color: "oklch(0.72 0.28 12)" }} /> 11:00–22:00
              </p>
            </div>
          </div>

          {/* Cart pill */}
          <button
            onClick={() => cartCount > 0 && setCartOpen(true)}
            className={cn(
              "flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold backdrop-blur-md transition-all duration-200",
              cartCount > 0
                ? "text-white active:scale-95 hover:scale-105"
                : "text-white/50 cursor-default"
            )}
            style={cartCount > 0 ? {
              background: "oklch(0.72 0.28 12 / 0.90)",
              boxShadow: "0 4px 20px oklch(0.72 0.28 12 / 0.45)"
            } : { background: "oklch(1 0 0 / 0.10)" }}
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Mi Pedido</span>
            {cartCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-black" style={{ color: "oklch(0.72 0.28 12)" }}>
                {cartCount}
              </span>
            )}
          </button>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 mx-auto max-w-6xl px-4 pt-10">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold mb-4 backdrop-blur-sm"
            style={{ borderColor: "oklch(0.72 0.28 12 / 0.5)", background: "oklch(0.72 0.28 12 / 0.15)", color: "oklch(0.90 0.12 35)" }}>
            <Flame className="h-3 w-3" style={{ color: "oklch(0.72 0.28 12)" }} />
            Menú del día — {new Date().toLocaleDateString("es-CO", { weekday: "long" })}
          </div>
          <h2 className="text-4xl font-black text-white md:text-6xl leading-none">
            Sabor<br />
            <span style={{
              backgroundImage: "linear-gradient(90deg, oklch(0.85 0.28 35), oklch(0.75 0.22 15))",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
            }}>auténtico</span>
          </h2>
          <p className="mt-3 flex items-center gap-2 text-sm" style={{ color: "oklch(0.75 0.01 0)" }}>
            <Star className="h-3.5 w-3.5 fill-current" style={{ color: "oklch(0.82 0.20 80)" }} />
            {productsList?.length ?? "–"} platos · Ingredientes frescos · Cocina abierta
          </p>
        </div>
      </header>

      {/* ══ STICKY SEARCH + FILTERS ══════════════════════════════════ */}
      <div className="sticky top-0 z-30 border-b backdrop-blur-xl shadow-xl"
        style={{ background: "oklch(0.09 0.015 265 / 0.95)", borderColor: "oklch(0.22 0.02 265)" }}>
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="relative mb-3">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "oklch(0.55 0.01 265)" }} />
            <Input
              placeholder="Buscar en el menú..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 pl-11 rounded-2xl border-0 text-white placeholder:text-white/30 focus-visible:ring-1"
              style={{ background: "oklch(0.16 0.018 265)", "--tw-ring-color": "oklch(0.72 0.28 12 / 0.5)" } as React.CSSProperties}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors text-xs">✕</button>
            )}
          </div>
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {[{ key: "all", label: "Todo", icon: "✦" }, ...categories.map(c => ({ key: c, label: c, icon: getCat(c).icon }))].map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all duration-150",
                  activeCategory === key ? "text-white shadow-lg" : "text-white/50 hover:text-white/80"
                )}
                style={activeCategory === key ? {
                  background: "oklch(0.72 0.28 12)",
                  boxShadow: "0 4px 14px oklch(0.72 0.28 12 / 0.4)"
                } : { background: "oklch(0.16 0.018 265)" }}
              >
                <span>{icon}</span> <span className="capitalize">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══ PRODUCTS ═══════════════════════════════════════════════ */}
      <main className="mx-auto max-w-6xl px-4 py-10">
        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-3xl" style={{ background: "oklch(0.14 0.018 265)" }} />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <span className="text-6xl">⚠️</span>
            <p className="text-lg font-bold text-white">Error cargando el menú</p>
            <p className="text-sm" style={{ color: "oklch(0.55 0.01 265)" }}>{error}</p>
            <button onClick={() => window.location.reload()}
              className="mt-2 rounded-2xl px-5 py-2.5 text-sm font-bold text-white"
              style={{ background: "oklch(0.72 0.28 12)" }}>
              Reintentar
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-24 text-center">
            <span className="text-6xl">🔍</span>
            <p className="text-lg font-bold text-white">Sin resultados</p>
            <button onClick={() => { setSearch(""); setActiveCategory("all") }} className="text-sm" style={{ color: "oklch(0.72 0.28 12)" }}>
              Ver todo el menú →
            </button>
          </div>
        ) : (
          (activeCategory === "all" ? categories : [activeCategory]).map((cat) => {
            const items = filtered.filter((p) => p.category === cat)
            if (!items.length) return null
            const catStyle = getCat(cat)
            const heroImg = getHeroImg(cat)
            return (
              <section key={cat} className="mb-14">
                {/* Category header with image */}
                <div className="mb-6 flex items-center gap-4">
                  <div className="relative h-14 w-14 rounded-2xl overflow-hidden shrink-0 border"
                    style={{ borderColor: "oklch(0.25 0.02 265)" }}>
                    <Image src={heroImg} alt={cat} fill className="object-cover" unoptimized />
                    <div className="absolute inset-0 flex items-center justify-center text-2xl"
                      style={{ background: "oklch(0.05 0.01 265 / 0.55)" }}>
                      {catStyle.icon}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-black text-white capitalize">{cat}</h3>
                    <p className="text-xs" style={{ color: "oklch(0.55 0.01 265)" }}>{items.length} opciones disponibles</p>
                  </div>
                  <div className="h-px flex-1 max-w-[120px]" style={{ background: "linear-gradient(to right, oklch(0.25 0.02 265), transparent)" }} />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((product) => {
                    const inCart = cart.find((i) => i.product.id === product.id)
                    return (
                      <div
                        key={product.id}
                        className={cn(
                          "group relative overflow-hidden rounded-3xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl",
                          inCart ? "shadow-lg" : ""
                        )}
                        style={{
                          background: "oklch(0.13 0.018 265)",
                          borderColor: inCart ? "oklch(0.72 0.28 12 / 0.5)" : "oklch(0.22 0.020 265)",
                          boxShadow: inCart ? "0 0 0 1px oklch(0.72 0.28 12 / 0.2), 0 8px 32px oklch(0.72 0.28 12 / 0.12)" : undefined,
                        }}
                      >
                        {/* Image strip */}
                        <div className="relative h-36 w-full overflow-hidden">
                          <Image
                            src={heroImg}
                            alt={product.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            unoptimized
                          />
                          <div className="absolute inset-0" style={{
                            background: "linear-gradient(to bottom, transparent 30%, oklch(0.13 0.018 265) 100%)"
                          }} />
                          {/* Category badge */}
                          <div className={cn("absolute top-3 left-3 flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold backdrop-blur-sm", catStyle.bg, catStyle.color)}>
                            {catStyle.icon} <span className="capitalize">{cat}</span>
                          </div>
                          {/* Low stock warning */}
                          {product.stock <= 3 && (
                            <div className="absolute top-3 right-3 rounded-full px-2 py-0.5 text-[10px] font-bold"
                              style={{ background: "oklch(0.82 0.20 80 / 0.20)", color: "oklch(0.82 0.20 80)", border: "1px solid oklch(0.82 0.20 80 / 0.4)" }}>
                              ¡Últimos!
                            </div>
                          )}
                          {/* Cart count badge */}
                          {inCart && (
                            <div className="absolute bottom-3 right-3 flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-black text-white shadow-md"
                              style={{ background: "oklch(0.72 0.28 12)", boxShadow: "0 2px 8px oklch(0.72 0.28 12 / 0.5)" }}>
                              {inCart.quantity}
                            </div>
                          )}
                        </div>

                        {/* Card body */}
                        <div className="p-4">
                          <p className="font-bold leading-snug text-white mb-0.5">{product.name}</p>
                          <p className="text-xs mb-4" style={{ color: "oklch(0.55 0.01 265)" }}>{product.unit}</p>

                          <div className="flex items-center justify-between">
                            <p className="text-xl font-black" style={{ color: "oklch(0.82 0.26 30)" }}>
                              {formatCOP(product.price)}
                            </p>

                            {inCart ? (
                              <div className="flex items-center gap-0.5 rounded-2xl overflow-hidden border"
                                style={{ background: "oklch(0.18 0.020 265)", borderColor: "oklch(0.28 0.022 265)" }}>
                                <button onClick={() => updateQty(product.id, -1)}
                                  className="flex h-10 w-10 items-center justify-center text-white/60 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                                  <Minus className="h-3.5 w-3.5" />
                                </button>
                                <span className="w-8 text-center text-sm font-black text-white">{inCart.quantity}</span>
                                <button onClick={() => addToCart(product)}
                                  className="flex h-10 w-10 items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => addToCart(product)}
                                className="flex h-11 w-11 items-center justify-center rounded-2xl text-white transition-all duration-150 hover:scale-110 active:scale-95 shadow-lg"
                                style={{ background: "oklch(0.72 0.28 12)", boxShadow: "0 4px 14px oklch(0.72 0.28 12 / 0.4)" }}>
                                <Plus className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })
        )}
      </main>

      {/* ══ FLOATING CART (mobile) ══════════════════════════════════ */}
      {cartCount > 0 && !cartOpen && (
        <div className="fixed inset-x-4 bottom-6 z-40 md:hidden">
          <button onClick={() => setCartOpen(true)}
            className="flex w-full items-center justify-between rounded-3xl px-5 py-4 text-white shadow-2xl active:scale-[0.97] transition-transform"
            style={{ background: "oklch(0.72 0.28 12)", boxShadow: "0 8px 32px oklch(0.72 0.28 12 / 0.5)" }}>
            <div className="flex items-center gap-3">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "oklch(1 0 0 / 0.15)" }}>
                <ShoppingCart className="h-4 w-4" />
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black"
                  style={{ background: "white", color: "oklch(0.72 0.28 12)" }}>
                  {cartCount}
                </span>
              </div>
              <span className="text-sm font-bold">Ver mi pedido</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black">{formatCOP(cartTotal)}</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </button>
        </div>
      )}

      {/* ══ CART SHEET ══════════════════════════════════════════════ */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent className="flex w-full flex-col sm:max-w-md border-l"
          style={{ background: "oklch(0.11 0.016 265)", borderColor: "oklch(0.22 0.02 265)" }}>
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2 text-white text-lg font-black">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl"
                style={{ background: "oklch(0.72 0.28 12)" }}>
                <ShoppingCart className="h-4 w-4 text-white" />
              </div>
              Mi Pedido
              {cartCount > 0 && (
                <span className="ml-auto rounded-full px-3 py-0.5 text-sm font-bold"
                  style={{ background: "oklch(0.72 0.28 12 / 0.2)", color: "oklch(0.85 0.22 30)", border: "1px solid oklch(0.72 0.28 12 / 0.3)" }}>
                  {cartCount} item{cartCount !== 1 ? "s" : ""}
                </span>
              )}
            </SheetTitle>
          </SheetHeader>

          {cart.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl text-4xl"
                style={{ background: "oklch(0.16 0.018 265)", border: "1px solid oklch(0.22 0.02 265)" }}>🛒</div>
              <div>
                <p className="font-bold text-white">Tu pedido está vacío</p>
                <p className="text-sm mt-1" style={{ color: "oklch(0.55 0.01 265)" }}>Agrega productos del menú</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto space-y-3 pb-4">
                {cart.map(({ product, quantity }) => (
                  <div key={product.id} className="flex items-center gap-3 rounded-2xl p-3 border transition-colors"
                    style={{ background: "oklch(0.15 0.018 265)", borderColor: "oklch(0.24 0.022 265)" }}>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl"
                      style={{ background: "oklch(0.18 0.020 265)" }}>
                      {getCat(product.category).icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white">{product.name}</p>
                      <p className="text-xs font-bold" style={{ color: "oklch(0.82 0.26 30)" }}>{formatCOP(product.price * quantity)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQty(product.id, -1)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl transition-colors text-white/50 hover:text-red-400 hover:bg-red-500/10"
                        style={{ background: "oklch(0.18 0.02 265)" }}>
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-7 text-center text-sm font-black text-white">{quantity}</span>
                      <button onClick={() => updateQty(product.id, 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl transition-colors text-white/50 hover:text-white hover:bg-white/10"
                        style={{ background: "oklch(0.18 0.02 265)" }}>
                        <Plus className="h-3 w-3" />
                      </button>
                      <button onClick={() => setCart(c => c.filter(i => i.product.id !== product.id))}
                        className="ml-1 flex h-8 w-8 items-center justify-center rounded-xl text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 space-y-3 border-t" style={{ borderColor: "oklch(0.22 0.02 265)" }}>
                <div className="flex items-center justify-between rounded-2xl px-4 py-3"
                  style={{ background: "oklch(0.15 0.018 265)" }}>
                  <span className="text-sm font-medium" style={{ color: "oklch(0.60 0.01 265)" }}>Total</span>
                  <span className="text-xl font-black text-white">{formatCOP(cartTotal)}</span>
                </div>
                <button onClick={goToCheckout}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-black text-white transition-all active:scale-[0.98] shadow-xl"
                  style={{ background: "oklch(0.72 0.28 12)", boxShadow: "0 4px 20px oklch(0.72 0.28 12 / 0.4)" }}>
                  Confirmar Pedido <ArrowRight className="h-5 w-5" />
                </button>
                <p className="text-center text-xs" style={{ color: "oklch(0.50 0.01 265)" }}>
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
