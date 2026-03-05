"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  Printer,
  Save,
  Check,
  User,
  CreditCard,
  Search,
  UtensilsCrossed,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/store"
import { products as productsApi, orders as ordersApi, type Product } from "@/lib/api"
import { useApi } from "@/hooks/use-api"

interface CartItem {
  id: string
  productId: number
  name: string
  quantity: number
  price: number
  notes: string
}

const CATEGORY_EMOJIS: Record<string, string> = {
  bebidas: "🥤",
  bebida: "🥤",
  "platos principales": "🍽️",
  "plato principal": "🍽️",
  platos: "🍽️",
  plato: "🍽️",
  entradas: "🥗",
  entrada: "🥗",
  sopas: "🍲",
  sopa: "🍲",
  carnes: "🥩",
  carne: "🥩",
  postres: "🍮",
  postre: "🍮",
  desayunos: "🌅",
  desayuno: "🌅",
  almuerzos: "🍱",
  almuerzo: "🍱",
  cenas: "🌙",
  cena: "🌙",
  pizzas: "🍕",
  pizza: "🍕",
  hamburguesas: "🍔",
  hamburguesa: "🍔",
  ensaladas: "🥙",
  ensalada: "🥙",
  pastas: "🍝",
  pasta: "🍝",
  mariscos: "🦐",
  marisco: "🦐",
  comidas: "🍴",
  comida: "🍴",
}

function getCategoryEmoji(category: string): string {
  return CATEGORY_EMOJIS[category.toLowerCase()] ?? "🍴"
}

const PAYMENT_OPTIONS = [
  { value: "efectivo", label: "Efectivo", emoji: "💵" },
  { value: "tarjeta", label: "Tarjeta", emoji: "💳" },
  { value: "transferencia", label: "Transfer", emoji: "📱" },
  { value: "nequi", label: "Nequi", emoji: "🟪" },
]

const STEP_LABELS = ["Datos", "Menú", "Confirmar"]

