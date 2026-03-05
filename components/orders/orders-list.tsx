"use client"

import { useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import {
  PlusCircle,
  Search,
  Eye,
  Printer,
  Clock,
  ChefHat,
  CheckCircle2,
  XCircle,
  Timer,
  ShoppingBag,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { formatCurrency, getStatusLabel } from "@/lib/store"
import { orders as ordersApi, type Order } from "@/lib/api"
import { useApi } from "@/hooks/use-api"
import { useAuth } from "@/lib/auth-context"

const STATUS_FILTERS = [
  { value: "all", label: "Todos", emoji: "📋" },
  { value: "pendiente", label: "Pendiente", emoji: "⏳" },
  { value: "en_preparacion", label: "Preparando", emoji: "👨‍🍳" },
  { value: "completado", label: "Listo", emoji: "✅" },
  { value: "cancelado", label: "Cancelado", emoji: "❌" },
]

type StatusConfig = {
  badgeClass: string
  textClass: string
  strip: string
  icon: React.ComponentType<{ className?: string }>
  label: string
}

function getStatusConfig(status: string): StatusConfig {
  switch (status) {
    case "pendiente":
      return {
        badgeClass: "border-warning/30 bg-warning/15 text-warning",
        textClass: "text-warning",
        strip: "bg-warning",
        icon: Timer,
        label: "Pendiente",
      }
    case "en_preparacion":
      return {
        badgeClass: "border-chart-3/30 bg-chart-3/15 text-chart-3",
        textClass: "text-chart-3",
        strip: "bg-chart-3",
        icon: ChefHat,
        label: "Preparando",
      }
    case "completado":
      return {
        badgeClass: "border-success/30 bg-success/15 text-success",
        textClass: "text-success",
        strip: "bg-success",
        icon: CheckCircle2,
        label: "Completado",
      }
    case "cancelado":
      return {
        badgeClass: "border-destructive/30 bg-destructive/15 text-destructive",
        textClass: "text-destructive",
        strip: "bg-destructive",
        icon: XCircle,
        label: "Cancelado",
      }
    default:
      return {
        badgeClass: "border-border bg-secondary text-muted-foreground",
        textClass: "text-muted-foreground",
        strip: "bg-border",
        icon: Clock,
        label: status,
      }
  }
}

function printOrder(order: Order) {
  const printWindow = window.open("", "_blank", "width=300,height=600")
  if (!printWindow) return
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

export function OrdersList() {
  const { hasRole } = useAuth()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const { data: ordersList, refetch } = useApi(
    () =>
      ordersApi.list({
        status: statusFilter === "all" ? undefined : statusFilter,
        search: search || undefined,
      }),
    [statusFilter, search]
  )

  const filtered = ordersList ?? []

  async function handleStatusChange(order: Order, newStatus: string) {
    try {
      await ordersApi.updateStatus(order.id, newStatus)
      toast.success(`Pedido actualizado a ${getStatusLabel(newStatus)}`)
      refetch()
      setSelectedOrder(null)
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar estado")
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Pedidos</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} pedido{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
        {hasRole("administrador", "cajero", "mesero") && (
          <Button asChild size="sm" className="rounded-xl bg-primary text-primary-foreground">
            <Link href="/pedidos/nuevo">
              <PlusCircle className="mr-1.5 h-4 w-4" />
              Nuevo
            </Link>
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por cliente o ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-secondary pl-9 text-foreground"
        />
      </div>

      {/* Status filter tabs */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setStatusFilter(f.value)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all",
              statusFilter === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            )}
          >
            {f.emoji} {f.label}
          </button>
        ))}
      </div>

      {/* Order cards */}
      <div className="flex flex-col gap-3">
        {filtered.map((order) => {
          const config = getStatusConfig(order.status)
          const StatusIcon = config.icon

          return (
            <div
              key={order.id}
              className="relative flex overflow-hidden rounded-2xl border border-border bg-card"
            >
              {/* Left color strip */}
              <div className={cn("w-1 shrink-0", config.strip)} />

              <div className="flex flex-1 flex-col gap-3 p-4">
                {/* Top row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-bold text-primary">
                        {order.order_number}
                      </span>
                      <span
                        className={cn(
                          "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                          config.badgeClass
                        )}
                      >
                        <StatusIcon className="h-2.5 w-2.5" />
                        {config.label}
                      </span>
                    </div>
                    <span className="text-base font-semibold text-foreground">
                      {order.client_name}
                    </span>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-0.5">
                    <span className="text-lg font-bold text-foreground">
                      {formatCurrency(order.total)}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(order.created_at).toLocaleTimeString("es-CO", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                {/* Bottom row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <ShoppingBag className="h-3 w-3" />
                      {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                    </span>
                    <span className="capitalize">{order.payment_method}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {order.status === "pendiente" && (
                      <Button
                        size="sm"
                        className="h-8 rounded-xl border-0 bg-chart-3/15 text-xs font-semibold text-chart-3 hover:bg-chart-3/25"
                        onClick={() => handleStatusChange(order, "en_preparacion")}
                      >
                        <ChefHat className="mr-1 h-3 w-3" />
                        Preparar
                      </Button>
                    )}
                    {order.status === "en_preparacion" && (
                      <Button
                        size="sm"
                        className="h-8 rounded-xl border-0 bg-success/15 text-xs font-semibold text-success hover:bg-success/25"
                        onClick={() => handleStatusChange(order, "completado")}
                      >
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Completar
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => printOrder(order)}
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="text-5xl">📋</span>
            <p className="text-sm text-muted-foreground">No se encontraron pedidos</p>
          </div>
        )}
      </div>

      {/* ── Order Detail Dialog ── */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-md bg-card text-foreground">
          {selectedOrder && (() => {
            const config = getStatusConfig(selectedOrder.status)
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-foreground">
                    <span className="font-mono text-primary">{selectedOrder.order_number}</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      — {selectedOrder.client_name}
                    </span>
                  </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4">
                  {/* Meta grid */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-xl bg-secondary p-3">
                      <p className="mb-1 text-xs text-muted-foreground">Pago</p>
                      <p className="font-semibold capitalize text-foreground">
                        {selectedOrder.payment_method}
                      </p>
                    </div>
                    <div className="rounded-xl bg-secondary p-3">
                      <p className="mb-1 text-xs text-muted-foreground">Estado</p>
                      <p className={cn("flex items-center gap-1 text-xs font-semibold", config.textClass)}>
                        <config.icon className="h-3 w-3" />
                        {config.label}
                      </p>
                    </div>
                    <div className="col-span-2 rounded-xl bg-secondary p-3">
                      <p className="mb-1 text-xs text-muted-foreground">Fecha</p>
                      <p className="text-sm font-semibold text-foreground">
                        {new Date(selectedOrder.created_at).toLocaleString("es-CO")}
                      </p>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-semibold text-foreground">Productos</p>
                    <div className="flex flex-col overflow-hidden rounded-xl border border-border">
                      {selectedOrder.items.map((item, i) => (
                        <div key={item.id}>
                          {i > 0 && <Separator />}
                          <div className="flex items-center justify-between p-3 text-sm">
                            <div className="flex flex-col">
                              <span className="text-foreground">
                                {item.quantity}× {item.product_name}
                              </span>
                              {item.notes && (
                                <span className="text-xs text-muted-foreground">
                                  Nota: {item.notes}
                                </span>
                              )}
                            </div>
                            <span className="font-semibold text-foreground">
                              {formatCurrency(item.unit_price * item.quantity)}
                            </span>
                          </div>
                        </div>
                      ))}
                      <Separator />
                      <div className="flex items-center justify-between p-3">
                        <span className="font-bold text-foreground">Total</span>
                        <span className="text-lg font-bold text-primary">
                          {formatCurrency(selectedOrder.total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedOrder.notes && (
                    <div className="rounded-xl bg-secondary p-3 text-sm">
                      <p className="mb-1 text-xs text-muted-foreground">Notas</p>
                      <p className="text-foreground">{selectedOrder.notes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    {selectedOrder.status === "pendiente" && (
                      <Button
                        className="bg-chart-3 text-white hover:bg-chart-3/90"
                        onClick={() => handleStatusChange(selectedOrder, "en_preparacion")}
                      >
                        <ChefHat className="mr-2 h-4 w-4" />
                        Enviar a Preparación
                      </Button>
                    )}
                    {selectedOrder.status === "en_preparacion" && (
                      <Button
                        className="bg-success text-success-foreground hover:bg-success/90"
                        onClick={() => handleStatusChange(selectedOrder, "completado")}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Marcar Completado
                      </Button>
                    )}
                    <div className="flex gap-2">
                      {(selectedOrder.status === "pendiente" ||
                        selectedOrder.status === "en_preparacion") && (
                        <Button
                          variant="secondary"
                          className="flex-1 bg-destructive/10 text-destructive hover:bg-destructive/20"
                          onClick={() => handleStatusChange(selectedOrder, "cancelado")}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Cancelar
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={() => {
                          printOrder(selectedOrder)
                          setSelectedOrder(null)
                        }}
                      >
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
