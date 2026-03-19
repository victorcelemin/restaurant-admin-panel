"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { PlusCircle, Search, Eye, Printer, Clock, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { orders as ordersApi, type Order } from "@/lib/api"
import { useApi } from "@/hooks/use-api"

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(amount)
}

function getStatusColor(status: string) {
  switch (status) {
    case "pendiente":
    case "pending":
      return "bg-warning/15 text-warning"
    case "en_preparacion":
    case "preparing":
      return "bg-chart-3/15 text-chart-3"
    case "completado":
    case "completed":
      return "bg-success/15 text-success"
    case "cancelado":
    case "cancelled":
      return "bg-destructive/15 text-destructive"
    default:
      return "bg-secondary text-secondary-foreground"
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "pendiente":
    case "pending":
      return "Pendiente"
    case "en_preparacion":
    case "preparing":
      return "En Preparacion"
    case "completado":
    case "completed":
      return "Completado"
    case "cancelado":
    case "cancelled":
      return "Cancelado"
    default:
      return status
  }
}

export function OrdersList() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const { data: ordersList, loading, refetch } = useApi(() => ordersApi.list(), [])
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  async function handleCompleteOrder(orderId: number) {
    try {
      setUpdatingId(orderId)
      await ordersApi.updateStatus(orderId, "completed")
      toast.success("Pedido completado exitosamente")
      // Close dialog if open
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null)
      }
      // Refresh the list
      await refetch()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al completar el pedido")
    } finally {
      setUpdatingId(null)
    }
  }

  const filtered = (ordersList ?? []).filter((o) => {
    const matchesSearch =
      o.client_name.toLowerCase().includes(search.toLowerCase()) ||
      o.order_number.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || 
      o.status === statusFilter || 
      (statusFilter === "completado" && o.status === "completed") ||
      (statusFilter === "completed" && o.status === "completado") ||
      (statusFilter === "cancelado" && o.status === "cancelled") ||
      (statusFilter === "cancelled" && o.status === "cancelado") ||
      (statusFilter === "pendiente" && o.status === "pending") ||
      (statusFilter === "pending" && o.status === "pendiente") ||
      (statusFilter === "en_preparacion" && o.status === "preparing") ||
      (statusFilter === "preparing" && o.status === "en_preparacion")
    return matchesSearch && matchesStatus
  })

  function handlePrint(order: Order) {
    const printWindow = window.open("", "_blank", "width=300,height=600")
    if (!printWindow) return
    const itemsHtml = order.items
      .map(
        (item) =>
          `<tr><td>${item.quantity}x ${item.product_name}</td><td style="text-align:right">${formatCurrency(item.unit_price * item.quantity)}</td></tr>${item.notes ? `<tr><td colspan="2" style="font-size:10px;color:#666">  Nota: ${item.notes}</td></tr>` : ""}`
      )
      .join("")
    printWindow.document.write(`
      <html><head><title>Ticket ${order.order_number}</title>
      <style>body{font-family:monospace;font-size:12px;margin:10px;width:280px}table{width:100%}td{padding:2px 0}hr{border:none;border-top:1px dashed #000}.center{text-align:center}.right{text-align:right}.bold{font-weight:bold}</style>
      </head><body>
        <div class="center"><h3>RestaurantOS</h3></div>
        <hr/>
        <p><strong>Pedido:</strong> ${order.order_number}<br/><strong>Cliente:</strong> ${order.client_name}<br/><strong>Fecha:</strong> ${new Date(order.created_at).toLocaleString("es-CO")}<br/><strong>Pago:</strong> ${order.payment_method}</p>
        <hr/>
        <table>${itemsHtml}</table>
        <hr/>
        <p class="right bold">TOTAL: ${formatCurrency(order.total)}</p>
        ${order.notes ? `<hr/><p>Notas: ${order.notes}</p>` : ""}
        <hr/>
        <p class="center" style="font-size:10px;">Gracias por su compra</p>
      </body></html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Pedidos</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona todos los pedidos del restaurante
          </p>
        </div>
        <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Link href="/admin/pedidos/nuevo">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nuevo Pedido
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente o ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-secondary pl-9 text-foreground"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full bg-secondary text-foreground sm:w-48">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="en_preparacion">En Preparacion</SelectItem>
            <SelectItem value="completado">Completado</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-3">
        {loading && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-secondary" />
            ))}
          </div>
        )}
        {!loading && filtered.map((order) => (
          <Card key={order.id} className="border-border bg-card">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-primary">{order.order_number}</span>
                  <Badge
                    variant="secondary"
                    className={`text-xs ${getStatusColor(order.status)}`}
                  >
                    {getStatusLabel(order.status)}
                  </Badge>
                </div>
                <span className="text-sm font-medium text-foreground">{order.client_name}</span>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(order.created_at).toLocaleTimeString("es-CO", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span>{order.items.length} items</span>
                  <span className="capitalize">{order.payment_method}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-foreground">
                  {formatCurrency(order.total)}
                </span>
                {order.status !== "completado" && order.status !== "completed" && order.status !== "cancelado" && order.status !== "cancelled" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-success"
                    onClick={() => handleCompleteOrder(order.id)}
                    disabled={updatingId === order.id}
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span className="sr-only">Completar pedido</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => setSelectedOrder(order)}
                >
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">Ver detalle</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => handlePrint(order)}
                >
                  <Printer className="h-4 w-4" />
                  <span className="sr-only">Imprimir ticket</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!loading && filtered.length === 0 && (
          <Card className="border-border bg-card">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              No se encontraron pedidos
            </CardContent>
          </Card>
        )}
      </div>

      {/* Order detail dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-md bg-card text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Detalle del Pedido {selectedOrder?.order_number}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Cliente</span>
                  <p className="font-medium text-foreground">{selectedOrder.client_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Pago</span>
                  <p className="font-medium capitalize text-foreground">
                    {selectedOrder.payment_method}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Estado</span>
                  <Badge
                    variant="secondary"
                    className={`mt-1 text-xs ${getStatusColor(selectedOrder.status)}`}
                  >
                    {getStatusLabel(selectedOrder.status)}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Fecha</span>
                  <p className="font-medium text-foreground">
                    {new Date(selectedOrder.created_at).toLocaleString("es-CO")}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-muted-foreground">Items</span>
                {selectedOrder.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex flex-col">
                      <span className="text-foreground">
                        {item.quantity}x {item.product_name}
                      </span>
                      {item.notes && (
                        <span className="text-xs text-muted-foreground">
                          Nota: {item.notes}
                        </span>
                      )}
                    </div>
                    <span className="text-foreground">
                      {formatCurrency(item.unit_price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="flex items-center justify-between text-lg font-bold">
                <span className="text-foreground">Total</span>
                <span className="text-primary">{formatCurrency(selectedOrder.total)}</span>
              </div>
              {selectedOrder.notes && (
                <>
                  <Separator />
                  <div>
                    <span className="text-sm text-muted-foreground">Notas del pedido</span>
                    <p className="mt-1 text-sm text-foreground">{selectedOrder.notes}</p>
                  </div>
                </>
              )}
              <div className="flex gap-2">
                {selectedOrder.status !== "completado" && selectedOrder.status !== "completed" && selectedOrder.status !== "cancelado" && selectedOrder.status !== "cancelled" && (
                  <Button
                    className="flex-1 bg-success text-success-foreground hover:bg-success/90"
                    onClick={() => {
                      handleCompleteOrder(selectedOrder.id)
                    }}
                    disabled={updatingId === selectedOrder.id}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Completar Pedido
                  </Button>
                )}
                <Button
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => {
                    handlePrint(selectedOrder)
                    setSelectedOrder(null)
                  }}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimir Ticket
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