export function NewOrderForm() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [tableNumber, setTableNumber] = useState("")
  const [clientName, setClientName] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<string>("")
  const [orderNotes, setOrderNotes] = useState("")
  const [items, setItems] = useState<CartItem[]>([])
  const [productSearch, setProductSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [saving, setSaving] = useState(false)

  const { data: productsList } = useApi(() => productsApi.list(), [])

  const categories = ["all", ...Array.from(new Set((productsList ?? []).map((p) => p.category)))]

  const filteredProducts = (productsList ?? []).filter((p) => {
    const matchesSearch =
      !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase())
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)

  function addProduct(product: Product) {
    const existing = items.find((i) => i.productId === product.id)
    if (existing) {
      if (existing.quantity >= product.stock) {
        toast.error(`Stock máximo para ${product.name}`)
        return
      }
      setItems(items.map((i) => (i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i)))
    } else {
      setItems([
        ...items,
        {
          id: crypto.randomUUID(),
          productId: product.id,
          name: product.name,
          quantity: 1,
          price: product.price,
          notes: "",
        },
      ])
    }
  }

  function updateQuantity(id: string, delta: number) {
    setItems(
      items
        .map((i) => (i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i))
        .filter((i) => i.quantity > 0)
    )
  }

  function updateItemNotes(id: string, notes: string) {
    setItems(items.map((i) => (i.id === id ? { ...i, notes } : i)))
  }

  function removeItem(id: string) {
    setItems(items.filter((i) => i.id !== id))
  }

  const fullClientName = [tableNumber.trim() && `Mesa ${tableNumber.trim()}`, clientName.trim()]
    .filter(Boolean)
    .join(" - ")

  function handleNext() {
    if (step === 0) {
      if (!clientName.trim()) { toast.error("Ingresa el nombre del cliente"); return }
    }
    if (step === 1) {
      if (items.length === 0) { toast.error("Agrega al menos un producto"); return }
    }
    setStep((s) => s + 1)
  }

  async function handleSave(print: boolean) {
    if (items.length === 0) { toast.error("Agrega al menos un producto"); return }
    if (!paymentMethod) { toast.error("Selecciona un método de pago"); return }
    setSaving(true)
    try {
      const order = await ordersApi.create({
        client_name: fullClientName,
        payment_method: paymentMethod,
        notes: orderNotes,
        items: items.map((i) => ({ product_id: i.productId, quantity: i.quantity, notes: i.notes })),
      })

      if (print) {
        const printWindow = window.open("", "_blank", "width=300,height=600")
        if (printWindow) {
          const itemsHtml = order.items
            .map(
              (item) =>
                `<tr><td>${item.quantity}x ${item.product_name}</td><td style="text-align:right">${formatCurrency(item.unit_price * item.quantity)}</td></tr>${item.notes ? `<tr><td colspan="2" style="font-size:10px;color:#666">  Nota: ${item.notes}</td></tr>` : ""}`
            )
            .join("")
          printWindow.document.write(`<html><head><title>Ticket ${order.order_number}</title><style>body{font-family:monospace;font-size:12px;margin:10px;width:280px}table{width:100%}td{padding:2px 0}hr{border:none;border-top:1px dashed #000}.center{text-align:center}.right{text-align:right}.bold{font-weight:bold}</style></head><body><div class="center"><h3>RestaurantOS</h3></div><hr/><p><strong>Pedido:</strong> ${order.order_number}<br/><strong>Cliente:</strong> ${order.client_name}<br/><strong>Fecha:</strong> ${new Date(order.created_at).toLocaleString("es-CO")}<br/><strong>Pago:</strong> ${order.payment_method}</p><hr/><table>${itemsHtml}</table><hr/><p class="right bold">TOTAL: ${formatCurrency(order.total)}</p>${order.notes ? `<hr/><p>Notas: ${order.notes}</p>` : ""}<hr/><p class="center" style="font-size:10px;">Gracias por su compra</p></body></html>`)
          printWindow.document.close()
          printWindow.print()
        }
      }

      toast.success(`Pedido ${order.order_number} creado`)
      router.push("/pedidos")
    } catch (err: any) {
      toast.error(err.message || "Error al crear pedido")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 text-muted-foreground"
          onClick={() => (step === 0 ? router.back() : setStep((s) => s - 1))}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Nuevo Pedido</h1>
          <p className="text-xs text-muted-foreground">
            {step === 0 && "¿Para quién es?"}
            {step === 1 && "¿Qué van a pedir?"}
            {step === 2 && "Revisa y confirma"}
          </p>
        </div>
      </div>

      {/* Step indicators */}
      <div className="mb-8 flex items-center px-2">
        {STEP_LABELS.map((label, i) => (
          <div key={i} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all",
                  i < step
                    ? "bg-primary text-primary-foreground"
                    : i === step
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : "bg-secondary text-muted-foreground"
                )}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  "mt-1 text-[10px] font-medium",
                  i === step ? "text-primary" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div
                className={cn("mb-4 h-0.5 flex-1 mx-1 transition-colors", i < step ? "bg-primary" : "bg-border")}
              />
            )}
          </div>
        ))}
      </div>

      {/* ── STEP 0: Client Info ── */}
      {step === 0 && (
        <div className="flex flex-1 flex-col gap-6">
          <div className="mb-2 flex flex-col items-center gap-2 text-center">
            <span className="text-5xl">👤</span>
            <h2 className="text-lg font-bold text-foreground">¿Para quién es el pedido?</h2>
            <p className="text-sm text-muted-foreground">Ingresa los datos del cliente</p>
          </div>

          <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-col gap-2">
              <Label className="flex items-center gap-2 font-medium text-foreground">
                <UtensilsCrossed className="h-4 w-4 text-primary" />
                Mesa (opcional)
              </Label>
              <Input
                placeholder="Ej: 5, A1, Terraza..."
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="h-12 bg-secondary text-base text-foreground"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && document.getElementById("client-name-input")?.focus()}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="flex items-center gap-2 font-medium text-foreground">
                <User className="h-4 w-4 text-primary" />
                Nombre del cliente <span className="text-destructive">*</span>
              </Label>
              <Input
                id="client-name-input"
                placeholder="Ej: Juan García, Pedido telefónico..."
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="h-12 bg-secondary text-base text-foreground"
                onKeyDown={(e) => e.key === "Enter" && handleNext()}
              />
            </div>
          </div>

          <Button
            className="h-14 bg-primary text-base font-semibold text-primary-foreground"
            onClick={handleNext}
          >
            Continuar al Menú
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      )}

      {/* ── STEP 1: Product Selection ── */}
      {step === 1 && (
        <div className="flex flex-1 flex-col gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar producto..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="h-11 bg-secondary pl-9 text-foreground"
            />
          </div>

          {/* Category tabs */}
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                )}
              >
                {cat === "all" ? "🍽️ Todos" : `${getCategoryEmoji(cat)} ${cat}`}
              </button>
            ))}
          </div>

          {/* Product grid */}
          <div className="grid grid-cols-2 gap-3 pb-28">
            {filteredProducts.map((product) => {
              const inCart = items.find((i) => i.productId === product.id)
              const isOutOfStock = product.stock === 0

              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => !isOutOfStock && addProduct(product)}
                  disabled={isOutOfStock}
                  className={cn(
                    "relative flex flex-col rounded-2xl border p-3 text-left transition-all active:scale-95",
                    isOutOfStock
                      ? "cursor-not-allowed border-border bg-card opacity-40"
                      : inCart
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/40"
                  )}
                >
                  <span className="mb-2 text-2xl">{getCategoryEmoji(product.category)}</span>
                  <span className="line-clamp-2 text-sm font-semibold leading-tight text-foreground">
                    {product.name}
                  </span>
                  <span className="mt-1 text-xs font-bold text-primary">
                    {formatCurrency(product.price)}
                  </span>
                  {isOutOfStock && (
                    <span className="mt-0.5 text-xs text-destructive">Sin stock</span>
                  )}

                  {/* Quantity badge */}
                  {inCart && !isOutOfStock && (
                    <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-lg">
                      {inCart.quantity}
                    </div>
                  )}
                  {/* Add hint */}
                  {!isOutOfStock && !inCart && (
                    <div className="absolute bottom-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-secondary">
                      <Plus className="h-3 w-3 text-muted-foreground" />
                    </div>
                  )}
                </button>
              )
            })}

            {filteredProducts.length === 0 && (
              <div className="col-span-2 flex flex-col items-center gap-2 py-12 text-center">
                <span className="text-4xl">🔍</span>
                <p className="text-sm text-muted-foreground">No se encontraron productos</p>
              </div>
            )}
          </div>

          {/* Floating cart button */}
          {items.length > 0 && (
            <div className="fixed inset-x-4 bottom-24 z-40 md:hidden">
              <button
                type="button"
                onClick={handleNext}
                className="flex w-full items-center justify-between rounded-2xl bg-primary px-5 py-4 active:scale-95"
                style={{ boxShadow: "0 8px 24px oklch(0.72 0.19 50 / 0.40)" }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/20">
                    <ShoppingBag className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs text-primary-foreground/80">
                      {itemCount} producto{itemCount !== 1 ? "s" : ""}
                    </span>
                    <span className="text-sm font-bold text-primary-foreground">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm font-semibold text-primary-foreground">
                  Ver carrito
                  <ArrowRight className="h-4 w-4" />
                </div>
              </button>
            </div>
          )}

          {/* Desktop continue button */}
          <div className="hidden md:block">
            <Button
              className="h-12 w-full bg-primary text-primary-foreground"
              onClick={handleNext}
              disabled={items.length === 0}
            >
              <ShoppingBag className="mr-2 h-4 w-4" />
              Ver carrito ({itemCount}) — {formatCurrency(total)}
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Review ── */}
      {step === 2 && (
        <div className="flex flex-1 flex-col gap-4">
          <div className="mb-2 flex flex-col items-center gap-1 text-center">
            <span className="text-4xl">🧾</span>
            <h2 className="text-lg font-bold text-foreground">¿Confirmamos el pedido?</h2>
            <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
              {tableNumber.trim() && (
                <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">
                  <UtensilsCrossed className="h-3 w-3" />
                  Mesa {tableNumber.trim()}
                </span>
              )}
              <span className="font-semibold text-foreground">{clientName}</span>
            </div>
          </div>

          {/* Cart items */}
          <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
            {items.map((item, i) => (
              <div key={item.id}>
                {i > 0 && <Separator />}
                <div className="flex flex-col gap-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} × {formatCurrency(item.price)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <span className="text-sm font-bold text-foreground">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center overflow-hidden rounded-xl border border-border">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-none"
                        onClick={() => updateQuantity(item.id, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-bold text-foreground">
                        {item.quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-none"
                        onClick={() => updateQuantity(item.id, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Nota (sin cebolla, extra salsa...)"
                      value={item.notes}
                      onChange={(e) => updateItemNotes(item.id, e.target.value)}
                      className="h-8 flex-1 bg-secondary text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
            <Separator />
            <div className="flex items-center justify-between p-4">
              <span className="font-bold text-foreground">Total</span>
              <span className="text-xl font-bold text-primary">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Payment method selector */}
          <div className="flex flex-col gap-2">
            <Label className="flex items-center gap-2 font-medium text-foreground">
              <CreditCard className="h-4 w-4 text-primary" />
              Método de pago
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPaymentMethod(opt.value)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-3 text-left transition-all active:scale-95",
                    paymentMethod === opt.value
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-secondary text-muted-foreground hover:border-primary/40"
                  )}
                >
                  <span className="text-xl">{opt.emoji}</span>
                  <span className="text-sm font-medium">{opt.label}</span>
                  {paymentMethod === opt.value && (
                    <Check className="ml-auto h-4 w-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Order notes */}
          <div className="flex flex-col gap-2">
            <Label className="font-medium text-foreground">Notas del pedido (opcional)</Label>
            <Textarea
              placeholder="Ej: sin cebolla, bolsa aparte, mesa junto a la ventana..."
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              className="bg-secondary text-foreground"
              rows={2}
            />
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2 pb-4">
            <Button
              className="h-14 bg-primary text-base font-semibold text-primary-foreground"
              onClick={() => handleSave(true)}
              disabled={saving}
            >
              <Printer className="mr-2 h-5 w-5" />
              {saving ? "Guardando..." : "Confirmar e Imprimir Ticket"}
            </Button>
            <Button
              variant="secondary"
              className="h-12"
              onClick={() => handleSave(false)}
              disabled={saving}
            >
              <Save className="mr-2 h-4 w-4" />
              Solo Confirmar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
