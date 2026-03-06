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
  Star,
  Clock,
  MapPin,
  LogIn,
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

  const { data: productsList, loading } = useApi(
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
    toast.success(`${product.name} agregado al carrito`)
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
      {/* Hero Header */}
      <header className="relative overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-10 md:py-14">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-foreground/20 backdrop-blur-sm">
                <ChefHat className="h-7 w-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">RestaurantOS</h1>
                <p className="flex items-center gap-1.5 text-xs text-primary-foreground/75">
                  <MapPin className="h-3 w-3" />
                  Medellín, Colombia
                  <span className="mx-1">·</span>
                  <Clock className="h-3 w-3" />
                  Lun–Dom 11:00–22:00
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Cart button */}
              <button
                onClick={() => cart.length > 0 && setCartOpen(true)}
                className={cn(
                  "relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all",
                  cartCount > 0
                    ? "bg-primary-foreground text-primary shadow-lg hover:bg-primary-foreground/90 active:scale-95"
                    : "bg-primary-foreground/15 text-primary-foreground/70 cursor-default"
                )}
              >
                <ShoppingCart className="h-4 w-4" />
                <span className="hidden sm:inline">Carrito</span>
                {cartCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {cartCount}
                  </span>
                )}
              </button>
              {/* Admin link */}
              <button
                onClick={() => router.push("/login")}
                className="flex items-center gap-1.5 rounded-xl bg-primary-foreground/10 px-3 py-2.5 text-xs text-primary-foreground/80 hover:bg-primary-foreground/20"
              >
                <LogIn className="h-3.5 w-3.5" />
                Admin
              </button>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-3xl font-bold md:text-4xl">Nuestro Menú</h2>
            <p className="mt-1 text-primary-foreground/75">
              <Star className="mr-1 inline h-3.5 w-3.5 fill-current" />
              Preparado con los mejores ingredientes del día
            </p>
          </div>
        </div>
      </header>

      {/* Sticky search + filters */}
      <div className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-md shadow-sm">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="relative mb-3">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar en el menú..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 pl-10 bg-muted border-0 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
            />
          </div>
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveCategory("all")}
              className={cn(
                "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all",
                activeCategory === "all"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              🍽️ Todo
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all",
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {getCategoryIcon(cat)} {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products grid */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-24 text-center">
            <span className="text-6xl">🔍</span>
            <p className="text-lg font-medium text-foreground">No encontramos ese producto</p>
            <p className="text-sm text-muted-foreground">Intenta con otra búsqueda</p>
          </div>
        ) : (
          <>
            {/* Group by category */}
            {(activeCategory === "all" ? categories : [activeCategory]).map((cat) => {
              const items = filtered.filter((p) => p.category === cat)
              if (items.length === 0) return null
              return (
                <section key={cat} className="mb-10">
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
                    <span className="text-2xl">{getCategoryIcon(cat)}</span>
                    {cat}
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {items.length}
                    </Badge>
                  </h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((product) => {
                      const inCart = cart.find((i) => i.product.id === product.id)
                      return (
                        <div
                          key={product.id}
                          className={cn(
                            "group relative flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5",
                            inCart ? "border-primary/40 ring-1 ring-primary/20" : "border-border"
                          )}
                        >
                          {/* Color top bar */}
                          <div className="h-1.5 w-full bg-gradient-to-r from-primary to-primary/60" />

                          <div className="flex flex-1 flex-col gap-3 p-5">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className="font-semibold leading-snug text-foreground">{product.name}</p>
                                <p className="mt-0.5 text-xs text-muted-foreground">{product.category}</p>
                              </div>
                              <span className="text-2xl">{getCategoryIcon(product.category)}</span>
                            </div>

                            <div className="flex items-end justify-between">
                              <div>
                                <p className="text-xl font-bold text-primary">{formatCOP(product.price)}</p>
                                <p className="text-xs text-muted-foreground">{product.unit}</p>
                              </div>

                              {inCart ? (
                                <div className="flex items-center gap-1 overflow-hidden rounded-xl border border-border bg-muted">
                                  <button
                                    onClick={() => updateQty(product.id, -1)}
                                    className="flex h-9 w-9 items-center justify-center text-foreground hover:bg-accent transition-colors"
                                  >
                                    <Minus className="h-3.5 w-3.5" />
                                  </button>
                                  <span className="w-7 text-center text-sm font-bold text-foreground">
                                    {inCart.quantity}
                                  </span>
                                  <button
                                    onClick={() => addToCart(product)}
                                    className="flex h-9 w-9 items-center justify-center text-foreground hover:bg-accent transition-colors"
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => addToCart(product)}
                                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-95 transition-all"
                                >
                                  <Plus className="h-5 w-5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {inCart && (
                            <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow">
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

      {/* Floating cart bar (mobile) */}
      {cartCount > 0 && !cartOpen && (
        <div className="fixed inset-x-4 bottom-6 z-40 md:hidden">
          <button
            onClick={() => setCartOpen(true)}
            className="flex w-full items-center justify-between rounded-2xl bg-primary px-5 py-4 shadow-xl active:scale-[0.98] transition-transform"
            style={{ boxShadow: "0 8px 32px oklch(from var(--primary) l c h / 0.40)" }}
          >
            <div className="flex items-center gap-3">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary-foreground/20">
                <ShoppingCart className="h-4.5 w-4.5 text-primary-foreground" />
                <span className="absolute -right-1.5 -top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-primary-foreground text-[10px] font-bold text-primary">
                  {cartCount}
                </span>
              </div>
              <span className="text-sm font-semibold text-primary-foreground">Ver carrito</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-primary-foreground">{formatCOP(cartTotal)}</span>
              <ArrowRight className="h-4 w-4 text-primary-foreground" />
            </div>
          </button>
        </div>
      )}

      {/* Cart Sheet */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent className="flex w-full flex-col bg-card sm:max-w-md" side="right">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2 text-foreground">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Tu Pedido
              <Badge className="ml-auto bg-primary text-primary-foreground">
                {cartCount} item{cartCount !== 1 ? "s" : ""}
              </Badge>
            </SheetTitle>
          </SheetHeader>

          {cart.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <span className="text-5xl">🛒</span>
              <p className="text-sm text-muted-foreground">Tu carrito está vacío</p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto">
                <div className="flex flex-col gap-3 pb-4">
                  {cart.map(({ product, quantity }) => (
                    <div key={product.id} className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xl">
                        {getCategoryIcon(product.category)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{product.name}</p>
                        <p className="text-xs text-primary font-semibold">{formatCOP(product.price)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateQty(product.id, -1)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted hover:bg-accent transition-colors">
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-bold">{quantity}</span>
                        <button onClick={() => updateQty(product.id, 1)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted hover:bg-accent transition-colors">
                          <Plus className="h-3 w-3" />
                        </button>
                        <button onClick={() => removeFromCart(product.id)} className="ml-1 flex h-7 w-7 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10 transition-colors">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Subtotal</span>
                  <span className="text-lg font-bold text-foreground">{formatCOP(cartTotal)}</span>
                </div>
                <Button
                  className="h-13 w-full bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90"
                  onClick={goToCheckout}
                >
                  Proceder al Pago
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Pago seguro con Stripe
                </p>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
