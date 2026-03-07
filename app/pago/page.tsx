"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  ChefHat,
  ArrowLeft,
  ClipboardList,
  Loader2,
  AlertCircle,
  Hash,
} from "lucide-react"
import { toast } from "sonner"

interface CartItem {
  id: number
  qty: number
  name: string
  price: number
}

function formatCOP(n: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(n)
}

function CheckoutForm({ items, total }: { items: CartItem[]; total: number }) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [table, setTable] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const API_BASE = "/api/proxy"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Por favor ingresa tu nombre")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${API_BASE}/api/orders/public`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: name.trim(),
          table_number: table.trim(),
          notes: notes.trim(),
          items: items.map((i) => ({
            product_id: i.id,
            quantity: i.qty,
            notes: "",
          })),
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.detail || "Error al registrar el pedido")
      }

      const order = await res.json()
      router.replace(`/pago/exitoso?order=${order.order_number}&total=${total}`)
    } catch (err: any) {
      setError(err.message || "Error inesperado. Intenta nuevamente.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-3 px-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al menú
          </button>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <ChefHat className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">RestaurantOS</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Confirmar Pedido</h1>
          <p className="text-sm text-muted-foreground">
            Tu pedido va directo a cocina — pago en caja al retirar
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Form */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 text-base font-semibold text-foreground">Tus datos</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name" className="text-foreground">
                  Nombre <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Ana García"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-background"
                  autoComplete="name"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="table" className="text-foreground">
                  Número de mesa <span className="text-muted-foreground text-xs">(opcional)</span>
                </Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="table"
                    placeholder="5"
                    value={table}
                    onChange={(e) => setTable(e.target.value)}
                    className="bg-background pl-9"
                    inputMode="numeric"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="notes" className="text-foreground">
                  Notas <span className="text-muted-foreground text-xs">(alergias, peticiones especiales…)</span>
                </Label>
                <Input
                  id="notes"
                  placeholder="Sin cebolla, extra salsa…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-background"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="mt-2 rounded-xl border border-border bg-muted/40 p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ClipboardList className="h-4 w-4 text-primary shrink-0" />
                  <span>
                    Tu pedido pasa directamente a cocina. El pago se realiza en caja al momento de retirar.
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="h-12 w-full bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando pedido...
                  </>
                ) : (
                  <>
                    <ClipboardList className="mr-2 h-5 w-5" />
                    Hacer Pedido · {formatCOP(total)}
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Order summary */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-4 text-base font-semibold text-foreground">Resumen del pedido</h2>
            <div className="flex flex-col gap-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                      {item.qty}
                    </span>
                    <span className="text-foreground">{item.name}</span>
                  </div>
                  <span className="text-muted-foreground">{formatCOP(item.price * item.qty)}</span>
                </div>
              ))}
            </div>
            <Separator className="my-4 bg-border" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total a pagar en caja</span>
              <span className="text-xl font-bold text-foreground">{formatCOP(total)}</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Precios en pesos colombianos (COP) · IVA incluido
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

function PagoPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [items, setItems] = useState<CartItem[]>([])
  const [total, setTotal] = useState(0)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const rawItems = searchParams.get("items")
      const rawTotal = searchParams.get("total")
      if (!rawItems || !rawTotal) {
        router.replace("/menu")
        return
      }
      const parsed = JSON.parse(rawItems) as CartItem[]
      if (!parsed.length) {
        router.replace("/menu")
        return
      }
      setItems(parsed)
      setTotal(Number(rawTotal))
      setReady(true)
    } catch {
      router.replace("/menu")
    }
  }, [searchParams, router])

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return <CheckoutForm items={items} total={total} />
}

export default function PagoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      }
    >
      <PagoPageContent />
    </Suspense>
  )
}
