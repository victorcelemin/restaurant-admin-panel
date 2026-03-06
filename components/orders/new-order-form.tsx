"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Separator } from "@/components/ui/separator"
import { Plus, Minus, Trash2, ArrowLeft, Printer, Save, X, Search } from "lucide-react"
import { toast } from "sonner"
import { products as productsApi, orders as ordersApi, type Product } from "@/lib/api"
import { useApi } from "@/hooks/use-api"

interface CartItem {
  localId: string
  product: Product
  quantity: number
  notes: string
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(amount)
}

export function NewOrderForm() {
  const router = useRouter()
  const [clientName, setClientName] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<string>("")
  const [orderNotes, setOrderNotes] = useState("")
  const [items, setItems] = useState<CartItem[]>([])
  const [productSearch, setProductSearch] = useState("")
  const [saving, setSaving] = useState(false)

  const { data: productsList, loading: productsLoading } = useApi(() => productsApi.list({ active_only: true }), [])

  const filteredProducts = (productsList ?? []).filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase())
  )

  const categories = [...new Set((productsList ?? []).map((p) => p.category))]

  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  function addProduct(product: Product) {
    if (product.stock === 0) return
    const existing = items.find((i) => i.product.id === product.id)
    if (existing) {
      if (existing.quantity >= product.stock) {
        toast.error(`Solo hay ${product.stock} disponibles de "${product.name}"`)
        return
      }
      setItems(
        items.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      )
    } else {
      setItems([
        ...items,
        {
          localId: crypto.randomUUID(),
          product,
          quantity: 1,
          notes: "",
        },
      ])
    }
  }

  function updateQuantity(localId: string, delta: number) {
    setItems(
      items
        .map((i) => {
          if (i.localId !== localId) return i
          const newQty = Math.max(0, Math.min(i.quantity + delta, i.product.stock))
          if (delta > 0 && newQty === i.quantity) {
            toast.error(`Stock maximo alcanzado (${i.product.stock})`)
          }
          return { ...i, quantity: newQty }
        })
        .filter((i) => i.quantity > 0)
    )
  }

  function updateItemNotes(localId: string, notes: string) {
    setItems(items.map((i) => (i.localId === localId ? { ...i, notes } : i)))
  }

  function removeItem(localId: string) {
    setItems(items.filter((i) => i.localId !== localId))
  }

  function printTicket(orderId: string) {
    const printWindow = window.open("", "_blank", "width=300,height=600")
    if (!printWindow) return
    const itemsHtml = items
      .map(
        (item) =>
          `<tr><td>${item.quantity}x ${item.product.name}</td><td style="text-align:right">${formatCurrency(item.product.price * item.quantity)}</td></tr>${item.notes ? `<tr><td colspan="2" style="font-size:10px;color:#666">  Nota: ${item.notes}</td></tr>` : ""}`
      )
      .join("")
    printWindow.document.write(`
      <html><head><title>Ticket ${orderId}</title>
      <style>body{font-family:monospace;font-size:12px;margin:10px;width:280px}table{width:100%}td{padding:2px 0}hr{border:none;border-top:1px dashed #000}.center{text-align:center}.right{text-align:right}.bold{font-weight:bold}</style>
      </head><body>
        <div class="center"><h3>RestaurantOS</h3></div>
        <hr/>
        <p><strong>Pedido:</strong> ${orderId}<br/><strong>Cliente:</strong> ${clientName}<br/><strong>Fecha:</strong> ${new Date().toLocaleString("es-CO")}<br/><strong>Pago:</strong> ${paymentMethod}</p>
        <hr/>
        <table>${itemsHtml}</table>
        <hr/>
        <p class="right bold">TOTAL: ${formatCurrency(total)}</p>
        ${orderNotes ? `<hr/><p>Notas: ${orderNotes}</p>` : ""}
        <hr/>
        <p class="center" style="font-size:10px;">Gracias por su compra</p>
      </body></html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  async function handleSave(withPrint: boolean) {
    if (!clientName.trim()) {
      toast.error("Ingresa el nombre del cliente")
      return
    }
    if (!paymentMethod) {
      toast.error("Selecciona un metodo de pago")
      return
    }
    if (items.length === 0) {
      toast.error("Agrega al menos un producto")
      return
    }
    setSaving(true)
    try {
      const order = await ordersApi.create({
        client_name: clientName,
        payment_method: paymentMethod,
        notes: orderNotes,
        items: items.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity,
          notes: i.notes,
        })),
      })
      if (withPrint) printTicket(order.order_number)
      toast.success(`Pedido ${order.order_number} guardado exitosamente`)
      router.push("/admin/pedidos")
    } catch (err: any) {
      toast.error(err.message || "Error al guardar el pedido")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Volver</span>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Nuevo Pedido</h1>
          <p className="text-sm text-muted-foreground">
            Crea un pedido para un cliente
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Product selector */}
        <div className="flex flex-col gap-4 lg:col-span-3">
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-foreground">Menu</CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar producto..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="bg-secondary pl-9 text-foreground"
                />
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {productsLoading && (
                <div className="flex flex-col gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-10 animate-pulse rounded-lg bg-secondary" />
                  ))}
                </div>
              )}
              {!productsLoading && categories.map((category) => {
                const catProducts = filteredProducts.filter((p) => p.category === category)
                if (catProducts.length === 0) return null
                return (
                  <div key={category}>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {category}
                    </h3>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {catProducts.map((product) => {
                        const inCart = items.find((i) => i.product.id === product.id)
                        return (
                          <button
                            key={product.id}
                            onClick={() => addProduct(product)}
                            disabled={product.stock === 0}
                            className="flex items-center justify-between rounded-lg border border-border p-3 text-left transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-foreground">
                                {product.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {product.stock === 0
                                  ? "Sin stock"
                                  : `Stock: ${product.stock}`}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-primary">
                                {formatCurrency(product.price)}
                              </span>
                              {inCart && (
                                <Badge className="bg-primary text-primary-foreground text-xs">
                                  {inCart.quantity}
                                </Badge>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* Order summary */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-foreground">
                Datos del Pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="clientName" className="text-foreground">Nombre del Cliente</Label>
                <Input
                  id="clientName"
                  placeholder="Nombre del cliente"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="bg-secondary text-foreground"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-foreground">Metodo de Pago</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="bg-secondary text-foreground">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="tarjeta">Tarjeta</SelectItem>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                    <SelectItem value="nequi">Nequi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="orderNotes" className="text-foreground">Notas del Pedido</Label>
                <Textarea
                  id="orderNotes"
                  placeholder="Ej: Bolsa aparte, sin cebolla..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="bg-secondary text-foreground"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-foreground">
                Items del Pedido ({items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {items.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Selecciona productos del menu
                </p>
              ) : (
                <>
                  {items.map((item) => (
                    <div key={item.localId} className="flex flex-col gap-2 rounded-lg border border-border p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground">{item.product.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatCurrency(item.product.price)} c/u
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-foreground">
                          {formatCurrency(item.product.price * item.quantity)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center rounded-md border border-border">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground"
                            onClick={() => updateQuantity(item.localId, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium text-foreground">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground"
                            onClick={() => updateQuantity(item.localId, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Input
                          placeholder="Nota..."
                          value={item.notes}
                          onChange={(e) => updateItemNotes(item.localId, e.target.value)}
                          className="h-7 flex-1 bg-secondary text-xs text-foreground"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => removeItem(item.localId)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Separator />
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span className="text-foreground">Total</span>
                    <span className="text-primary">{formatCurrency(total)}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2">
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleSave(true)}
              disabled={items.length === 0 || saving}
            >
              <Printer className="mr-2 h-4 w-4" />
              {saving ? "Guardando..." : "Guardar e Imprimir Ticket"}
            </Button>
            <Button
              variant="secondary"
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
              onClick={() => handleSave(false)}
              disabled={items.length === 0 || saving}
            >
              <Save className="mr-2 h-4 w-4" />
              Solo Guardar
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" className="text-destructive hover:text-destructive">
                  <X className="mr-2 h-4 w-4" />
                  Cancelar Pedido
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card text-foreground">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-foreground">Cancelar Pedido</AlertDialogTitle>
                  <AlertDialogDescription>
                    Se perderan todos los datos del pedido. Esta seguro?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-secondary text-secondary-foreground">Volver</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground"
                    onClick={() => router.push("/admin/pedidos")}
                  >
                    Si, cancelar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  )
}
